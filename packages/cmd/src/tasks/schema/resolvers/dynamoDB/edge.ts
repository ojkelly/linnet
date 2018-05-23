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
    // #set(cardinality = "${edge.cardinality}")

    // #if(cardinality == "ONE")
    //   $util.toJson($result[0])
    // #else if(cardinality == "MANY")
    //   $util.toJson($result[0])
    // #end
    return `${headerString}
## ResolverType: ${resolverType}

$util.toJson($util.map.copyAndRemoveAllKeys($ctx.result.items[0], $linnetFields))
`;
}

export { generateRequestTemplate, generateResponseTemplate };
