import { Observable, Subscriber } from "rxjs";
import { TaskContext, Config } from "../common/types";
import { ListrTaskWrapper } from "listr";
import * as AWS from "aws-sdk";
import { upsertLambda } from "./lambda";
import {
    DataSource,
    DataSourceTemplate,
    DataSourceLambdaConfig,
} from "../../tasks/schema/dataSources/dataSources";

const resolverTypes = [
  "create",
  "upsert",
  // "update",
  // "updateMany",
  // "delete",
  // "deleteMany",
];

/**
 * Process the Schema
 *
 * We need to:
 * - Extract the relationships
 * - Extract the nodes/datasources
 * - Add any default fields
 * @param options
 */
function addSystemLambdasTask({
    context,
    task,
}: {
    context: TaskContext;
    task: ListrTaskWrapper;
}): Observable<any> {
    return new Observable(observer => {
        async function run() {
            observer.next("Updating Functions");
            updateDataSources({ context });
            await updateLambdas({ config: context.config, observer });
        }
        run().then(() => observer.complete(), e => observer.error(e));
    });
}

async function updateLambdas({
    config,
    observer,
}: {
    config: Config;
    observer: Subscriber<any>;
}): Promise<any> {
    try {
        await Promise.all(
            resolverTypes.map(async resolverType => {
                const lambda = `${config.appSync.name}-${
                    config.environment
                }-${resolverType}`;

                return upsertLambda({ config, resolverType, observer });
            }),
        );
    } catch (err) {
        throw err;
    }
}

function updateDataSources({ context }: { context: TaskContext }) {
    resolverTypes.forEach(resolverType => {
        const dataSourceName: string = `${context.config.appSync.name}_${
            context.config.environment
        }_${resolverType}`;

        const functionName: string = `${context.config.appSync.name}-${
            context.config.environment
        }-${resolverType}`;

        const newDataSource: DataSourceTemplate = {
            type: DataSource.Lambda,
            name: dataSourceName,
            description: "Lambda resolver for AppSync",
            serviceRoleArn:
                context.config.dataSources.Lambda.System.serviceRoleArn,
            config: {
                functionName: functionName,
                qualifier: "linnet",
                systemLambda: true,
                resolverType,
                lambdaFunctionArn: `arn:aws:lambda:${context.config.region}:${
                    context.config.accountId
                }:function:${functionName}`,
            },
        };
        context.schema.dataSourceTemplates[dataSourceName] = newDataSource;
    });
}

export { addSystemLambdasTask };
