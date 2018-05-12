import { visit, DocumentNode } from "graphql";
import { mergeAst, mergeStrings } from "gql-merge";
import { formatString, formatAst } from "gql-format";

/**
 * Given a DocumentNode merge and dedupe all the types
 * and fields
 * @param schemaAst
 */
function mergeAndDeDupeAst(schemaAst: DocumentNode): string {
    const typeDefs = {};

    // Go through the AST and extract/merge type definitions.
    const editedAst: Document = visit(schemaAst, {
        enter: (node: any) => {
            if (node) {
                const nodeName = node.name ? node.name.value : null;

                // Don't transform TypeDefinitions directly
                if (!nodeName || !node.kind.endsWith("TypeDefinition")) {
                    return;
                }

                const oldNode = typeDefs[nodeName];

                if (!oldNode) {
                    // First time seeing this type so just store the value.
                    typeDefs[nodeName] = node;
                    return null;
                }
                // This type is defined multiple times, so merge the fields and values.
                const concatProps = ["fields", "values", "types"];
                concatProps.forEach(propName => {
                    if (node[propName] && oldNode[propName]) {
                        const newProp = {};
                        // Favour existing props first
                        if (typeof oldNode[propName] !== "undefined") {
                            Object.keys(oldNode[propName]).forEach(
                                (prop: any) => {
                                    if (
                                        typeof newProp[propName] === "undefined"
                                    ) {
                                        newProp[(propName = prop)];
                                    }
                                },
                            );
                        }
                        if (typeof node[propName] !== "undefined") {
                            Object.keys(node[propName]).forEach((prop: any) => {
                                if (typeof newProp[propName] === "undefined") {
                                    newProp[(propName = prop)];
                                }
                            });
                        }
                        node[propName] = newProp;
                    }
                });

                typeDefs[nodeName] = node;
                return null;
            }
        },
    });

    const remainingNodesStr = formatAst(editedAst);
    const typeDefsStr = Object.values(typeDefs)
        .map(formatAst)
        .join("\n");
    const fullSchemaStr = `${remainingNodesStr}\n\n${typeDefsStr}`;

    return formatString(fullSchemaStr);
}
export { mergeAndDeDupeAst };
