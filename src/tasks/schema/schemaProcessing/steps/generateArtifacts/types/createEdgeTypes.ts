import { visit, DocumentNode } from "graphql";
import * as pluralize from "pluralize";

import { Edge, EdgeCardinality } from "../extractEdges";
/**
 * Create all the input types for a Type
 * and store them on the newInputTypes object
 * @param options
 */
function createEdgeTypes({
  edges,
  schemaDocument,
}: {
  edges: Edge[];
  schemaDocument: DocumentNode;
}): DocumentNode {
  return visit(schemaDocument, {
    leave: (node: any) => {
      if (node.kind === "ObjectTypeDefinition") {
        if (
          node.name.value === "Query" ||
          node.name.value === "Mutation" ||
          node.name.value === "Subscription"
        ) {
          return; // https://www.youtube.com/watch?v=otCpCn0l4Wo
        }
        edges.forEach(edge => {
          if (node.name.value === edge.typeName) {
            node.fields = node.fields.map(field => {
              const args = [...field.arguments];
              let returnType = field.type;

              if (field.name.value === edge.field) {
                if (edge.cardinality === EdgeCardinality.ONE) {
                  args.push({
                    kind: "InputValueDefinition",
                    name: {
                      kind: "Name",
                      value: "where",
                    },
                    type: {
                      kind: "NamedType",
                      name: {
                        kind: "Name",
                        value: `${edge.fieldType}WhereUnique`,
                      },
                    },
                  });

                  returnType = {
                    kind: "NamedType",
                    name: {
                      kind: "Name",
                      value: `${edge.fieldType}Connection`,
                    },
                  };
                } else if (edge.cardinality === EdgeCardinality.MANY) {
                  args.push({
                    kind: "InputValueDefinition",
                    name: {
                      kind: "Name",
                      value: "where",
                    },
                    type: {
                      kind: "NamedType",
                      name: {
                        kind: "Name",
                        value: `${edge.fieldType}Where`,
                      },
                    },
                  });

                  args.push({
                    kind: "InputValueDefinition",
                    name: {
                      kind: "Name",
                      value: "filter",
                    },
                    type: {
                      kind: "NamedType",
                      name: {
                        kind: "Name",
                        value: `${edge.fieldType}Filter`,
                      },
                    },
                  });

                  args.push({
                    kind: "InputValueDefinition",
                    name: {
                      kind: "Name",
                      value: "cursor",
                    },
                    type: {
                      kind: "NamedType",
                      name: {
                        kind: "Name",
                        value: "String",
                      },
                    },
                  });

                  args.push({
                    kind: "InputValueDefinition",
                    name: {
                      kind: "Name",
                      value: "limit",
                    },
                    type: {
                      kind: "NamedType",
                      name: {
                        kind: "Name",
                        value: "Int",
                      },
                    },
                  });

                  returnType = {
                    kind: "NamedType",
                    name: {
                      kind: "Name",
                      value: `${pluralize.plural(edge.fieldType)}Connection`,
                    },
                  };
                }
              }
              return {
                ...field,
                type: returnType,
                arguments: args,
              };
            });
          }
        });
      }

      return node;
    },
  });
}

export { createEdgeTypes };
