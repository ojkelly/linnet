import {
    visit,
    GraphQLType,
    ObjectTypeDefinitionNode,
    StringValueNode,
    DocumentNode,
} from "graphql";

import { generateDynamoDBDataSourceTemplate } from "./dynamoDB";

import { Config } from "../../common/types";

/**
 * For each ObjectType that has a directive of @node
 * extract the DataSource and
 */
function createDataSourceTemplate(
    config: any,
    node: ObjectTypeDefinitionNode,
    type: GraphQLType,
    dataSourceTemplates: DataSourceTemplates,
) {
    // If an ObjectType doesn't have an @node directive, then it's
    // not going to be stored
    let foundNodeDirective: boolean = false;
    // https://github.com/serverless/serverless-graphql/issues/248
    node.directives.forEach((directive, index) => {
        if (directive.name.value === "node") {
            directive.arguments.forEach(argument => {
                // Now its time to process our dataSources based on the directive
                if (argument.name.value === "dataSource") {
                    switch ((argument.value as StringValueNode).value) {
                        // Currently only DynamoDB is implemented
                        case `DynamoDB`:
                            foundNodeDirective = true;
                            // dataSourceTemplates[
                            //     node.name.value
                            // ] = generateDynamoDBDataSourceTemplate({
                            //     config,
                            //     name: node.name.value,
                            // });
                            // const dataSource: DataSourceTemplate = {
                            //     type: argument.value.value,
                            //     name: node.name.value,

                            //     // Return the fields for the dataSource Schema
                            //     fields: node.fields
                            //         .map(field => {
                            //             if (field.type.kind === "NamedType") {
                            //                 return {
                            //                     fieldName: field.name.value,
                            //                     type: field.type.name.value,
                            //                 };
                            //             }
                            //         })
                            //         .filter(n => n), // filter null
                            // };

                            // dataSources.push(dataSource);

                            break;
                        case `Lambda`:
                            console.warn(
                                `Directive @node argument dataSource on ${
                                    node.name.value
                                } of "${
                                    (argument.value as StringValueNode).value
                                }" is not yet implemented. Pull requests encouraged.`,
                            );
                            break;
                        case `ElasticSearch`:
                            console.warn(
                                `Directive @node argument dataSource on ${
                                    node.name.value
                                } of "${
                                    (argument.value as StringValueNode).value
                                }" is not yet implemented. Pull requests encouraged.`,
                            );
                            break;
                        case `None`:
                            console.warn(
                                `Directive @node argument dataSource on ${
                                    node.name.value
                                } of "${
                                    (argument.value as StringValueNode).value
                                }" is not yet implemented. Pull requests encouraged.`,
                            );
                            break;
                        default:
                            console.warn(
                                `Directive @node argument dataSource on ${
                                    node.name.value
                                } of "${
                                    (argument.value as StringValueNode).value
                                }" is invalid. Must be one of: [ DynamoDB ]`,
                            );
                            break;
                    }
                }
            });
        }
    });

    if (foundNodeDirective === false) {
        console.warn(
            `No @node directive was found for ObjectType "${
                node.name.value
            }", this may mean the ObjectType has no data storage, and may not work correctly.`,
        );
    }
}

// [ Types ]----------------------------------------------------------------------------------------

enum DataSource {
    DynamoDB = "AMAZON_DYNAMODB",
    ElasticSearch = "AMAZON_ELASTICSEARCH",
    Lambda = "AWS_LAMBDA",
    None = "NONE",
}

type DataSourceTemplate = {
    type: DataSource;
    // The name of the ObjectType
    name: string;
    description: string;

    config: DataSourceConfig;
    serviceRoleArn: string;
};
type DataSourceTemplates = {
    [key: string]: DataSourceTemplate;
};

type DataSourceConfig =
    | DataSourceDynamoDBConfig
    | DataSourceLambdaConfig
    | DataSourceElasticSearchConfig;

type DataSourceDynamoDBConfig = {
    tableName: string;

    // Set to TRUE to use Amazon Cognito credentials with this data source.
    useCallerCredentials: boolean;

    awsRegion: string;
};

type DataSourceElasticSearchConfig = {
    // Amazon Elasticsearch endpoint.
    endPoint: string;
    awsRegion: string;
};

type DataSourceLambdaConfig = {
    functionName: string;
    qualifier: string;
    // The ARN for the Lambda function.
    lambdaFunctionArn: string;

    // Marked true if this is a linnet provided lambda
    systemLambda?: boolean;

    resolverType: string;
};

export {
    createDataSourceTemplate,
    DataSource,
    DataSourceTemplate,
    DataSourceTemplates,
    DataSourceDynamoDBConfig,
    DataSourceLambdaConfig,
    DataSourceElasticSearchConfig,
};
