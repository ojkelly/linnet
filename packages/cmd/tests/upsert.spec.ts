import test from "ava";
import * as util from "util";
import * as AWS from "aws-sdk-mock";
import * as sinon from "sinon";
import * as AWS_SDK from "aws-sdk";

// As we transpile with TypeScript we need to explicitly set the SDK
AWS.setSDKInstance(AWS_SDK);

import { upsert } from "../src/commands/upsert";

test.skip("Can upsert", async t => {
    try {
        const result: boolean = await upsert({
            verbose: true,
            configFile: "./packages/cmd/tests/test-data/config.yml",
            environment: "development",
        });
        t.is(result, true);
    } catch (err) {
        t.log(err);
        t.fail();
    }
});

test.afterEach(t => {
    AWS.restore();
});

test("Can upsert a schema", async t => {
    const apiId: string = "tvlosysspbd6tlyecag3zchc5a";

    AWS.mock("AppSync", "listGraphqlApis", (params, callback) => {
        callback(null, {
            graphqlApis: [
                {
                    name: "TestAppSync-development",
                    apiId,
                    authenticationType: "API_KEY",
                    arn:
                        "arn:aws:appsync:ap-southeast-2:111111111111111:apis/tvlosysspbd6tlyecag3zchc5a",
                    uris: {
                        GRAPHQL:
                            "https://vpxwn3jgjzhdbbiabm6wzvtedi.appsync-api.ap-southeast-2.amazonaws.com/graphql",
                    },
                },
            ],
            nextToken: null,
        });
    });

    AWS.mock("AppSync", "createGraphqlApi", (params, callback) => {
        t.deepEqual(params, {
            apiId,
            definition:
                "directive @node(dataSource: String, consistentRead: Boolean) on OBJECT\n\ndirective @scalarSerialise(serialiseType: String) on SCALAR\n\ntype BodyEvent implements Event {\n  id: ID!\n  startedAt: DateTime\n  endedAt: DateTime\n  body: String\n  createdAt: String!\n  updatedAt: String!\n}\n\ninput createBodyEventInput {\n  after: String\n  first: Int\n}\n\ninput createDataEventInput {\n  after: String\n  first: Int\n}\n\ninput createEntityInput {\n  after: String\n  first: Int\n}\n\ninput createTimelineInput {\n  after: String\n  first: Int\n}\n\ntype DataEvent implements Event {\n  id: ID!\n  startedAt: DateTime\n  endedAt: DateTime\n  data: String\n  createdAt: String!\n  updatedAt: String!\n}\n\nscalar DateTime\n\ninput deleteBodyEventInput {\n  id: ID!\n}\n\ninput deleteDataEventInput {\n  id: ID!\n}\n\ninput deleteEntityInput {\n  id: ID!\n}\n\ninput deleteTimelineInput {\n  id: ID!\n}\n\ntype Entity {\n  id: ID!\n  name: String\n  timeline: Timeline\n  createdAt: String!\n  updatedAt: String!\n}\n\ninterface Event {\n  id: ID!\n  startedAt: DateTime\n  endedAt: DateTime\n}\n\ntype listBodyEvent {\n  items: [BodyEvent]\n}\n\ninput listBodyEventInput {\n  nextToken: String\n  limit: Int = 10\n}\n\ntype listDataEvent {\n  items: [DataEvent]\n}\n\ninput listDataEventInput {\n  nextToken: String\n  limit: Int = 10\n}\n\ntype listEntity {\n  items: [Entity]\n}\n\ninput listEntityInput {\n  nextToken: String\n  limit: Int = 10\n}\n\ntype listTimeline {\n  items: [Timeline]\n}\n\ninput listTimelineInput {\n  nextToken: String\n  limit: Int = 10\n}\n\ntype Mutation {\n  createBodyEvent(input: createBodyEventInput!): BodyEvent\n  updateBodyEvent(input: updateBodyEventInput!): BodyEvent\n  deleteBodyEvent(input: deleteBodyEventInput!): BodyEvent\n  createDataEvent(input: createDataEventInput!): DataEvent\n  updateDataEvent(input: updateDataEventInput!): DataEvent\n  deleteDataEvent(input: deleteDataEventInput!): DataEvent\n  createEntity(input: createEntityInput!): Entity\n  updateEntity(input: updateEntityInput!): Entity\n  deleteEntity(input: deleteEntityInput!): Entity\n  createTimeline(input: createTimelineInput!): Timeline\n  updateTimeline(input: updateTimelineInput!): Timeline\n  deleteTimeline(input: deleteTimelineInput!): Timeline\n}\n\ntype Query {\n  listBodyEvent(input: listBodyEventInput!): listBodyEvent\n  BodyEvent(id: ID!): BodyEvent\n  listDataEvent(input: listDataEventInput!): listDataEvent\n  DataEvent(id: ID!): DataEvent\n  listEntity(input: listEntityInput!): listEntity\n  Entity(id: ID!): Entity\n  listTimeline(input: listTimelineInput!): listTimeline\n  Timeline(id: ID!): Timeline\n}\n\ntype Timeline {\n  id: ID!\n  events: [Event]\n  createdAt: String!\n  updatedAt: String!\n}\n\ninput updateBodyEventInput {\n  id: ID!\n}\n\ninput updateDataEventInput {\n  id: ID!\n}\n\ninput updateEntityInput {\n  id: ID!\n}\n\ninput updateTimelineInput {\n  id: ID!\n}\n",
        });
        callback(null, true);
    });

    AWS.mock("AppSync", "startSchemaCreation", (params, callback) => {
        callback(null, {
            status: "PROCESSING",
            details: "The schema is being processed..",
        });
    });

    AWS.mock("AppSync", "getSchemaCreationStatus", (params, callback) => {
        callback(null, {
            status: "SUCCESS",
            details: "Successfully created schema with 27 types.",
        });
    });

    AWS.mock("DynamoDB", "describeTable", (params, callback) => {
        callback(null, {
            Table: {
                AttributeDefinitions: [],
                TableName: params.TableName,
                KeySchema: [],
                TableStatus: "ACTIVE",
                CreationDateTime: "2018-04-28T10:27:21.911Z",
                ProvisionedThroughput: [],
                TableSizeBytes: 0,
                ItemCount: 0,
                TableArn: "",
                TableId: "",
            },
        });
    });

    AWS.mock("DynamoDB", "createTable", (params, callback) => {
        callback(null, {
            TableDescription: {
                AttributeDefinitions: [],
                TableName: params.TableName,
                KeySchema: [],
                TableStatus: "CREATING",
                CreationDateTime: " 2018-04-28T10:30:25.542Z",
                ProvisionedThroughput: [],
                TableSizeBytes: 0,
                ItemCount: 0,
                TableArn: "",
                TableId: "",
            },
        });
    });

    AWS.mock("DynamoDB", "updateTable", (params, callback) => {
        callback(null, {
            TableDescription: {
                AttributeDefinitions: [],
                TableName: params.TableName,
                KeySchema: [],
                TableStatus: "ACTIVE",
                CreationDateTime: " 2018-04-28T10:30:25.542Z",
                ProvisionedThroughput: [],
                TableSizeBytes: 0,
                ItemCount: 0,
                TableArn: "",
                TableId: "",
            },
        });
    });

    AWS.mock("AppSync", "listDataSources", (params, callback) => {
        callback(null, { dataSources: [], nextToken: null });
    });

    AWS.mock("AppSync", "updateDataSource", (params, callback) => {
        callback(null, {
            dataSource: {
                dataSourceArn: "",
                name: params.name,
                description: params.description,
                type: params.type,
                serviceRoleArn: params.serviceRoleArn,
                dynamodbConfig: [],
            },
        });
    });
    AWS.mock("AppSync", "createDataSource", (params, callback) => {
        callback(null, {
            dataSource: {
                dataSourceArn: "",
                name: params.name,
                description: params.description,
                type: params.type,
                serviceRoleArn: params.serviceRoleArn,
                dynamodbConfig: [],
            },
        });
    });

    AWS.mock("AppSync", "listResolvers", (params, callback) => {
        callback(null, { resolvers: [], nextToken: null });
    });

    AWS.mock("AppSync", "createResolver", (params, callback) => {
        callback(null, {
            resolver: {
                typeName: params.typeName,
                fieldName: params.fieldName,
                dataSourceName: params.dataSourceName,
                resolverArn: "",
                requestMappingTemplate: params.requestMappingTemplate,
                responseMappingTemplate: params.responseMappingTemplate,
            },
        });
    });

    AWS.mock("AppSync", "updateResolver", (params, callback) => {
        callback(null, {
            resolver: {
                typeName: params.typeName,
                fieldName: params.fieldName,
                dataSourceName: params.dataSourceName,
                resolverArn: "",
                requestMappingTemplate: params.requestMappingTemplate,
                responseMappingTemplate: params.responseMappingTemplate,
            },
        });
    });

    AWS.mock("Lambda", "getFunction", (params, callback) => {
        callback(null, {
            Configuration: {
                FunctionName: "TestAppSync-development-create",
                FunctionArn:
                    "arn:aws:lambda:ap-southeast-2:111111111111111:function:TestAppSync-development-create",
                Runtime: "nodejs8.10",
                Role: "arn:aws:iam::111111111111111:role/appsync-lambda",
                Handler: "lib/index.handler",
                CodeSize: 9282820,
                Description: "Lambda function for linnet resolver type: create",
                Timeout: 30,
                MemorySize: 256,
                LastModified: "2018-05-12T05:56:32.303+0000",
                CodeSha256: "Ro8gKy9GtWArCO0H2q01nAv8+VzkOCU10h5iwbddRAw=",
                Version: "$LATEST",
                VpcConfig: [Object],
                KMSKeyArn: null,
                TracingConfig: [Object],
                MasterArn: null,
                RevisionId: "6cc23eca-927a-4b37-b36c-fc108142dca5",
            },
            Code: {
                RepositoryType: "S3",
                Location: "",
            },
        });
    });

    const result: boolean = await upsert({
        verbose: true,
        configFile: "./packages/cmd/tests/test-data/config.yml",
        environment: "development",
    });
    t.is(result, true);
});
