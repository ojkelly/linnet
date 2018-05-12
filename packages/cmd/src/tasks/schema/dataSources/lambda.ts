import {
    DataSource,
    DataSourceTemplate,
    DataSourceLambdaConfig,
} from "./dataSources";
import { Config } from "../../common/types";
import * as ora from "ora";
import { default as chalk } from "chalk";
import { capitalizeFirstLetter } from "../util/capitalise";
/**
 * Generate a standard resolver template for Lambda
 */
function generateLambdaDataSourceTemplate({
    config,
    name,
    resolverType,
}: {
    config: Config;
    name: string;
    resolverType: string;
}): DataSourceTemplate {
    const dataSourceName: string = `${config.appSync.name}_${
        config.environment
    }_${resolverType}`;

    const functionName: string = `${config.appSync.name}-${
        config.environment
    }-${resolverType}`;
    return {
        type: DataSource.Lambda,
        name: dataSourceName,
        description: `${config.appSync.name} Lambda for Linnet`,
        serviceRoleArn: `${config.dataSources.Lambda.System.serviceRoleArn}`,
        config: {
            functionName: name,
            qualifier: "linnet",
            lambdaFunctionArn: `arn:aws:lambda:${config.region}:${
                config.accountId
            }:function:${functionName}:linnet`,
            resolverType,
        },
    };
}

export { generateLambdaDataSourceTemplate };
