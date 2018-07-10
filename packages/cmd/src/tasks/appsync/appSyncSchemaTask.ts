import { Observable, Subscriber } from "rxjs";
import { TaskContext, Config } from "../common/types";
import { ListrTaskWrapper } from "listr";
import * as AWS from "aws-sdk";
/**
 * Process the Schema
 *
 * We need to:
 * - Extract the relationships
 * - Extract the nodes/datasources
 * - Add any default fields
 * @param options
 */
function appSyncSchemaTask({
    context,
    task,
}: {
    context: TaskContext;
    task: ListrTaskWrapper;
}): Observable<any> {
    return new Observable(observer => {
        async function run() {
            try {
                observer.next("Updating AppSync Schema");
                await updateSchema({
                    config: context.config,
                    typeDefs: context.schema.typeDefs,
                    observer,
                });
            } catch (err) {
              console.error(err)
                throw err;
            }
        }

        run().then(() => observer.complete(), e => observer.error(e));
    });
}

async function updateSchema({
    config,
    typeDefs,
    observer,
}: {
    config: Config;
    typeDefs: string;
    observer: Subscriber<any>;
}): Promise<any> {
    try {
        const appsync = new AWS.AppSync({
            apiVersion: "2017-07-25",
            region: config.region,
        });

        observer.next("Starting schema update");

        const startSchemaCreationParams: AWS.AppSync.StartSchemaCreationRequest = {
            apiId: config.appSync.graphQLApiId,
            definition: typeDefs,
        };

        let schemaCreation: AWS.AppSync.StartSchemaCreationResponse = await appsync
            .startSchemaCreation(startSchemaCreationParams)
            .promise();

        const getSchemaCreationStatusParams: AWS.AppSync.GetSchemaCreationStatusRequest = {
            apiId: config.appSync.graphQLApiId,
        };

        let schemaCreationStatus = await appsync
            .getSchemaCreationStatus(getSchemaCreationStatusParams)
            .promise();

        observer.next(schemaCreationStatus.details);

        // Now wait for the schema creation to finish
        schemaCreation = await new Promise(async (resolve, reject) => {
            try {
                if (schemaCreationStatus.status === "SUCCESS") {
                    resolve(schemaCreationStatus);
                }
                if (schemaCreationStatus.status === "FAILED") {
                    observer.error(schemaCreationStatus.details);
                    reject(schemaCreationStatus);
                }
                while (schemaCreationStatus.status === "PROCESSING") {
                    // Get the status
                    schemaCreationStatus = await appsync
                        .getSchemaCreationStatus(getSchemaCreationStatusParams)
                        .promise();

                    // Wait so we dont hit a rate limit
                    if (schemaCreationStatus.status === "SUCCESS") {
                        resolve(schemaCreationStatus);
                    }
                    if (schemaCreationStatus.status === "FAILED") {
                        observer.error(schemaCreationStatus.details);
                        reject(schemaCreationStatus);
                    }

                    setTimeout(() => {}, 1000);
                }
            } catch (err) {
                observer.error(err);
            }
        });
        observer.next(schemaCreationStatus.details);
    } catch (err) {
        observer.error(err);
        throw err;
    }
}

export { appSyncSchemaTask };
