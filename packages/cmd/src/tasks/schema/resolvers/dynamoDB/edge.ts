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
## ResolverType: ${resolverType}

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
        ":partitionKeyValue": {"S": "$ctx.source.edge"},
        ":sortKeyValue": {"S": "Node"}
    }
  },
  "limit": 1,
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
## ResolverType: ${resolverType}

#if($ctx.result.items[0])
  #set($return = $util.map.copyAndRemoveAllKeys($ctx.result.items[0], $linnetFields))
  $util.toJson($return)
#else
  ## TODO: Handle null
  $util.toJson($ctx.result.items)
#end
`;
}

export { generateRequestTemplate, generateResponseTemplate };
