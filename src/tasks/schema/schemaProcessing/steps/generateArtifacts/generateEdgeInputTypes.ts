import { visit, GraphQLNamedType, GraphQLObjectType } from "graphql";
import { createEdgeInputTypes } from "./types/createEdgeInputTypes";

/**
 * Generate all the variants of the Edge input types, without the edge field.
 *
 * eg OrderOnProductsCreateEdgeWithoutOrder
 */
function generateEdgeInputTypes({ ast, schema, newInputTypes, edges }) {
  visit(ast, {
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

        if (node.interfaces) {
          // If the node has the is an interface of Node, it gets a dataSource
          // resolver template, and default fields
          node.interfaces.forEach(interfaceObject => {
            if (interfaceObject.name.value === "Node") {
              const type: GraphQLNamedType = schema.getType(node.name.value);
              if (type instanceof GraphQLObjectType === true) {
                createEdgeInputTypes({
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
export { generateEdgeInputTypes };
