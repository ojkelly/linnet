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
        // ACTIVE: Always shows up
        // INACTIVE: shows up, but your own business logic can do soemthing about it
        // DELETED: Never shows up
        const nodeTypeDef: string = `
        enum NodeState {
          ACTIVE
          INACTIVE
          DELETED
        }

        interface Node {
          id: ID!
          createdAt: String!
          updatedAt: String!
          createdBy: ID!
          nodeState: NodeState
      }`;
        // Merge it with the users typedefs
        return mergeStrings([typeDefs, nodeTypeDef]);
    } catch (err) {
        throw err;
    }
}

export { generateInitialSchema };
