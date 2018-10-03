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
  DataSourceLambdaConfig,
} from "../../dataSources/dataSources";
import {
  Edge,
  EdgePrinciple,
} from "../../schemaProcessing/steps/generateArtifacts/extractEdges";
import * as pluralize from "pluralize";

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

  // We need to add config data to the request template, that will be pushed to the lambda function
  return `${headerString}

#set($payload = {})


#set($payload.linnetFields = $linnetFields)
#set($payload.dataSource = ${JSON.stringify(dataSourceConfig)})

#set($payload.namedType = "${namedType}")
#set($payload.edgeTypes = ${JSON.stringify(edges)})

#set($payload.context = $context)
{
  "version": "2017-02-28",
  "operation": "Invoke",
  "payload": $util.toJson($payload),
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

  #set($result = $util.parseJson($util.base64Decode($ctx.result)))

  #if(!$util.isNull($result.errors))
    #foreach($err in $result.errors)
      #if( $util.isString($err) )
        $util.appendError($err)
      #end
    #end
  #end

  $util.toJson($result.data)`;
}

export { generateRequestTemplate, generateResponseTemplate };
