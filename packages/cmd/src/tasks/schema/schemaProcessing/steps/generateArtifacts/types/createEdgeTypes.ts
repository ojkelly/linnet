import {
    parse,
    GraphQLObjectTypeConfig,
    visit,
    astFromValue,
    visitWithTypeInfo,
    printSchema,
    DirectiveNode,
    typeFromAST,
    buildSchema,
    isType,
    isInputType,
    DocumentNode,
    GraphQLArgument,
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

import { getFieldsForInputType } from "./getFieldsForInputType";
import { Edge, EdgeCardinality } from "../extractEdges";
/**
 * Create all the input types for a Type
 * and store them on the newInputTypes object
 * @param options
 */
function createEdgeTypes({
    edges,
    schemaDocument,
}: {
    edges: Edge[];
    schemaDocument: DocumentNode;
}): DocumentNode {
    return visit(schemaDocument, {
        leave: (node: any) => {
            if (node.kind === "ObjectTypeDefinition") {
                if (
                    node.name.value === "Query" ||
                    node.name.value === "Mutation" ||
                    node.name.value === "Subscription"
                ) {
                    // https://www.youtube.com/watch?v=otCpCn0l4Wo

                    return;
                }
                edges.forEach(edge => {
                    if (node.name.value === edge.typeName) {
                        node.fields = node.fields.map(field => {
                            const args = [...field.arguments];
                            let returnType = field.type;
                            if (field.name.value === edge.field) {
                                let inputType;
                                if (edge.cardinality === EdgeCardinality.ONE) {
                                    args.push({
                                        kind: "InputValueDefinition",
                                        name: {
                                            kind: "Name",
                                            value: "where",
                                        },
                                        type: {
                                            kind: "NamedType",
                                            name: {
                                                kind: "Name",
                                                value: `${
                                                    edge.fieldType
                                                }WhereUnique`,
                                            },
                                        },
                                    });
                                    returnType = {
                                        kind: "NamedType",
                                        name: {
                                            kind: "Name",
                                            value: `${
                                                edge.fieldType
                                            }Connection`,
                                        },
                                    };
                                } else if (
                                    edge.cardinality === EdgeCardinality.MANY
                                ) {
                                    args.push({
                                        kind: "InputValueDefinition",
                                        name: {
                                            kind: "Name",
                                            value: "where",
                                        },
                                        type: {
                                            kind: "NamedType",
                                            name: {
                                                kind: "Name",
                                                value: `${edge.fieldType}Where`,
                                            },
                                        },
                                    });
                                    args.push({
                                        kind: "InputValueDefinition",
                                        name: {
                                            kind: "Name",
                                            value: "nextToken",
                                        },
                                        type: {
                                            kind: "NamedType",
                                            name: {
                                                kind: "Name",
                                                value: "String",
                                            },
                                        },
                                    });
                                    args.push({
                                        kind: "InputValueDefinition",
                                        name: {
                                            kind: "Name",
                                            value: "limit",
                                        },
                                        type: {
                                            kind: "NamedType",
                                            name: {
                                                kind: "Name",
                                                value: "Int",
                                            },
                                        },
                                    });
                                    returnType = {
                                        kind: "NamedType",
                                        name: {
                                            kind: "Name",
                                            value: `${
                                                edge.fieldType
                                            }Connection`,
                                        },
                                    };
                                }
                            }
                            return {
                                ...field,
                                type: returnType,
                                arguments: args,
                            };
                        });
                    }
                });
            }

            return node;
        },
    });
}

export { createEdgeTypes };
