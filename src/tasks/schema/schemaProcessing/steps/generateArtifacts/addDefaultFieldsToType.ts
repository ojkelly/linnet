import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLNonNull,
} from "graphql";

/**
 * For each Type add the following fields to that type:
 * id: ID!
 * createdAt: DateTime!
 * updatedAt: DateTime!
 */
function addDefaultFieldsToType(type: GraphQLObjectType): GraphQLObjectType {
  (type as GraphQLObjectType).getFields().id = {
    name: "id",
    type: new GraphQLNonNull(GraphQLID),
    description: "", //"The hash key. This is auto-generated.",
    args: [],
  };

  (type as GraphQLObjectType).getFields().createdAt = {
    name: "createdAt",
    type: new GraphQLNonNull(GraphQLString),
    description: "",
    args: [],
  };

  (type as GraphQLObjectType).getFields().updatedAt = {
    name: "updatedAt",
    type: new GraphQLNonNull(GraphQLString),
    description: "",
    args: [],
  };

  (type as GraphQLObjectType).getFields().createdBy = {
    name: "createdBy",
    type: new GraphQLNonNull(GraphQLID),
    description: "",
    args: [],
  };

  return type;
}

export { addDefaultFieldsToType };
