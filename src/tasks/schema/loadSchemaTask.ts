import * as path from "path";
import { Observable } from "rxjs";
import { TaskContext, Config } from "../common/types";
import { ListrTaskWrapper } from "listr";
import { mergeFileGlob } from "gql-merge";
import { readFileGlob } from "gql-utils";

async function loadSchemaTask({
    context,
    task,
}: {
    context: TaskContext;
    task: ListrTaskWrapper;
}): Promise<any> {
    try {
        // Get the dir the config file is in, as this is used as the root for loading
        // the schema files glob
        const configPath = path.resolve(context.configPath);
        const configPathParsed = path.parse(configPath);
        const schemaFilesPath = path.resolve(
            configPathParsed.dir,
            context.config.schemaFiles,
        );
        const typeDefs = await mergeFileGlob(schemaFilesPath);
        context.initialTypeDefs = typeDefs;
    } catch (err) {
        throw err;
    }
}

export { loadSchemaTask };
