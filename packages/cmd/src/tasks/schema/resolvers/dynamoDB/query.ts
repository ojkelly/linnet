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
    return `${headerString}

#if($context.arguments.where.id)
  #set($partitionKeyValue = $context.arguments.where.id)
#elseif($context.source.id)
  #set($partitionKeyValue = $context.source.id)
#end

{
  "version" : "2017-02-28",
  "operation" : "Query",
  "query": {
    "expression" : "#partitionKeyName = :partitionKeyValue AND #sortKeyName = :sortKeyValue",
      "expressionNames" : {
            "#partitionKeyName" : "id",
            "#sortKeyName" : "linnet:dataType"
        },
      "expressionValues": {
        ":partitionKeyValue": {"S": "$partitionKeyValue"},
        ":sortKeyValue": {"S": "Node"}
    }
  },
  "limit": 1,
}`;
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
    return `${headerString}


#if($ctx.result.items[0])
  #set($return = $util.map.copyAndRemoveAllKeys($ctx.result.items[0], $linnetFields))
  $util.toJson($return)
#else
  ## TODO: Handle null
  $util.toJson($ctx.result.items)
#end`;
}

export { generateRequestTemplate, generateResponseTemplate };
