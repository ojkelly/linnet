import {
    visit,
    GraphQLNamedType,
    GraphQLType,
    GraphQLObjectType,
} from "graphql";
import { createInputTypes } from "./types/createInputTypes";

function generateInputTypes({
    ast,
    schema,
    newTypeFields,
    newTypeDataSourceMap,
    newInputTypes,
    dataSourceTemplates,
    config,
    edges,
}) {
    visit(ast, {
        // enter: (
        //     node: any,
        //     key: any,
        //     parent: any,
        //     path: any,
        //     ancestors: any,
        // ) => {
        //     if (node.kind === "ObjectTypeDefinition") {
        //         if (
        //             node.name.value === "Query" ||
        //             node.name.value === "Mutation" ||
        //             node.name.value === "Subscription"
        //         ) {
        //             // https://www.youtube.com/watch?v=otCpCn0l4Wo
        //             return;
        //         }

        //         if (node.interfaces) {
        //             // If the node has the is an interface of Node, it gets a dataSource
        //             // resolver template, and default fields
        //             node.interfaces.forEach((interfaceObject, index) => {
        //                 if (interfaceObject.name.value === "Node") {
        //                     const type: GraphQLNamedType = schema.getType(
        //                         node.name.value,
        //                     );
        //                     if (type instanceof GraphQLObjectType === true) {
        //                         // Create the Input Types
        //                         // newInputTypes[
        //                         //     `${node.name.value}CreateEdge`
        //                         // ] = type;
        //                     }
        //                 }
        //             });
        //         }
        //     }
        // },
        leave: (
            node: any,
            key: any,
            parent: any,
            path: any,
            ancestors: any,
        ) => {
            if (node.kind === "ObjectTypeDefinition") {
                if (
                    node.name.value === "Query" ||
                    node.name.value === "Mutation" ||
                    node.name.value === "Subscription"
                ) {
                    // https://www.youtube.com/watch?v=otCpCn0l4Wo
                    return;
                }

                if (node.interfaces) {
                    // If the node has the is an interface of Node, it gets a dataSource
                    // resolver template, and default fields
                    node.interfaces.forEach((interfaceObject, index) => {
                        if (interfaceObject.name.value === "Node") {
                            const type: GraphQLNamedType = schema.getType(
                                node.name.value,
                            );
                            if (type instanceof GraphQLObjectType === true) {
                                // Create the Input Types
                                createInputTypes({
                                    node,
                                    type,
                                    newInputTypes,
                                    edges,
                                });
                            }
                        }
                    });
                }
            }
        },
    });
}
export { generateInputTypes };
