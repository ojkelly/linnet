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

    return `${headerString}

#set($isPrinciple = "${edge.principal}")
#if($isPrinciple == "${EdgePrinciple.TRUE}")
  #set($keyName = 'id')
#elseif($isPrinciple == "${EdgePrinciple.FALSE}")
  #set($keyName = 'edge')
#end

#set($ids = [])
#foreach($item in $ctx.source)
  #set($map = {})
  $util.qr($map.put("id", $util.dynamodb.toString($item[$keyName])))
  $util.qr($map.put("linnet:dataType", $util.dynamodb.toString("Node")))
  $util.qr($ids.add($map))
#end
{
  "version" : "2018-05-29",
  "operation" : "BatchGetItem",
  "tables" : {
    "${dataSourceConfig.tableName}": {
          "keys": $util.toJson($ids),
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
$util.toJson($ctx.result.data["${dataSourceConfig.tableName}"]),
`;
}

// {
//   "edges": $util.toJson($context.result.items),
//   "nextToken": $util.toJson($context.result.nextToken)
//   }

export { generateRequestTemplate, generateResponseTemplate };
