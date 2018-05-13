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
import { Edge } from "../schemaProcessing/steps/generateArtifacts/extractEdges";

import { Config } from "../../common/types";
import { generateDynamoDBResolverTemplate } from "./dynamoDB";
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

    // [ Query Resolvers ]--------------------------------------------------------------------------

    Object.keys(queryTypeMap).forEach(field => {
        // Search for this node in our dataSources
        if (newTypeDataSourceMap.query[field]) {
            // Load the dataSource
            const dataSource: DataSourceTemplate =
                dataSourceTemplates[newTypeDataSourceMap.query[field].name];

            switch (dataSource.type) {
                case DataSource.DynamoDB:
                    if (
                        newTypeDataSourceMap.query[field].resolverType ===
                        "connection"
                    ) {
                        resolverTemplates[
                            field
                        ] = generateDynamoDBResolverTemplate({
                            dataSource,
                            typeName: field,
                            fieldName: "edge",
                            fieldType: queryTypeMap[field],
                            resolverType: "connection",
                            namedType: newTypeDataSourceMap.query[field].name,
                            edges,
                        });
                    } else if (
                        newTypeDataSourceMap.query[field].resolverType ===
                        "connectionPlural"
                    ) {
                        resolverTemplates[
                            field
                        ] = generateDynamoDBResolverTemplate({
                            dataSource,
                            typeName: field,
                            fieldName: "edges",
                            fieldType: queryTypeMap[field],
                            resolverType: "connectionPlural",
                            namedType: newTypeDataSourceMap.query[field].name,
                            edges,
                        });
                    } else {
                        resolverTemplates[
                            field
                        ] = generateDynamoDBResolverTemplate({
                            dataSource,
                            typeName: "Query",
                            fieldName: field,
                            fieldType: queryTypeMap[field],
                            resolverType:
                                newTypeDataSourceMap.query[field].resolverType,
                            namedType: newTypeDataSourceMap.query[field].name,
                            edges,
                        });
                    }
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
                    if (
                        newTypeDataSourceMap.mutation[field].resolverType ===
                        "create"
                        // newTypeDataSourceMap.mutation[field].resolverType ===
                        //     "upsert" ||
                        // newTypeDataSourceMap.mutation[field].resolverType ===
                        //     "update" ||
                        // newTypeDataSourceMap.mutation[field].resolverType ===
                        //     "updateMany"
                    ) {
                        // Add the lambda mutation resolver
                        resolverTemplates[
                            field
                        ] = generateLambdaResolverTemplate({
                            config,
                            dataSource,
                            typeName: "Mutation",
                            fieldName: field,
                            fieldType: mutationTypeMap[field],
                            resolverType:
                                newTypeDataSourceMap.mutation[field]
                                    .resolverType,
                            namedType:
                                newTypeDataSourceMap.mutation[field].name,
                            edges,
                        });
                    } else {
                        resolverTemplates[
                            field
                        ] = generateDynamoDBResolverTemplate({
                            dataSource,
                            typeName: "Mutation",
                            fieldName: field,
                            fieldType: mutationTypeMap[field],
                            resolverType:
                                newTypeDataSourceMap.mutation[field]
                                    .resolverType,
                            namedType:
                                newTypeDataSourceMap.mutation[field].name,
                            edges,
                        });
                    }
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
                dataSourceTemplates[
                    newTypeDataSourceMap.query[edge.fieldType].name
                ];

            switch (dataSource.type) {
                case DataSource.DynamoDB:
                    resolverTemplates[
                        `${edge.fieldType}.${edge.field}`
                    ] = generateDynamoDBResolverTemplate({
                        dataSource,
                        typeName: edge.typeName,
                        fieldName: edge.field,
                        fieldType: queryTypeMap[edge.fieldType],
                        resolverType: "edge",
                        namedType:
                            newTypeDataSourceMap.query[edge.fieldType].name,
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
