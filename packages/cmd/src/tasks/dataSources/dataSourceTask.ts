import * as Listr from "listr";

import { Observable, Subscriber } from "rxjs";
import { TaskContext, Config } from "../common/types";
import { ListrTaskWrapper } from "listr";
import {
    DataSource,
    DataSourceTemplate,
    DataSourceTemplates,
    DataSourceDynamoDBConfig,
    DataSourceLambdaConfig,
} from "../schema/dataSources/dataSources";
import * as AWS from "aws-sdk";

import { upsertDynamoDBTable } from "./dynamoDb";
import { addDataSource } from "./addDataSources";
/**
 * Process the Schema
 *
 * We need to:
 * - Extract the relationships
 * - Extract the nodes/datasources
 * - Add any default fields
 * @param options
 */
function dataSourceTask({
    context,
    task,
}: {
    context: TaskContext;
    task: ListrTaskWrapper;
}): any {
    return createDataSourceTasks({
        config: context.config,
        dataSourceTemplates: context.schema.dataSourceTemplates,
    });
}

/**
 * Returns an array of Listr tasks
 * @param options
 */
function createDataSourceTasks({
    config,
    dataSourceTemplates,
}: {
    config: Config;
    dataSourceTemplates: DataSourceTemplates;
}) {
    // Need to strip duplicate datasources
    const dataSources: DataSourceTemplate[] = [];
    console.dir(dataSourceTemplates);
    Object.keys(dataSourceTemplates).map(index => {
        const template: DataSourceTemplate = dataSourceTemplates[index];
        if (template.type === DataSource.DynamoDB) {
            if (
                dataSources.find(_template => _template.name === template.name)
            ) {
            } else {
                dataSources.push(template);
            }
        } else {
            dataSources.push(template);
        }
    });
    return new Listr([
        {
            title: "Create Data Sources",
            task: () => {
                let foundDynamoDbDataSource = false;
                return new Listr(
                    dataSources
                        .map(dataSource => {
                            switch (dataSource.type) {
                                case DataSource.DynamoDB:
                                    if (foundDynamoDbDataSource === true) {
                                        return;
                                    } else {
                                        foundDynamoDbDataSource = true;
                                        const dataSourceConfig: DataSourceDynamoDBConfig = dataSource.config as DataSourceDynamoDBConfig;

                                        return {
                                            title: `DynamoDB: ${
                                                dataSourceConfig.tableName
                                            }`,
                                            task: () =>
                                                new Observable(observer => {
                                                    async function run() {
                                                        return await upsertDynamoDBTable(
                                                            {
                                                                config,
                                                                dataSourceTemplate: dataSource,
                                                                observer,
                                                            },
                                                        );
                                                    }

                                                    run().then(
                                                        () =>
                                                            observer.complete(),
                                                        e => observer.error(e),
                                                    );
                                                }),
                                        };
                                    }
                                case DataSource.Lambda:
                                    break;
                                case DataSource.ElasticSearch:

                                case DataSource.None:
                                    throw new Error(
                                        `Unsupported data source: ${
                                            dataSource.name
                                        } Type: ${dataSource.type}`,
                                    );
                                default:
                                    throw new Error(
                                        `Unknown data source: ${
                                            dataSource.name
                                        } Type: ${dataSource.type}`,
                                    );
                            }
                        })
                        .filter(Boolean),
                );
            },
        },
        {
            title: "Add DataSources to AppSync",
            task: async () => {
                const appsync = new AWS.AppSync({
                    apiVersion: "2017-07-25",
                    region: config.region,
                });
                const listDataSources: AWS.AppSync.ListDataSourcesResponse = await appsync
                    .listDataSources({
                        apiId: config.appSync.graphQLApi.apiId,
                    })
                    .promise();

                return new Listr(
                    dataSources.map(dataSource => ({
                        title: `DataSource: ${dataSource.name}`,
                        task: () =>
                            new Observable(observer => {
                                async function run() {
                                    return await addDataSource({
                                        config,
                                        dataSourceTemplate: dataSource,
                                        listDataSources,
                                        observer,
                                    });
                                }
                                run().then(
                                    () => observer.complete(),
                                    e => observer.error(e),
                                );
                            }),
                    })),
                );
            },
        },
    ]);
}

export { dataSourceTask };
