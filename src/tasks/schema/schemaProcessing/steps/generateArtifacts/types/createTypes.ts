import {
  ObjectTypeDefinitionNode,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLType,
} from "graphql";
import * as pluralize from "pluralize";
import { Edge } from "../extractEdges";

/**
 * Add the following Mutations
 * createType(data: CreateTypeInput)
 * updateType(data: UpdateTypeInput)
 * deleteType(where: DeleteTypeWhereInput)
 * deleteManyType(data: DeleteTypeWhereManyInput)
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
}: {
  node: ObjectTypeDefinitionNode;
  type: GraphQLType;
  newTypeFields: any;
  newTypeDataSourceMap: any;
  newInputTypes: any;
  edges: Edge[];
}) {
  // [ query single ]-------------------------------------------------------------------------------
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

  // [ query plural ]-------------------------------------------------------------------------------
  newTypeFields.query[`${pluralize.plural(node.name.value)}`] = {
    name: `${pluralize.plural(node.name.value)}`,
    type: new GraphQLList(type),
    args: {
      where: {
        type: new GraphQLNonNull(newInputTypes[`${node.name.value}Where`]),
      },
      cursor: { type: GraphQLString },
      limit: { type: GraphQLInt },
    },
  };
  newTypeDataSourceMap.query[`${pluralize.plural(node.name.value)}`] = {
    typeName: "Query",
    name: node.name.value,
    field: `${pluralize.plural(node.name.value)}`,
    resolverType: "plural",
  };

  // [ query Connection ]---------------------------------------------------------------------------
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
      filter: {
        type: newInputTypes[`${node.name.value}Filter`],
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
        cursor: { type: GraphQLString },
      }),
    }),
    args: {
      where: {
        type: new GraphQLNonNull(
          newInputTypes[`${node.name.value}WhereUnique`],
        ),
      },
      cursor: { type: GraphQLString },
      limit: { type: GraphQLInt },
      filter: {
        type: newInputTypes[`${node.name.value}Filter`],
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

  // [ create ]-------------------------------------------------------------------------------------
  newTypeFields.mutation[`create${node.name.value}`] = {
    name: `create${node.name.value}`,
    type: type,
    args: {
      data: {
        type: new GraphQLNonNull(newInputTypes[`${node.name.value}Data`]),
      },
    },
  };
  newTypeDataSourceMap.mutation[`create${node.name.value}`] = {
    name: node.name.value,
    resolverType: "create",
  };

  // [ update ]-------------------------------------------------------------------------------------
  newTypeFields.mutation[`update${node.name.value}`] = {
    name: `update${node.name.value}`,
    type: type,
    args: {
      data: {
        type: new GraphQLNonNull(newInputTypes[`${node.name.value}Data`]),
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

  // [ updateMany ]---------------------------------------------------------------------------------
  newTypeFields.mutation[`updateMany${pluralize.plural(node.name.value)}`] = {
    name: `updateMany${pluralize.plural(node.name.value)}`,
    type: newInputTypes["BatchPayload"],
    args: {
      data: {
        type: new GraphQLNonNull(
          new GraphQLList(newInputTypes[`${node.name.value}Data`]),
        ),
      },
      where: {
        type: new GraphQLNonNull(newInputTypes[`${node.name.value}Where`]),
      },
    },
  };
  newTypeDataSourceMap.mutation[
    `updateMany${pluralize.plural(node.name.value)}`
  ] = { name: node.name.value, resolverType: "updateMany" };

  // [ delete ]-------------------------------------------------------------------------------------
  newTypeFields.mutation[`delete${node.name.value}`] = {
    name: `delete${node.name.value}`,
    type: newInputTypes["BatchPayload"],
    args: {
      where: {
        type: new GraphQLNonNull(
          newInputTypes[`${node.name.value}WhereUnique`],
        ),
      },
      set: {
        type: newInputTypes["DeleteAttributes"],
      },
    },
  };
  newTypeDataSourceMap.mutation[`delete${node.name.value}`] = {
    name: node.name.value,
    resolverType: "delete",
  };

  // [ deleteMany ]---------------------------------------------------------------------------------
  newTypeFields.mutation[`deleteMany${pluralize.plural(node.name.value)}`] = {
    name: `deleteMany${pluralize.plural(node.name.value)}`,
    type: newInputTypes["BatchPayload"],
    args: {
      where: {
        type: new GraphQLNonNull(newInputTypes[`${node.name.value}Where`]),
      },
      set: {
        type: newInputTypes["DeleteAttributes"],
      },
    },
  };
  newTypeDataSourceMap.mutation[
    `deleteMany${pluralize.plural(node.name.value)}`
  ] = { name: node.name.value, resolverType: "deleteMany" };
}

export { createTypes };
