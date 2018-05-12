import {
    DataSource,
    DataSourceTemplate,
    DataSourceTemplates,
    DataSourceDynamoDBConfig,
} from "../schema/dataSources/dataSources";
import { ResolverTemplates } from "../schema/resolvers/types";
enum AppSyncAuthenticationType {
    API_KEY = "API_KEY",
    AWS_IAM = "AWS_IAM",
    AMAZON_COGNITO_USER_POOLS = "AMAZON_COGNITO_USER_POOLS",
}

enum UserPoolConfigDefaultAction {
    ALLOW = "ALLOW",
    DENY = "DENY",
}

type Config = {
    environment: string;
    region: string;
    verbose: boolean;
    accountId: string;
    appSync: {
        name: string;
        graphQLApi?: AWS.AppSync.GraphqlApi;
        graphQLApiId?: string;
        authenticationType: AppSyncAuthenticationType;
        userPoolConfig?: {
            awsRegion: string;
            defaultAction: UserPoolConfigDefaultAction;
            userPoolId: string;
            appIdClientRegex?: string;
        };
    };
    schemaFiles: string;
    dataSources: {
        DynamoDB?: {
            serviceRoleArn: string;
            nodeTableName: string;
            provisionedThroughput: {
                nodeTable: {
                    readCapacityUnits: number;
                    writeCapacityUnits: number;
                };
                edgeDataTypeIndex: {
                    readCapacityUnits: number;
                    writeCapacityUnits: number;
                };
                namedTypeIdIndex: {
                    readCapacityUnits: number;
                    writeCapacityUnits: number;
                };
            };
        };
        Lambda: {
            System: {
                serviceRoleArn: string;
            };
        };
        ElasticSearch?: {
            prefix: string;
            suffix: string;
            serviceRoleArn: string;
        };
    };
};

type TaskContext = {
    config?: Config;
    profile?: string;
    role?: string;
    configPath?: string;
    environment?: string;
    initialTypeDefs?: string;
    schema: {
        resolverTemplates?: ResolverTemplates;
        dataSourceTemplates?: DataSourceTemplates;
        typeDefs?: string;
    };
};

export {
    Config,
    TaskContext,
    AppSyncAuthenticationType,
    UserPoolConfigDefaultAction,
};
