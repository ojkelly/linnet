import {
  visit,
  GraphQLNamedType,
  GraphQLType,
  GraphQLObjectType,
  GraphQLScalarType,
} from "graphql";
import { addDefaultFieldsToType } from "./addDefaultFieldsToType";
import { generateDynamoDBDataSourceTemplate } from "../../../dataSources/dynamoDB";

import { createTypes } from "./types/createTypes";

function generateTypes({
  ast,
  schema,
  newTypeFields,
  newTypeDataSourceMap,
  newInputTypes,
  dataSourceTemplates,
  config,
  edges,
}) {
  let NodeState: GraphQLScalarType | undefined = undefined;

  // Extract the NodeState first
  // We do this here, to avoide duplicate types in the schema doc
  visit(ast, {
    enter: (node: any, key: any, parent: any, path: any, ancestors: any) => {
      if (
        node.kind === "NamedType" &&
        node.name &&
        node.name.value === "NodeState"
      ) {
        NodeState = schema.getType(node.name.value);
      }
    },
  });

  visit(ast, {
    enter: (node: any, key: any, parent: any, path: any, ancestors: any) => {
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
              const type: GraphQLNamedType = schema.getType(node.name.value);
              if (type instanceof GraphQLObjectType === true) {
                // Add the default fields
                const typeWithDefaults: GraphQLType = addDefaultFieldsToType(
                  type as GraphQLObjectType,
                );

                // Add the default Types
                createTypes({
                  node,
                  type: typeWithDefaults,
                  newTypeFields,
                  newTypeDataSourceMap,
                  newInputTypes,
                  edges,
                });

                // Parse this node, and extract the resolverMapping,
                // and DataSource templates
                dataSourceTemplates[
                  node.name.value
                ] = generateDynamoDBDataSourceTemplate({
                  config,
                });
              }
            }
          });
        }
      }
    },
  });
}
export { generateTypes };
