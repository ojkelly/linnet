import {
    Context,
    S3Event,
    S3EventRecord,
    SNSEvent,
    SNSEventRecord,
    SNSMessage,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk-core";
import * as uuid from "uuid";

import {
    HandlerEvent,
    CreateInput,
    Edge,
    EdgePrinciple,
    DataSourceDynamoDBConfig,
} from "linnet";

/**
 * Handle the incoming lambda event
 * @param event
 * @param context
 */
async function handler(event: HandlerEvent, context: Context) {
    const segment = AWSXRay.getSegment();
    const subsegment = segment.addNewSubsegment("handler");
    try {
        // Xray Tracing
        // subsegment.addAnnotation("Environment", process.env["ENV"]);
        subsegment.addAnnotation("NamedType", event.namedType);
        subsegment.addAnnotation("ResolverType", "create");
        AWSXRay.capturePromise();

        // console.log(JSON.stringify(event));

        // Process the event
        if (typeof event.context.arguments.create === "undefined") {
            throw new Error("No create argument supplied.");
        }
        const result: any = await processEvent({
            segment,
            linnetFields: event.linnetFields,
            dataSource: event.dataSource,
            namedType: event.namedType,
            edgeTypes: event.edgeTypes,
            create: event.context.arguments.create,
            source: event.context.source,
        });

        // Close the subsegment and return the result
        subsegment.close();
        context.succeed(result);
    } catch (error) {
        console.error("handler", error.message);
        subsegment.addError(error.message, false);
        context.fail(error);
        subsegment.close();
    }
}

/**
 * Process the Create Resolver event, and return the result
 * @param options
 */
async function processEvent({
    segment,
    linnetFields,
    dataSource,
    namedType,
    edgeTypes,
    create,
    source,
}: {
    segment: any;
    linnetFields: string[];
    dataSource: DataSourceDynamoDBConfig;
    namedType: string;
    edgeTypes: Edge[];
    create: CreateInput;
    source: any;
}): Promise<any> {
    const subsegment = segment.addNewSubsegment("processEvent");
    try {
        const items = generateCreate({
            segment,
            linnetFields,
            dataSource,
            namedType,
            edgeTypes,
            create,
            source,
        });
        // console.dir(items);
    } catch (error) {
        console.error("processEvent", error.message);
        subsegment.addError(error.message, false);
        subsegment.close();
        throw error;
    }
}

/**
 * Starting from the root node, generate all new Nodes and connections
 * @param options
 */
function generateCreate({
    segment,
    linnetFields,
    dataSource,
    namedType,
    edgeTypes,
    create,
    source,
}: {
    segment: any;
    linnetFields: string[];
    dataSource: DataSourceDynamoDBConfig;
    namedType: string;
    edgeTypes: Edge[];
    create: CreateInput;
    source: any;
}): any {
    const subsegment = segment.addNewSubsegment("generateCreate");
    try {
        const createdAt = Date.now();
        const updatedAt = createdAt;

        // TODO: This needs to be updated to reflect the user who created this node
        const createdBy = "linnet";
        const items = generateWriteItem({
            segment,
            linnetFields,
            namedType,
            edgeTypes,
            createdAt,
            updatedAt,
            createdBy,
            createInput: create,
        });

        const dynamoDB: AWS.DynamoDB = AWSXRay.captureAWSClient(
            new AWS.DynamoDB({
                apiVersion: "2012-08-10",
                region: dataSource.awsRegion,
            }),
        );

        const batchWriteParams: AWS.DynamoDB.BatchWriteItemInput = {
            RequestItems: {
                [dataSource.tableName]: items.map(item => ({
                    PutRequest: {
                        Item: AWS.DynamoDB.Converter.marshall(item),
                    },
                })),
            },
        };

        const batchWriteItem = dynamoDB
            .batchWriteItem(batchWriteParams)
            .promise();
        console.dir(batchWriteItem);
    } catch (error) {
        console.error("processEvent", error.message);
        subsegment.addError(error.message, false);
        subsegment.close();
        throw error;
    }
}

/**
 * Generate a single Node
 * and recurse on itself, if there are nested creates
 * @param options
 */
function generateWriteItem({
    segment,
    linnetFields,
    parentNodeId,
    edgeTypes,
    namedType,
    createdAt,
    updatedAt,
    createdBy,
    createInput,
}: {
    segment: any;
    linnetFields: string[];
    parentNodeId?: string;
    edgeTypes: Edge[];
    namedType: string;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    createInput: CreateInput;
}) {
    const subsegment = segment.addNewSubsegment("generateWriteItem");
    try {
        // var marshalled = AWS.DynamoDB.Converter.marshall({})
        const items: any[] = [];

        const edgesOnThisType: Edge[] = edgeTypes
            .map(edge => {
                if (edge.typeName === namedType) {
                    return edge;
                }
            })
            .filter(Boolean);

        if (createInput.create) {
            const nodesToCreate = [];

            // Handle GraphQLList types the same as NamedTypes
            if (Array.isArray(createInput.create)) {
                nodesToCreate.push(...createInput.create);
            } else {
                nodesToCreate.push(createInput.create);
            }

            nodesToCreate.forEach(createNode => {
                const nodeId = uuid.v4();

                // Create the Node
                const node = {
                    id: nodeId,
                    "linnet:DataType": "Node",
                    "linnet:namedType": namedType,
                };

                // Add all Create fields to the Node, and extract all the edges
                Object.keys(createNode).forEach(fieldName => {
                    const field = createNode[fieldName];

                    const edge = edgesOnThisType.find(
                        edge => edge.field == fieldName,
                    );

                    if (typeof edge === "undefined") {
                        // Add this field to the Node
                        node[fieldName] = field;
                    } else {
                        // console.log("edge", edge);
                        const nestedItems = generateWriteItem({
                            segment,
                            linnetFields,
                            parentNodeId: nodeId,
                            edgeTypes,
                            namedType: edge.fieldType,
                            createdAt,
                            updatedAt,
                            createdBy,
                            createInput: field,
                        });
                        nestedItems.forEach(nestedItem => {
                            let edgeDataType: string;
                            let edgeNamedType: string;
                            let edgeNodeId: string;

                            if (edge.principal === EdgePrinciple.TRUE) {
                                edgeDataType = `${edge.edgeName}::${nodeId}`;
                                edgeNamedType = namedType;
                                edgeNodeId = nodeId;
                            } else {
                                edgeDataType = `${edge.edgeName}::${
                                    nestedItem.id
                                }`;
                                edgeNamedType = edge.counterpart.type;
                                edgeNodeId = nestedItem.id;
                            }
                            const itemEdge = {
                                id: nodeId,
                                "linnet:DataType": edgeDataType,
                                "linnet:namedType": edgeNamedType,
                                "linnet:edge": edgeNodeId,
                            };
                            items.push(nestedItem);
                            items.push(itemEdge);
                        });
                    }
                });

                // Now add the node
                items.push(node);
            });
        }

        if (createInput.connections) {
            // TODO: add connections
            // Create any Connections
            //   Object.keys(createInput.create).forEach(fieldName => {
            //     const edge = edgesOnThisType.find(
            //         edge => edge.field == fieldName,
            //     );
            //     console.log(edge);
            //     const field = createInput.create[fieldName];
            // });
        }

        // Create the Connections and any nested Nodes

        return items;
    } catch (error) {
        console.error("processEvent", error.message);
        subsegment.addError(error.message, false);
        subsegment.close();
        throw error;
    }
}

export { handler };
