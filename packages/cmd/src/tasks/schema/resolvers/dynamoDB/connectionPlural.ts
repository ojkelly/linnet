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
    field,
    fieldName,
    fieldType,
    namedType,
    dataSource,
    resolverType,
    edges,
    headerString,
}: {
    field: string;
    fieldName: string;
    namedType: string;
    fieldType: GraphQLField<any, any, any>;
    dataSource: DataSourceTemplate;
    resolverType: string;
    edges: Edge[];
    headerString: string;
}): string | any {
    const dataSourceConfig: DataSourceDynamoDBConfig = dataSource.config as DataSourceDynamoDBConfig;

    // The connection resolver is only passed one edge
    let edge = edges[0];

    console.log({
        edge: edges[0],
    });

    let index = "";
    let partitionKeyName = "";

    if (edge.principal === EdgePrinciple.TRUE) {
        partitionKeyName = `#set($partitionKeyName = 'id')`;
    }
    // If this edge is not the principle, we need to query the other way around using
    // the GSI
    if (edge.principal === EdgePrinciple.FALSE) {
        index = `"index":"edge-dataType",`;
        partitionKeyName = `#set($partitionKeyName = 'linnet:edge')`;
    }

    return `${headerString}

## ResolverType: ${resolverType}
## Edge: ${JSON.stringify(edge)}

#set($sortKeyValue = '${edge.edgeName}')

${partitionKeyName}


#if($!{context.source['${fieldName}'].parentId} != "")
  #set($partitionKey = $context.source['${fieldName}'].parentId)
  #end

#if($!{context.source.id} != "")
 #set($partitionKey = $context.source.id)
 #end

#if($!{context.arguments.where.id} != "")
  #set($partitionKey = $context.arguments.where.id)
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
  "limit": $util.defaultIfNull($context.arguments.limit, 10),
  "nextToken": $util.toJson($util.defaultIfNullOrBlank($context.arguments.nextToken, null))
}
`;
}

function generateResponseTemplate({
    field,

    fieldName,
    fieldType,
    namedType,
    dataSource,
    resolverType,
    edges,
    headerString,
}: {
    field: string;
    fieldName: string;
    namedType: string;
    fieldType: GraphQLField<any, any, any>;
    dataSource: DataSourceTemplate;
    resolverType: string;
    edges: Edge[];
    headerString: string;
}): string | any {
    // The connection resolver is only passed one edge
    let edge = edges[0];
    let edgeField = "";

    if (edge.principal === EdgePrinciple.TRUE) {
        edgeField = `linnet:edge`;
    }
    // If this edge is not the principle, we need get the edge value
    if (edge.principal === EdgePrinciple.FALSE) {
        edgeField = `id`;
    }

    return `${headerString}
## ResolverType: ${resolverType}

#set($results = [])
#foreach($item in $ctx.result.items)
  $util.qr($results.add($item['${edgeField}']))
#end

{
  "edges": $util.toJson($results),
  "nextToken": $util.toJson($context.result.nextToken)
}

`;
}

export { generateRequestTemplate, generateResponseTemplate };
