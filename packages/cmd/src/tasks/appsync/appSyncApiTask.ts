import { Observable } from "rxjs";
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
function appSyncApiTask({
    context,
    task,
}: {
    context: TaskContext;
    task: ListrTaskWrapper;
}): Observable<any> {
    return new Observable(observer => {
        async function run() {
            observer.next("Updating AppSync API");
            const { graphQLApi, graphQLApiId } = await updateAppSyncApi({
                config: context.config,
            });
            context.config.appSync = {
                ...context.config.appSync,
                graphQLApi,
                graphQLApiId,
            };
        }
        run().then(() => observer.complete(), e => observer.error(e));
    });
}

async function updateAppSyncApi({
    config,
}: {
    config: Config;
}): Promise<{
    graphQLApi: AWS.AppSync.GraphqlApi;
    graphQLApiId: string;
}> {
    try {
        const appsync = new AWS.AppSync({
            apiVersion: "2017-07-25",
            region: config.region,
        });

        // Check to see if this AppSync Api exists
        const listGraphqlApis = await appsync
            .listGraphqlApis({
                maxResults: 0,
            })
            .promise();

        let graphQLApi: AWS.AppSync.GraphqlApi = listGraphqlApis.graphqlApis.find(
            api => api.name === `${config.appSync.name}-${config.environment}`,
        );

        let graphQLApiId: string;

        // If it doesn't exist, create it
        if (typeof graphQLApi !== "undefined") {
            graphQLApiId = graphQLApi.apiId;
        } else {
            const createGraphqlApiParams: AWS.AppSync.CreateGraphqlApiRequest = {
                authenticationType: config.appSync.authenticationType,
                name: `${config.appSync.name}-${config.environment}`,
            };

            const createGraphqlApi: AWS.AppSync.CreateGraphqlApiResponse = await appsync
                .createGraphqlApi(createGraphqlApiParams)
                .promise();

            graphQLApi = createGraphqlApi.graphqlApi;
            graphQLApiId = createGraphqlApi.graphqlApi.apiId;
        }

        return {
            graphQLApi,
            graphQLApiId,
        };
    } catch (err) {
        throw err;
    }
}

export { appSyncApiTask };
