import { Subscriber } from "rxjs";
import * as AWS from "aws-sdk";
import {
    visit,
    GraphQLType,
    ObjectTypeDefinitionNode,
    StringValueNode,
    DocumentNode,
} from "graphql";

import {
    DataSourceTemplate,
    DataSource,
    DataSourceDynamoDBConfig,
    DataSourceLambdaConfig,
} from "../schema/dataSources/dataSources";

import { Config } from "../common/types";

/**
 * Add a datasource to an AppSync Api
 *
 * If a dataSource exists it will be updated
 * @param options
 */
async function addDataSource({
    config,
    dataSourceTemplate,
    listDataSources,
    observer,
}: {
    config: Config;
    dataSourceTemplate: DataSourceTemplate;
    listDataSources: AWS.AppSync.ListDataSourcesResponse;
    observer: Subscriber<any>;
}): Promise<
    AWS.AppSync.CreateDataSourceResponse | AWS.AppSync.UpdateDataSourceResponse
> {
    try {
        const appsync = new AWS.AppSync({
            apiVersion: "2017-07-25",
            region: config.region,
        });
        observer.next(`Checking - DataSource:${dataSourceTemplate.name}`);
        let dataSourceParams = {};
        switch (dataSourceTemplate.type) {
            case `${DataSource.DynamoDB}`:
                const dataSourceConfig: DataSourceDynamoDBConfig = dataSourceTemplate.config as DataSourceDynamoDBConfig;

                dataSourceParams = {
                    dynamodbConfig: {
                        awsRegion: dataSourceConfig.awsRegion,
                        tableName: dataSourceConfig.tableName,
                        useCallerCredentials:
                            dataSourceConfig.useCallerCredentials,
                    },
                };
                break;
            case DataSource.Lambda:
                const dataSourceLambdaConfig: DataSourceLambdaConfig = dataSourceTemplate.config as DataSourceLambdaConfig;
                dataSourceParams = {
                    lambdaConfig: {
                        lambdaFunctionArn:
                            dataSourceLambdaConfig.lambdaFunctionArn,
                    },
                };
                break;
            case DataSource.ElasticSearch:
                dataSourceParams = {
                    elasticsearchConfig: {
                        awsRegion: "STRING_VALUE",
                        endpoint: "STRING_VALUE",
                    },
                };

            // break;

            case DataSource.None:
                break;
            default:
                throw new Error("Unknown data source");
        }

        // Check if the dataSource exists in AppSync
        const existingDataSource:
            | AWS.AppSync.DataSource
            | undefined = listDataSources.dataSources.find(
            (dataSource: AWS.AppSync.DataSource) =>
                dataSource.name === dataSourceTemplate.name,
        );
        // If true, update
        if (existingDataSource) {
            observer.next(`Updating - DataSource: ${dataSourceTemplate.name}`);

            const updateDataSourceParams: AWS.AppSync.UpdateDataSourceRequest = {
                apiId: config.appSync.graphQLApiId,
                name: dataSourceTemplate.name,
                type: dataSourceTemplate.type,
                description: dataSourceTemplate.description,
                serviceRoleArn: dataSourceTemplate.serviceRoleArn,
                ...dataSourceParams,
            };
            const updateDataSource: AWS.AppSync.UpdateDataSourceResponse = await appsync
                .updateDataSource(updateDataSourceParams)
                .promise();

            observer.next(`Updated - DataSource: ${dataSourceTemplate.name}`);

            return updateDataSource;
        } else {
            // If false, create
            observer.next(`"Creating - DataSource: ${dataSourceTemplate.name}`);

            const createDataSourceParams: AWS.AppSync.CreateDataSourceRequest = {
                apiId: config.appSync.graphQLApiId,
                name: dataSourceTemplate.name,
                type: dataSourceTemplate.type,
                description: dataSourceTemplate.description,
                serviceRoleArn: dataSourceTemplate.serviceRoleArn,
                ...dataSourceParams,
            };

            const createDataSource: AWS.AppSync.CreateDataSourceResponse = await appsync
                .createDataSource(createDataSourceParams)
                .promise();

            observer.next(`Created - DataSource: ${dataSourceTemplate.name}`);

            return createDataSource;
        }
    } catch (error) {
        observer.error(error);
        if (config.verbose) console.error({ error });
        throw error;
    }
}

export { addDataSource };
