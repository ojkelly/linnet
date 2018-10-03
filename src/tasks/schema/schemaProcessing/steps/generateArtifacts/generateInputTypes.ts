import {
  visit,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLList,
} from "graphql";
import { createInputTypes } from "./types/createInputTypes";

function generateInputTypes({ ast, schema, newInputTypes, edges }) {
  // Create our global filter types
  newInputTypes["BooleanFilterInput"] = new GraphQLInputObjectType({
    name: "BooleanFilterInput",
    fields: {
      notEqualTo: { type: GraphQLBoolean },
      equalTo: { type: GraphQLBoolean },
    },
  });

  newInputTypes["StringFilterInput"] = new GraphQLInputObjectType({
    name: "StringFilterInput",
    fields: {
      notEqualTo: { type: GraphQLString },
      equalTo: { type: GraphQLString },
      lessThanOrEqualTo: { type: GraphQLString },
      lessThan: { type: GraphQLString },
      greaterThanOrEqualTo: { type: GraphQLString },
      greaterThan: { type: GraphQLString },
      contains: { type: GraphQLString },
      notContains: { type: GraphQLString },
      beginsWith: { type: GraphQLString },
      endsWith: { type: GraphQLString },
    },
  });

  newInputTypes["IntFilterInput"] = new GraphQLInputObjectType({
    name: "IntFilterInput",
    fields: {
      notEqualTo: { type: GraphQLInt },
      equalTo: { type: GraphQLInt },
      lessThanOrEqualTo: { type: GraphQLInt },
      lessThan: { type: GraphQLInt },
      greaterThanOrEqualTo: { type: GraphQLInt },
      greaterThan: { type: GraphQLInt },
      contains: { type: GraphQLInt },
      notContains: { type: GraphQLInt },
      between: { type: new GraphQLList(GraphQLInt) },
    },
  });

  newInputTypes["FloatFilterInput"] = new GraphQLInputObjectType({
    name: "FloatFilterInput",
    fields: {
      notEqualTo: { type: GraphQLFloat },
      equalTo: { type: GraphQLFloat },
      lessThanOrEqualTo: { type: GraphQLFloat },
      lessThan: { type: GraphQLFloat },
      greaterThanOrEqualTo: { type: GraphQLFloat },
      greaterThan: { type: GraphQLFloat },
      contains: { type: GraphQLFloat },
      notContains: { type: GraphQLFloat },
      between: { type: new GraphQLList(GraphQLFloat) },
    },
  });

  newInputTypes["TimestampFilterInput"] = new GraphQLInputObjectType({
    name: "TimestampFilterInput",
    fields: {
      notEqualTo: { type: GraphQLInt },
      equalTo: { type: GraphQLInt },
      lessThanOrEqualTo: { type: GraphQLInt },
      lessThan: { type: GraphQLInt },
      greaterThanOrEqualTo: { type: GraphQLInt },
      greaterThan: { type: GraphQLInt },
      between: { type: new GraphQLList(GraphQLInt) },
    },
  });

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
