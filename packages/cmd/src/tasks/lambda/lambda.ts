import {
    DataSource,
    DataSourceTemplate,
    DataSourceDynamoDBConfig,
    DataSourceLambdaConfig,
} from "../schema/dataSources/dataSources";
import { TaskContext, Config } from "../common/types";
import { Subscriber } from "rxjs";
import * as fs from "fs-extra";
import * as path from "path";

import * as AWS from "aws-sdk";

async function upsertLambda({
    config,
    resolverType,
    observer,
}: {
    config: Config;

    resolverType: string;
    observer: Subscriber<any>;
}): Promise<any> {
    const functionName: string = `${config.appSync.name}-${
        config.environment
    }-${resolverType}`;
    const qualifier = "linnet";

    try {
        const lambda = new AWS.Lambda({
            apiVersion: "2015-03-31",
            region: config.region,
        });
        observer.next(`Checking if ${functionName} exists.`);
        const getFunctionParams: AWS.Lambda.GetFunctionRequest = {
            FunctionName: functionName,
        };
        let lambdaExists: boolean = false;
        try {
            let getFunction: AWS.Lambda.GetFunctionResponse = await lambda
                .getFunction(getFunctionParams)
                .promise();
            if (getFunction.Configuration.FunctionName === functionName) {
                lambdaExists = true;
            }
        } catch (getFunctionError) {
            if (getFunctionError.code !== "ResourceNotFoundException") {
                throw getFunctionError;
            }
        }
        const lambdaZipPath = path.resolve(`.dist/lambda/${resolverType}.zip`);

        if (lambdaExists === false) {
            observer.next(`Creating new lambda ${functionName}`);
            const createLambdaParams: AWS.Lambda.CreateFunctionRequest = {
                Code: {
                    ZipFile: await fs.readFile(lambdaZipPath),
                },
                Description: `Lambda function for linnet resolver type: ${resolverType}`,
                FunctionName: functionName,
                Handler: "index.handler",
                // TODO: make memorySize configurable
                MemorySize: 256,
                Publish: true,
                Role: config.dataSources.Lambda.System.serviceRoleArn,
                Runtime: "nodejs8.10",
                Timeout: 30,
                TracingConfig: {
                    Mode: "Active",
                },
            };
            const createFunction: AWS.Lambda.Types.FunctionConfiguration = await lambda
                .createFunction(createLambdaParams)
                .promise();
            console.dir({ createFunction });

            const createAliasParams: AWS.Lambda.CreateAliasRequest = {
                FunctionName: createFunction.FunctionName,
                FunctionVersion: createFunction.Version,
                Name: qualifier,
            };
            const createAlias: AWS.Lambda.Types.AliasConfiguration = await lambda
                .createAlias(createAliasParams)
                .promise();
            console.dir({ createAlias });
        } else {
            const updateFunctionCodeParams: AWS.Lambda.UpdateFunctionCodeRequest = {
                ZipFile: await fs.readFile(lambdaZipPath),
                FunctionName: functionName,
                Publish: true,
            };
            const updateFunctionCode: AWS.Lambda.Types.FunctionConfiguration = await lambda
                .updateFunctionCode(updateFunctionCodeParams)
                .promise();

            const updateAliasParams: AWS.Lambda.UpdateAliasRequest = {
                FunctionName: updateFunctionCode.FunctionName,
                FunctionVersion: updateFunctionCode.Version,
                Name: qualifier,
            };
            const updateAlias: AWS.Lambda.Types.AliasConfiguration = await lambda
                .updateAlias(updateAliasParams)
                .promise();
        }
    } catch (error) {
        if (error.code === "ResourceInUseException") {
            observer.next(`Exists Lambda: ${functionName}`);
        } else {
            observer.error(error);
            throw error;
        }
    }
}

export { upsertLambda };
