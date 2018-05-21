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

    return `${headerString}
## ResolverType: ${resolverType}

#set($keys = [])
#foreach($id in $ctx.source.edges)
  #set($map = {})
  $util.qr($map.put("id", $util.dynamodb.toString($id)))
  $util.qr($map.put("linnet:dataType", $util.dynamodb.toString("Node")))
  $util.qr($keys.add($map))
#end
{
  "version" : "2018-05-29",
  "operation" : "BatchGetItem",
  "tables" : {
    "${dataSourceConfig.tableName}": {
          "keys": $util.toJson($keys),
          "consistentRead": true
      }
  }
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
## ResolverType: ${resolverType}

$util.toJson($ctx.result.data["${dataSourceConfig.tableName}"])
`;
}

export { generateRequestTemplate, generateResponseTemplate };