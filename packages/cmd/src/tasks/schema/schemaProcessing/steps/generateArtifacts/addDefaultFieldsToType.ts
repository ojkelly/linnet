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
    GraphQLEnumType,
    GraphQLScalarType,
} from "graphql";
import { mergeAst, mergeStrings } from "gql-merge";
import { formatString, formatAst } from "gql-format";
import * as pluralize from "pluralize";
import { directives } from "../../../util/directives";
import { Config } from "../../../../common/types";

/**
 * For each Type add the following fields to that type:
 * id: ID!
 * createdAt: DateTime!
 * updatedAt: DateTime!
 */
function addDefaultFieldsToType(type: GraphQLObjectType, NodeState: GraphQLScalarType): GraphQLObjectType {
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

    (type as GraphQLObjectType).getFields().nodeState = {
      name: "nodeState",
      type: NodeState,
      description: "",
      args: [],
  };

    return type;
}

export { addDefaultFieldsToType };
