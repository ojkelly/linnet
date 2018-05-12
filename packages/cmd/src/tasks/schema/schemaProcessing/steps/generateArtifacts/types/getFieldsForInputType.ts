import {
    parse,
    visit,
    visitWithTypeInfo,
    printSchema,
    GraphQLOutputType,
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
    getNamedType,
    FieldDefinitionNode,
    subscribe,
    NonNullTypeNode,
} from "graphql";
import { mergeAst, mergeStrings } from "gql-merge";
import { formatString, formatAst } from "gql-format";
import * as pluralize from "pluralize";
import { directives } from "../../../../util/directives";
import { Config } from "../../../../../common/types";
import { Edge, EdgeCardinality, getTypeFromEdge } from "../extractEdges";
import { capitalizeFirstLetter } from "../../../../util/capitalise";

enum mutationType {
    CREATE = "Create",
    UPDATE = "Update",
}
/**
 * Get all the fields for a type
 * @param options
 */
function getFieldsForInputType({
    type,
    node,
    newInputTypes,
    mutation,
    hideField,
    edges,
}: {
    node?: ObjectTypeDefinitionNode;
    type: GraphQLType;
    newInputTypes: any;
    mutation: mutationType;
    // Optionally hide a field from the final input
    hideField?: string;
    edges: Edge[];
}): any {
    const typeFields = (type as GraphQLObjectType).getFields();

    const fields = {};
    const namedType = getNamedType(type);

    Object.keys(typeFields).forEach(typeFieldKey => {
        const subType = typeFields[typeFieldKey].type;
        const namedSubType = getNamedType(subType);
        let foundEdge = false;

        // The underlying type is a named Type
        if (
            namedSubType.astNode &&
            namedSubType.astNode.kind === "ObjectTypeDefinition" &&
            typeFields[typeFieldKey].astNode
        ) {
            const subTypeAst = typeFields[typeFieldKey].astNode;

            if (subTypeAst && subTypeAst.directives) {
                const subTypeAstDirectives = subTypeAst.directives;

                const edgeDirective = subTypeAstDirectives.find(
                    subTypeAstDirective =>
                        subTypeAstDirective.name.value === "edge",
                );
                /**
                 * Edge Input Types
                 */
                if (edgeDirective) {
                    const edge = edges.find((edge: Edge) => {
                        if (
                            edge.typeName === node.name.value &&
                            edge.field === typeFieldKey
                        ) {
                            return true;
                        }
                        return false;
                    });

                    foundEdge = true;

                    const newInnerFieldName: string = `${
                        edge.fieldType
                    }${mutation}Without${capitalizeFirstLetter(
                        edge.counterpart.field,
                    )}`;
                    let newFieldName: string;

                    if (edge.cardinality === EdgeCardinality.ONE) {
                        newFieldName = `${capitalizeFirstLetter(
                            typeFieldKey,
                        )}${mutation}On${capitalizeFirstLetter(edge.typeName)}`;
                    } else if (edge.cardinality === EdgeCardinality.MANY) {
                        newFieldName = `${capitalizeFirstLetter(
                            typeFieldKey,
                        )}${mutation}ManyOn${capitalizeFirstLetter(
                            edge.typeName,
                        )}`;
                    }
                    // switch (subTypeAst.type.kind) {
                    //     case "ListType":
                    //         newInnerFieldName = `${
                    //             edge.fieldType
                    //         }${mutation}ManyWithout${capitalizeFirstLetter(
                    //             edge.counterpart.field,
                    //         )}`;
                    //         break;
                    //     case "NonNullType":
                    //         if (subTypeAst.type.type) {
                    //             switch (subTypeAst.type.type.kind) {
                    //                 case "ListType":
                    //                     newInnerFieldName = `${
                    //                         edge.fieldType
                    //                     }${mutation}ManyWithout${capitalizeFirstLetter(
                    //                         edge.counterpart.field,
                    //                     )}`;
                    //                     break;
                    //                 case "NamedType":
                    //                     newInnerFieldName = `${
                    //                         edge.fieldType
                    //                     }${mutation}Without${capitalizeFirstLetter(
                    //                         edge.counterpart.field,
                    //                     )}`;
                    //                     break;
                    //             }
                    //         }
                    //         break;
                    //     case "NamedType":
                    //         newInnerFieldName = `${
                    //             edge.fieldType
                    //         }${mutation}Without${capitalizeFirstLetter(
                    //             edge.counterpart.field,
                    //         )}`;
                    //         break;
                    // }

                    // @edge field

                    if (typeof newInputTypes[newFieldName] === "undefined") {
                        if (edge.cardinality === EdgeCardinality.ONE) {
                            newInputTypes[
                                newFieldName
                            ] = new GraphQLInputObjectType({
                                name: newFieldName,
                                fields: () => ({
                                    create: {
                                        type: newInputTypes[newInnerFieldName],
                                    },
                                    connection: {
                                        type: GraphQLID,
                                    },
                                }),
                                description:
                                    typeFields[typeFieldKey].description,
                            });
                        } else if (edge.cardinality === EdgeCardinality.MANY) {
                            newInputTypes[
                                newFieldName
                            ] = new GraphQLInputObjectType({
                                name: newFieldName,
                                fields: () => ({
                                    create: {
                                        type: new GraphQLList(
                                            newInputTypes[newInnerFieldName],
                                        ),
                                    },
                                    connection: {
                                        type: new GraphQLList(GraphQLID),
                                    },
                                }),
                                description:
                                    typeFields[typeFieldKey].description,
                            });
                        }
                    }

                    fields[typeFieldKey] = {
                        name: typeFieldKey,
                        type: edge.required
                            ? new GraphQLNonNull(newInputTypes[newFieldName])
                            : newInputTypes[newFieldName],
                        description: typeFields[typeFieldKey].description,
                        directives: subTypeAstDirectives,
                    };
                }
            }
        }

        // If no edge was found, this is a normal field that needs to be added as is.
        if (foundEdge === false) {
            if (
                typeFields[typeFieldKey].name === "createdBy" ||
                typeFields[typeFieldKey].name === "createdAt" ||
                typeFields[typeFieldKey].name === "updatedAt"
            ) {
                // createdAt and updatedAt are added by the resolvers
                // So theyre hidden field
            } else {
                // Add the remaining fields
                fields[typeFieldKey] = {
                    type: typeFields[typeFieldKey].type,
                    name: typeFields[typeFieldKey].name,
                    description: typeFields[typeFieldKey].description,
                };
            }
        }
        if (hideField && typeFields[typeFieldKey].name === hideField) {
            delete fields[typeFieldKey];
        }
    });
    // console.dir(fields);
    return fields;
}

export { getFieldsForInputType, mutationType };
