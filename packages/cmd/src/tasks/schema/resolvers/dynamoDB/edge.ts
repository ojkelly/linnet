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
    // The edge type, only passing in the edge for this field.
    let edge = edges[0];
    let index = "";

    // If this edge is not the principle, we need to query the other way around using
    // the GSI
    if (edge.principal === EdgePrinciple.FALSE) {
        index = `"index":"edge-dataType",`;
    }
    return `${headerString}

#set($isPrinciple = "${edge.principal}")
#if($isPrinciple == "${EdgePrinciple.TRUE}")
  #set($partitionKeyName = 'id')
#elseif($isPrinciple == "${EdgePrinciple.FALSE}")
  #set($partitionKeyName = 'linnet:edge')
#end

#if($context.arguments.where.id)
  #set($partitionKey = $context.arguments.where.id)
#else
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
        ":sortKeyValue": {"S": "${edge.edgeName}"}
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
    // The edge type, only passing in the edge for this field.
    const edge = edges[0];

    // #set(cardinality = "${edge.cardinality}")

    // #if(cardinality == "ONE")
    //   $util.toJson($result[0])
    // #else if(cardinality == "MANY")
    //   $util.toJson($result[0])
    // #end
    return `${headerString}

#set($isPrinciple = "${edge.principal}")
#set($return = [])
#foreach($item in $ctx.result.items)
  #if($isPrinciple == "${EdgePrinciple.TRUE}")
    $util.qr($return.add({
    'id': $item["linnet:edge"]
    }))
  #elseif($isPrinciple == "${EdgePrinciple.FALSE}")
    $util.qr($return.add({
      'id': $item.id
    }))
  #end
#end
$util.toJson($return)
`;
}

export { generateRequestTemplate, generateResponseTemplate };
