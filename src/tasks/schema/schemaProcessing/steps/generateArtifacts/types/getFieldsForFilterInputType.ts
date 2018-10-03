import {
  ObjectTypeDefinitionNode,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLID,
  GraphQLNonNull,
  GraphQLType,
  getNamedType,
  isScalarType,
  isNonNullType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLFloat,
  GraphQLInt,
  isEnumType,
  GraphQLNullableType,
  GraphQLScalarType,
  GraphQLOutputType,
  GraphQLEnumType,
} from "graphql";
import { Edge, EdgeCardinality } from "../extractEdges";
import { capitalizeFirstLetter } from "../../../../util/capitalise";

/**
 * Get all the fields for a type
 * @param options
 */
function getFieldsForFilterInputType({
  type,
  node,
  newInputTypes,
  edges,
}: {
  node?: ObjectTypeDefinitionNode;
  type: GraphQLType;
  newInputTypes: any;
  // Optionally hide a field from the final input
  hideField?: string;
  edges: Edge[];
}): any {
  const typeFields = (type as GraphQLObjectType).getFields();

  const fields = {};

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
          subTypeAstDirective => subTypeAstDirective.name.value === "edge",
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
        }
      }
    }

    // Add filter options to non-edge fields only
    if (foundEdge === false) {
      if (typeFields[typeFieldKey].name === "createdBy") {
        fields[typeFieldKey] = {
          type: newInputTypes["StringFilterInput"],
          name: typeFields[typeFieldKey].name,
        };
      } else if (
        typeFields[typeFieldKey].name === "createdAt" ||
        typeFields[typeFieldKey].name === "updatedAt"
      ) {
        fields[typeFieldKey] = {
          type: newInputTypes["TimestampFilterInput"],
          name: typeFields[typeFieldKey].name,
        };
      } else {
        let scalarType: any;
        if (!isNonNullType(typeFields[typeFieldKey].type)) {
          scalarType = typeFields[typeFieldKey];
        } else if (isNonNullType(typeFields[typeFieldKey].type)) {
          const nonNull: any = typeFields[typeFieldKey].type;
          scalarType = nonNull;
        }
        // Determine the scalar type
        switch (scalarType.type) {
          case GraphQLBoolean:
            fields[typeFieldKey] = {
              type: newInputTypes["BooleanFilterInput"],
              name: typeFields[typeFieldKey].name,
            };
            break;
          case GraphQLFloat:
            fields[typeFieldKey] = {
              type: newInputTypes["FloatFilterInput"],
              name: typeFields[typeFieldKey].name,
            };
            break;
          case GraphQLInt:
            fields[typeFieldKey] = {
              type: newInputTypes["IntFilterInput"],
              name: typeFields[typeFieldKey].name,
            };
            break;
          case GraphQLString:
            fields[typeFieldKey] = {
              type: newInputTypes["StringFilterInput"],
              name: typeFields[typeFieldKey].name,
            };
            break;

          // TODO: Add support for ENUM fields in filters
          // The following does not yet work
          case isEnumType(scalarType):
            fields[typeFieldKey] = {
              type: newInputTypes["StringFilterInput"],
              name: typeFields[typeFieldKey].name,
            };
            break;
        }
      }
    }
  });
  return fields;
}

export { getFieldsForFilterInputType };
