import {
    parse,
    visit,
    visitWithTypeInfo,
    printSchema,
    DirectiveNode,
    typeFromAST,
    buildSchema,
    isType,
    isInputType,
    DocumentNode,
    ObjectTypeDefinitionNode,
    GraphQLSchema,
    GraphQLFieldConfig,
    GraphQLNamedType,
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLID,
    GraphQLNonNull,
    OperationDefinitionNode,
    TypeInfo,
    GraphQLDirective,
    GraphQLType,
    FieldDefinitionNode,
    subscribe,
    NonNullTypeNode,
} from "graphql";
import { mergeAst, mergeStrings } from "gql-merge";
import { formatString, formatAst } from "gql-format";
import * as pluralize from "pluralize";
import { directives } from "../../../../util/directives";
import { Config } from "../../../../../common/types";
import { Edge, EdgeCardinality } from "../extractEdges";

/**
 * Add the following Mutations
 * createType(data: CreateTypeInput)
 * updateType(data: UpdateTypeInput)
 * TODO: upsertType(data: UpsertTypeInput)
 * deleteType(where: DeleteTypeWhereInput)
 * TODO: deleteManyType(data: DeleteTypeWhereManyInput)
 *
 * Add add the following input types:
 * input CreateTypeInput {
 *  ...allFields (except id)
 * }
 *
 * input UpdateTypeInput {
 *  ...allFields (inc id)
 * }
 *
 * input UpsertTypeInput {
 *
 * }
 *
 * input DeleteTypeWhereInput {
 *  id: ID!
 * }
 *
 * @param node
 * @param type
 * @param newTypeFields.mutation
 */
function createTypes({
    node,
    type,
    newTypeFields,
    newTypeDataSourceMap,
    newInputTypes,
    edges,
}: {
    node: ObjectTypeDefinitionNode;
    type: GraphQLType;
    newTypeFields: any;
    newTypeDataSourceMap: any;
    newInputTypes: any;
    edges: Edge[];
}) {
    // TODO: add directive to prevent generation of 'many' types (to prevent Query.users)

    const connectionObjectType: GraphQLObjectType = new GraphQLObjectType({
        name: `${pluralize.singular(node.name.value)}Connection`,
        fields: () => ({
            edge: { type: type as GraphQLObjectType },
        }),
    });

    // [ query single ]-----------------------------------------------------------------------------
    newTypeFields.query[`${node.name.value}`] = {
        type: type,
        args: {
            where: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}WhereUnique`],
                ),
            },
        },
    };
    newTypeDataSourceMap.query[node.name.value] = {
        typeName: "Query",
        name: node.name.value,
        field: node.name.value,
        resolverType: "query",
    };

    // [ query plural ]-----------------------------------------------------------------------------
    // TODO: Add, orderBy, nextToken, limit
    newTypeFields.query[`${pluralize.plural(node.name.value)}`] = {
        name: `${pluralize.plural(node.name.value)}`,
        type: new GraphQLList(type),
        args: {
            where: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}Where`],
                ),
            },
            nextToken: { type: GraphQLString },
            limit: { type: GraphQLInt },
        },
    };
    newTypeDataSourceMap.query[`${pluralize.plural(node.name.value)}`] = {
        typeName: "Query",
        name: node.name.value,
        field: `${pluralize.plural(node.name.value)}`,
        resolverType: "plural",
    };

    // [ query Connection ]-------------------------------------------------------------------
    newTypeFields.query[`${node.name.value}Connection`] = {
        name: `${node.name.value}}Connection`,
        type: new GraphQLObjectType({
            name: `${node.name.value}Connection`,
            fields: () => ({
                edge: { type: type as GraphQLObjectType },
            }),
        }),
        args: {
            where: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}WhereUnique`],
                ),
            },
        },
    };
    newTypeDataSourceMap.query[`${node.name.value}Connection`] = {
        typeName: "Query",
        name: `${node.name.value}Connection`,
        field: `${node.name.value}Connection`,
        resolverType: "connection",
    };

    newTypeFields.query[`${pluralize.plural(node.name.value)}Connection`] = {
        name: `${pluralize.plural(node.name.value)}Connection`,
        type: new GraphQLObjectType({
            name: `${pluralize.plural(node.name.value)}Connection`,
            fields: () => ({
                edges: { type: new GraphQLList(type as GraphQLObjectType) },
                nextToken: { type: GraphQLString },
            }),
        }),
        args: {
            where: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}WhereUnique`],
                ),
                nextToken: { type: GraphQLString },
                limit: { type: GraphQLInt },
            },
        },
    };
    newTypeDataSourceMap.query[
        `${pluralize.plural(node.name.value)}Connection`
    ] = {
        typeName: "Query",
        name: `${pluralize.plural(node.name.value)}Connection`,
        field: `${pluralize.plural(node.name.value)}Connection`,
        resolverType: "connectionPlural",
    };

    // const edgesOnType = edges.forEach(edge => {
    //     if (edge.typeName === node.name.value) {
    //         if (edge.cardinality === EdgeCardinality.MANY) {
    //             newTypeDataSourceMap.query[
    //                 `${pluralize.plural(edge.fieldType)}Connection`
    //             ] = {
    //                 typeName: node.name.value,
    //                 name: `${pluralize.plural(edge.fieldType)}Connection`,
    //                 field: edge.field,
    //                 resolverType: "connectionPlural",
    //             };
    //         } else if (edge.cardinality === EdgeCardinality.ONE) {
    //             newTypeDataSourceMap.query[`${edge.fieldType}Connection`] = {
    //                 typeName: node.name.value,
    //                 name: `${edge.fieldType}Connection`,
    //                 field: edge.field,
    //                 resolverType: "connection",
    //             };
    //         }
    //     }
    // });

    // [ create ]-----------------------------------------------------------------------------------
    newTypeFields.mutation[`create${node.name.value}`] = {
        name: `create${node.name.value}`,
        type: type,
        args: {
            data: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}Data`],
                ),
            },
        },
    };
    newTypeDataSourceMap.mutation[`create${node.name.value}`] = {
        name: node.name.value,
        resolverType: "create",
    };

    // [ upsert ]-----------------------------------------------------------------------------------
    // Create or Update
    newTypeFields.mutation[`upsert${node.name.value}`] = {
        name: `upsert${node.name.value}`,
        type: type,
        args: {
            data: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}Data`],
                ),
            },
            where: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}WhereUnique`],
                ),
            },
        },
    };
    newTypeDataSourceMap.mutation[`upsert${node.name.value}`] = {
        name: node.name.value,
        resolverType: "upsert",
    };

    // [ update ]-----------------------------------------------------------------------------------
    newTypeFields.mutation[`update${node.name.value}`] = {
        name: `update${node.name.value}`,
        type: type,
        args: {
            data: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}Data`],
                ),
            },
            where: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}WhereUnique`],
                ),
            },
        },
    };
    newTypeDataSourceMap.mutation[`update${node.name.value}`] = {
        name: node.name.value,
        resolverType: "update",
    };

    // [ updateMany ]-------------------------------------------------------------------------------
    newTypeFields.mutation[`updateMany${pluralize.plural(node.name.value)}`] = {
        name: `updateMany${pluralize.plural(node.name.value)}`,
        type: newInputTypes["BatchPayload"],
        args: {
            data: {
                type: new GraphQLNonNull(
                    new GraphQLList(newInputTypes[`${node.name.value}Data`]),
                ),
            },
            // TODO: add custom where fields to this
            where: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}Where`],
                ),
            },
        },
    };
    newTypeDataSourceMap.mutation[
        `updateMany${pluralize.plural(node.name.value)}`
    ] = { name: node.name.value, resolverType: "updateMany" };

    // [ delete ]-----------------------------------------------------------------------------------
    newTypeFields.mutation[`delete${node.name.value}`] = {
        name: `delete${node.name.value}`,
        type: newInputTypes["BatchPayload"],
        args: {
            where: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}WhereUnique`],
                ),
            },
        },
    };
    newTypeDataSourceMap.mutation[`delete${node.name.value}`] = {
        name: node.name.value,
        resolverType: "delete",
    };

    // [ deleteMany ]-------------------------------------------------------------------------------
    newTypeFields.mutation[`deleteMany${pluralize.plural(node.name.value)}`] = {
        name: `deleteMany${pluralize.plural(node.name.value)}`,
        type: newInputTypes["BatchPayload"],
        args: {
            where: {
                type: new GraphQLNonNull(
                    newInputTypes[`${node.name.value}Where`],
                ),
            },
        },
    };
    newTypeDataSourceMap.mutation[
        `deleteMany${pluralize.plural(node.name.value)}`
    ] = { name: node.name.value, resolverType: "deleteMany" };
}

export { createTypes };
