import * as fs from "fs-extra";
import * as path from "path";
import { mergeStrings } from "gql-merge";
/**
 * Generate the initial working schema from the source typedefs
 * @param options
 */
async function generateInitialSchema({
    typeDefs,
}: {
    typeDefs: string;
}): Promise<string> {
    try {
        // Load the Node interface from disk
        const nodeTypeDef: string = `
        interface Node {
          id: ID!
          createdAt: String!
          updatedAt: String!
          createdBy: ID!
      }`;
        // Merge it with the users typedefs
        return mergeStrings([typeDefs, nodeTypeDef]);
    } catch (err) {
        throw err;
    }
}

export { generateInitialSchema };
