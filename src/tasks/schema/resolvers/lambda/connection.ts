import { GraphQLField } from "graphql";

import {
  DataSourceTemplate,
  DataSourceDynamoDBConfig,
} from "../../dataSources/dataSources";
import { Edge } from "../../schemaProcessing/steps/generateArtifacts/extractEdges";

function generateRequestTemplate({
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

  return `${headerString}

## ResolverType: ${resolverType}
## Edge: ${JSON.stringify(edge)}

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
  resolverType,
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
  return `${headerString}
## ResolverType: ${resolverType}
#set($result = $util.parseJson($util.base64Decode($ctx.result)))

#if(!$ctx.result.errors.isEmpty())
	#foreach( $err in $ctx.result.errors )
    	$utils.appendError($ctx.error.message, $err)
    #end
#end

{
  "edge": $util.toJson($result.data),
}`;
}

export { generateRequestTemplate, generateResponseTemplate };
