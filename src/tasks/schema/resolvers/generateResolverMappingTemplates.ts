import * as _ from "lodash";
import {
  ResolverTemplate,
  ResolverTemplates,
  ResolverMappingType,
} from "./types";
import {
  visit,
  parse,
  buildSchema,
  GraphQLField,
  GraphQLType,
  ObjectTypeDefinitionNode,
  StringValueNode,
  DocumentNode,
  GraphQLSchema,
  GraphQLNamedType,
} from "graphql";
import {
  DataSource,
  DataSourceTemplate,
  DataSourceTemplates,
} from "../dataSources/dataSources";
import * as pluralize from "pluralize";
import {
  Edge,
  EdgeCardinality,
} from "../schemaProcessing/steps/generateArtifacts/extractEdges";
import { generateDynamoDBDataSourceTemplate } from "../dataSources/dynamoDB";

import { Config } from "../../common/types";
import { generateLambdaResolverTemplate } from "./lambda";
/**
 * Generate the actual reolverMapping template, now we know all the fields
 * and what the dataSource is
 * @param options
 */
function generateResolverMappingTemplates({
  dataSourceTemplates,
  newTypeDataSourceMap,
  types,
  typeDefs,
  edges,
  config,
}: {
  dataSourceTemplates: DataSourceTemplates;
  newTypeDataSourceMap: any;
  types: any;
  typeDefs: string;
  edges: Edge[];
  config: Config;
}): ResolverTemplates {
  const resolverTemplates: ResolverTemplates | any = {};
  const ast = parse(typeDefs);
  const schema: GraphQLSchema = buildSchema(typeDefs);

  const queryType = schema.getQueryType();
  if (!queryType) {
    throw new Error();
  }
  const queryTypeMap = queryType.getFields();

  const dataSourceDynamo = generateDynamoDBDataSourceTemplate({
    config,
  });
  // [ Query Resolvers ]--------------------------------------------------------------------------

  Object.keys(queryTypeMap).forEach(field => {
    // Search for this node in our dataSources
    if (newTypeDataSourceMap.query[field]) {
      resolverTemplates[field] = generateLambdaResolverTemplate({
        dataSource: dataSourceDynamo,
        field,
        config,
        typeName: newTypeDataSourceMap.query[field].typeName,
        fieldName: newTypeDataSourceMap.query[field].field,
        fieldType: queryTypeMap[field],
        resolverType: newTypeDataSourceMap.query[field].resolverType,
        namedType: newTypeDataSourceMap.query[field].name,
        edges,
      });
    }
  });

  // [ Mutation Resolvers ]-----------------------------------------------------------------------

  const mutationType = schema.getMutationType();
  if (!mutationType) {
    throw new Error();
  }

  const mutationTypeMap = mutationType.getFields();
  Object.keys(mutationTypeMap).forEach(field => {
    // Search for this node in our dataSources
    if (newTypeDataSourceMap.mutation[field]) {
      // Load the dataSource
      const dataSource: DataSourceTemplate =
        dataSourceTemplates[newTypeDataSourceMap.mutation[field].name];

      switch (dataSource.type) {
        case DataSource.DynamoDB:
          // Add the lambda mutation resolver
          resolverTemplates[field] = generateLambdaResolverTemplate({
            field,
            config,
            dataSource,
            typeName: "Mutation",
            fieldName: field,
            fieldType: mutationTypeMap[field],
            resolverType: newTypeDataSourceMap.mutation[field].resolverType,
            namedType: newTypeDataSourceMap.mutation[field].name,
            edges,
          });
          break;
        case DataSource.ElasticSearch:
          break;
        case DataSource.Lambda:
          break;
        case DataSource.None:
          break;
      }
    }
  });

  // [ Edge Type Resolvers ]----------------------------------------------------------------------

  edges.forEach(edge => {
    // Search for this node in our dataSources
    if (newTypeDataSourceMap.query[edge.fieldType]) {
      // Load the dataSource
      const dataSource: DataSourceTemplate =
        dataSourceTemplates[newTypeDataSourceMap.query[edge.fieldType].name];

      switch (dataSource.type) {
        case DataSource.DynamoDB:
          // Edge Connection
          let connectionTypeName;
          let connectionEdgeFieldName;

          if (edge.cardinality === EdgeCardinality.ONE) {
            connectionTypeName = `${edge.counterpart.typeName}Connection`;
            connectionEdgeFieldName = `${connectionTypeName}.edge`;
          } else if (edge.cardinality === EdgeCardinality.MANY) {
            connectionTypeName = `${pluralize.plural(
              edge.counterpart.typeName,
            )}Connection`;
            connectionEdgeFieldName = `${connectionTypeName}.edges`;
          }
          resolverTemplates[
            `${edge.typeName}.${edge.field}`
          ] = generateLambdaResolverTemplate({
            field: edge.counterpart.typeName,
            config,
            dataSource,
            typeName: edge.typeName,
            fieldName: edge.field,
            fieldType: queryTypeMap[edge.fieldType],
            resolverType:
              newTypeDataSourceMap.query[connectionTypeName].resolverType,
            namedType: newTypeDataSourceMap.query[connectionTypeName].name,
            edges: [edge],
          });

          break;
        case DataSource.ElasticSearch:
          break;
        case DataSource.Lambda:
          break;
        case DataSource.None:
          break;
      }
    }
  });

  return resolverTemplates;
}
export { generateResolverMappingTemplates };
