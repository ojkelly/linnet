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

    // TODO: we cant find the write edge here, and therefore we dont accurately know how to look
    // up the relation
    // we need to pass the edge information at runtime

    // The connection resolver is only passed one edge
    let edge = edges[0];
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

#if($context.arguments.where.id)
  #set($partitionKey = $context.arguments.where.id)
#end

#if($context.source.id)
  #set($partitionKey = $context.source.id)
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

    if (edge.principal === EdgePrinciple.FALSE) {
        edgeField = `linnet:edge`;
    }

    if (edge.principal === EdgePrinciple.TRUE) {
        edgeField = `id`;
    }

    return `${headerString}
## ResolverType: ${resolverType}

{
   "edge": $util.toJson($ctx.result.items[0]['${edgeField}']),
}

`;
}

export { generateRequestTemplate, generateResponseTemplate };
