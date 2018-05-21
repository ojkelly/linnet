import { GraphQLField, GraphQLType, GraphQLNamedType } from "graphql";

import {
    ResolverTemplate,
    ResolverTemplates,
    ResolverMappingType,
} from "../types";

import {
    DataSource,
    DataSourceTemplate,
    DataSourceTemplates,
    DataSourceDynamoDBConfig,
} from "../../dataSources/dataSources";
import {
    Edge,
    EdgePrinciple,
} from "../../schemaProcessing/steps/generateArtifacts/extractEdges";

function generateRequestTemplate({
    fieldName,
    fieldType,
    namedType,
    dataSource,
    resolverType,
    edges,
    headerString,
}: {
    fieldName: string;
    namedType: string;
    fieldType: GraphQLField<any, any, any>;
    dataSource: DataSourceTemplate;
    resolverType: string;
    edges: Edge[];
    headerString: string;
}): string | any {
    const dataSourceConfig: DataSourceDynamoDBConfig = dataSource.config as DataSourceDynamoDBConfig;

    let edge = edges[0];
    let index = "";
    let partitionKeyName = "";

    if (edge.principal === EdgePrinciple.TRUE) {
        index = `"index":"edge-dataType",`;
        partitionKeyName = `#set($partitionKeyName = 'linnet:edge')`;
    }
    // If this edge is not the principle, we need to query the other way around using
    // the GSI
    if (edge.principal === EdgePrinciple.FALSE) {
        partitionKeyName = `#set($partitionKeyName = 'id')`;
    }

    return `${headerString}
## ResolverType: ${resolverType}
## Edge: ${JSON.stringify(edge)}

#set($sortKeyValue = '${edge.edgeName}')

${partitionKeyName}

#if($context.arguments.where.id)
  #set($partitionKey = $context.arguments.where.id)
#end

#if($context.source['${fieldName}'].parentId)
  #set($partitionKey = $context.source['${fieldName}'].parentId)
  #set($sortKeyValue = $context.arguments.source.edgeName)
#end

{
  "version" : "2017-02-28",
  "operation" : "Query",
  ${index}
  "query": {
    "expression" : "#partitionKeyName = :partitionKeyValue AND begins_with(#sortKeyName, :sortKeyValue)",
      "expressionNames" : {
            "#partitionKeyName" : "$partitionKeyName",
            "#sortKeyName" : "linnet:dataType"
        },
      "expressionValues": {
        ":partitionKeyValue": {"S": "$partitionKey"},
        ":sortKeyValue": {"S": "$sortKeyValue"}
    }
  },
  "limit": 1,
  "nextToken": $util.toJson($util.defaultIfNullOrBlank($context.arguments.nextToken, null))
}
`;
}

function generateResponseTemplate({
    fieldName,
    fieldType,
    namedType,
    dataSource,
    resolverType,
    edges,
    headerString,
}: {
    fieldName: string;
    namedType: string;
    fieldType: GraphQLField<any, any, any>;
    dataSource: DataSourceTemplate;
    resolverType: string;
    edges: Edge[];
    headerString: string;
}): string | any {
    let edge = edges[0];
    let field = "";

    if (edge.principal === EdgePrinciple.TRUE) {
        field = `id`;
    }
    // If this edge is not the principle, we need get the edge value
    if (edge.principal === EdgePrinciple.FALSE) {
        field = `linnet:edge`;
    }

    return `${headerString}
## ResolverType: ${resolverType}
#set($results = [])
#foreach($item in $ctx.result.items)
  #if($item['${field}'])
      $util.qr($results.add($item['${field}']))
  #end
#end

{
  "edge": $util.toJson($results[0]),
}

`;
}

export { generateRequestTemplate, generateResponseTemplate };
