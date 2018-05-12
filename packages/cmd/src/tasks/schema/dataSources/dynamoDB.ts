import {
    DataSource,
    DataSourceTemplate,
    DataSourceDynamoDBConfig,
} from "./dataSources";
import { Config } from "../../common/types";
import * as ora from "ora";
import { default as chalk } from "chalk";
import { capitalizeFirstLetter } from "../util/capitalise";
/**
 * Generate a standard resolver template for DynamoDB
 */
function generateDynamoDBDataSourceTemplate({
    config,
}: {
    config: Config;
}): DataSourceTemplate {
    let name = "NodeTable";
    if (
        config.dataSources.DynamoDB &&
        config.dataSources.DynamoDB.nodeTableName
    ) {
        name = config.dataSources.DynamoDB.nodeTableName;
    }
    return {
        type: DataSource.DynamoDB,
        name,
        description: `${config.appSync.name} Table for Nodes`,
        serviceRoleArn: `${config.dataSources.DynamoDB.serviceRoleArn}`,
        config: {
            tableName: `${config.appSync.name}-${capitalizeFirstLetter(
                config.environment,
            )}-${name}`,
            awsRegion: `${config.region}`,
            // TODO: make config.yml for this
            useCallerCredentials: false,
        },
    };
}

export { generateDynamoDBDataSourceTemplate };
