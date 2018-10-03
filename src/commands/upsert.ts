import * as Listr from "listr";
import * as UpdaterRenderer from "listr-update-renderer";
import { assumeRoleTask } from "../tasks/sts/assumeRoleTask";
import { loadConfigTask } from "../tasks/common/loadConfigTask";
import { loadSchemaTask } from "../tasks/schema/loadSchemaTask";
import { schemaProcessingTask } from "../tasks/schema/schemaProcessingTask";
import { appSyncApiTask } from "../tasks/appsync/appSyncApiTask";
import { appSyncSchemaTask } from "../tasks/appsync/appSyncSchemaTask";
import { appSyncResolversTask } from "../tasks/appsync/appSyncResolversTask";
import { dataSourceTask } from "../tasks/dataSources/dataSourceTask";
import { addSystemLambdasTask } from "../tasks/lambda/addSystemLambdasTask";


async function upsert({
    configFile,
    verbose,
    environment,
    profile,
    region,
}: UpsertOptions): Promise<boolean> {
    try {
        const tasks = new Listr(
            [
                // Assume an AWS role (optional)
                {
                    title: "Assume Role",
                    skip: () =>
                        typeof profile !== "string" &&
                        "No --profile was passed",
                    task: (context, task) =>
                        assumeRoleTask({
                            context,
                            task,
                            profile,
                        }),
                },

                // Load the config from disk
                {
                    title: "Load Config",
                    task: (context, task) =>
                        loadConfigTask({
                            context,
                            task,
                            configFile,
                            environment,
                            verbose,
                        }),
                },

                // Load the schema from disk
                {
                    title: "Load Schema",
                    task: (context, task) =>
                        loadSchemaTask({
                            context,
                            task,
                        }),
                },

                // Process the schema
                {
                    title: "Process Schema",
                    task: (context, task) =>
                        schemaProcessingTask({
                            context,
                            task,
                        }),
                },

                // Create/Update the AppSync Api
                {
                    title: "Update AppSync Api",
                    task: (context, task) =>
                        appSyncApiTask({
                            context,
                            task,
                        }),
                },

                // Create/Update the AppSync Schema
                {
                    title: "Update AppSync Schema",
                    task: (context, task) =>
                        appSyncSchemaTask({
                            context,
                            task,
                        }),
                },

                // Create/Update the lambda functions
                {
                    title: "Update Lambda Functions",
                    task: (context, task) =>
                        addSystemLambdasTask({
                            context,
                            task,
                        }),
                },

                // Create/Update the DynamoDB table
                {
                    title: "Update Data Sources",
                    task: (context, task) =>
                        dataSourceTask({
                            context,
                            task,
                        }),
                },

                // Create/Update any AppSync resolvers
                {
                    title: "Update AppSync Resolvers",
                    task: (context, task) =>
                        appSyncResolversTask({
                            context,
                            task,
                        }),
                },
            ],
            {
                renderer: verbose ? "verbose" : "default",
                nonTTYRenderer: "verbose",
                collapse: false,
            },
        );

        await tasks.run();
        return true;
    } catch (error) {
        if (verbose) {
            console.error(error.message);
            console.error(error.stack);
        }
        return false;
    }
}
// [ Types ]-------------------------------------------------

type UpsertOptions = {
    profile?: string;
    region?: string;
    verbose: boolean;
    configFile: string;
    environment: string;
};

// [ Exports ]------------------------------------------------

export { upsert, UpsertOptions };
