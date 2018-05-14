import {
    visit,
    FieldDefinitionNode,
    GraphQLNamedType,
    GraphQLType,
    NamedTypeNode,
    StringValueNode,
    GraphQLObjectType,
    TypeNode,
} from "graphql";
import * as pluralize from "pluralize";

/**
 * From an AST extract the edges as defined by
 * @relation directives
 *
 * These will be used to inform the resolver templates
 *
 * @param options
 */
function extractEdges({
    ast,
    schema,
    newTypeFields,
    newTypeDataSourceMap,
    newInputTypes,
    dataSourceTemplates,
    config,
}) {
    let edges: Edge[] = [];
    visit(ast, {
        enter: (
            node: any,
            key: any,
            parent: any,
            path: any,
            ancestors: any,
        ) => {
            // console.log(node);
            if (node.kind == "ObjectTypeDefinition") {
                if (
                    node.name.value === "Query" ||
                    node.name.value === "Mutation" ||
                    node.name.value === "Subscription"
                ) {
                    // https://www.youtube.com/watch?v=otCpCn0l4Wo
                    return;
                }
                const type: GraphQLObjectType = schema.getType(node.name.value);

                // Here we are finding all fields with the directive @edge
                // these edges are then put into a map
                // once we have collected the edges, we can validate they are
                // correct
                if (type.astNode && type.astNode.fields) {
                    type.astNode.fields.forEach(field => {
                        if (field.directives) {
                            field.directives.forEach(directive => {
                                if (directive.name.value === "edge") {
                                    let edgeName: string;
                                    let principal: boolean = false;

                                    directive.arguments.forEach(argument => {
                                        if (
                                            argument.name.value === "name" &&
                                            argument.value.kind ===
                                                "StringValue"
                                        ) {
                                            edgeName = argument.value.value;
                                        }
                                        if (
                                            argument.name.value ===
                                                "principal" &&
                                            argument.value.kind ===
                                                "BooleanValue"
                                        ) {
                                            principal = argument.value.value;
                                        }
                                    });
                                    if (edgeName) {
                                        const cardinality = getCardinalityFromType(
                                            {
                                                type: field.type,
                                            },
                                        );
                                        // let fieldId = `${pluralize.singular(
                                        //     field.name.value,
                                        // )}Id`;
                                        // if (
                                        //     cardinality === EdgeCardinality.MANY
                                        // ) {
                                        //     fieldId = `${pluralize.singular(
                                        //         field.name.value,
                                        //     )}Ids`;
                                        // }
                                        edges.push({
                                            typeName: node.name.value,
                                            field: field.name.value,
                                            // fieldId,
                                            fieldType: getTypeFromEdge({
                                                type: field.type,
                                            }),
                                            principal: principal
                                                ? EdgePrinciple.TRUE
                                                : EdgePrinciple.FALSE,
                                            cardinality,
                                            edgeName,
                                            required:
                                                field.type.kind ===
                                                "NonNullType",
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            }
        },
    });

    // Check there is the correct number of edges
    return validateEdges({ edges });
}

/**
 * Get the underlying type name
 * @param options
 */
function getTypeFromEdge({ type }: { type: TypeNode }): string {
    if (type.kind === "NamedType") {
        return type.name.value;
    } else {
        if (type.type) {
            return getTypeFromEdge({ type: type.type });
        }
    }
}

function getCardinalityFromType({ type }: { type: TypeNode }): EdgeCardinality {
    if (type.kind === "NamedType") {
        return EdgeCardinality.ONE;
    } else if (type.kind === "ListType") {
        return EdgeCardinality.MANY;
    } else {
        if (type.type) {
            return getCardinalityFromType({ type: type.type });
        }
    }
}

/**
 * Validates that there are exactly 2 edges of each name
 * throws an exception if there isnt.
 * @param options
 */
function validateEdges({ edges }: { edges: Edge[] }): Edge[] {
    // TODO: Validate only on side of the edge is marked as the principal
    return edges.map(edge => {
        // First check that this edge appears only One other time
        let updatedEdge = {
            ...edge,
        };
        let matchingEdgesFound = 0;
        edges.forEach(compareEdge => {
            if (edge.edgeName === compareEdge.edgeName) {
                matchingEdgesFound = matchingEdgesFound + 1;
                if (edge.typeName !== compareEdge.typeName) {
                    updatedEdge.counterpart = {
                        type: compareEdge.typeName,
                        field: compareEdge.field,
                        cardinality: compareEdge.cardinality,
                    };
                }
            }
        });
        if (matchingEdgesFound > 2) {
            throw new Error(
                `Found ${matchingEdgesFound} edges called ${
                    edge.edgeName
                }, there can only be two @edge directives with the same name.`,
            );
        }
        if (matchingEdgesFound < 2) {
            throw new Error(
                `Found ${matchingEdgesFound} edges called ${
                    edge.edgeName
                }, there must be two @edge directives with the same name.`,
            );
        }
        return updatedEdge;
    });
}

enum EdgeCardinality {
    ONE = "ONE",
    MANY = "MANY",
}
enum EdgePrinciple {
    TRUE = "TRUE",
    FALSE = "FALSE",
}
type Edge = {
    // Type where this edge is found
    typeName: string;
    // Field on typeName where this edge is found
    field: string;
    // Return Type of the field
    fieldType: string;
    // // The name of the field used for mutation with ids
    // fieldId: string;
    edgeName: string;
    // Whether or not the field is NonNull
    required: boolean;

    cardinality: EdgeCardinality | string;

    // If the pricinple is true then
    // linnet:edge === typeName.id
    // else
    // id === nestedItem.id
    principal: EdgePrinciple | string;
    // The vertex on the other side of the edge
    counterpart?: {
        type: string;
        field: string;
        cardinality: EdgeCardinality | string;
    };
};

export { extractEdges, getTypeFromEdge, Edge, EdgeCardinality, EdgePrinciple };
