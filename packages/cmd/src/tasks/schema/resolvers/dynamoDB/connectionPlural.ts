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

    // If this edge is not the principle, we need to query the other way around using
    // the GSI
    if (edge.principal === EdgePrinciple.FALSE) {
        index = `"index":"edge-dataType",`;
    }
    return `${headerString}
    #set($sortKeyValue = '')

    #set($isPrinciple = "${edge.principal}")
    #if($isPrinciple == "${EdgePrinciple.TRUE}")
      #set($partitionKeyName = 'id')
    #elseif($isPrinciple == "${EdgePrinciple.FALSE}")
      #set($partitionKeyName = 'linnet:edge')
    #end

    #if($context.arguments.where.id)
      #set($partitionKey = $context.arguments.where.id)
    #end

    #if($context.arguments.source.parentId)
      #set($partitionKey = $context.source.parentId)
      #set($sortKeyValue = context.arguments.source.edgeName)

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
      "limit": $util.defaultIfNull($context.arguments.limit, 1),
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
    const dataSourceConfig: DataSourceDynamoDBConfig = dataSource.config as DataSourceDynamoDBConfig;

    return `${headerString}
$util.toJson($ctx.result.data["${dataSourceConfig.tableName}"]),
`;
}

// {
//   "edges": $util.toJson($context.result.items),
//   "nextToken": $util.toJson($context.result.nextToken)
//   }

export { generateRequestTemplate, generateResponseTemplate };
