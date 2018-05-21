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
        subsegment.addAnnotation("NamedType", `${event.namedType}`);
        subsegment.addAnnotation("ResolverType", "create");
        AWSXRay.capturePromise();

        console.log(JSON.stringify(event));

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
            createInput: event.context.arguments,
            source: event.context.source,
        });
        console.dir(result);

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
    createInput,
    source,
}: {
    segment: any;
    linnetFields: string[];
    dataSource: DataSourceDynamoDBConfig;
    namedType: string;
    edgeTypes: Edge[];
    createInput: CreateInput;
    source: any;
}): Promise<any> {
    const subsegment = segment.addNewSubsegment("processEvent");
    try {
        const result = await generateCreate({
            segment,
            linnetFields,
            dataSource,
            namedType,
            edgeTypes,
            createInput,
            source,
        });

        subsegment.close();
        return result;
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
async function generateCreate({
    segment,
    linnetFields,
    dataSource,
    namedType,
    edgeTypes,
    createInput,
    source,
}: {
    segment: any;
    linnetFields: string[];
    dataSource: DataSourceDynamoDBConfig;
    namedType: string;
    edgeTypes: Edge[];
    createInput: CreateInput;
    source: any;
}): Promise<any> {
    const subsegment = segment.addNewSubsegment("generateCreate");
    try {
        const rootNodeId = uuid.v4();
        const createdAt = Date.now();
        const updatedAt = createdAt;

        // TODO: This needs to be updated to reflect the user who created this node
        const createdBy = "linnet";

        // Create all the items
        // TODO: this cant handle multiple items in a nested create
        const items = generateWriteItem({
            segment,
            linnetFields,
            namedType,
            edgeTypes,
            createdAt,
            updatedAt,
            createdBy,
            createInput,
            rootNodeId,
        });

        console.log("items length:", items.length);
        console.log(JSON.stringify(items));

        // TODO: if there is more than 25 items, you need to split into
        // multiple batches
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

        const batchWriteItem = await dynamoDB
            .batchWriteItem(batchWriteParams)
            .promise();

        subsegment.close();
        return getRootNode({
            segment: subsegment,
            rootNodeId,
            edgeTypes,
            items,
            linnetFields,
        });
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
    rootNodeId,
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
    rootNodeId?: string;
}) {
    const subsegment = segment.addNewSubsegment("generateWriteItem");
    try {
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
                let nodeId = uuid.v4();
                if (rootNodeId) {
                    nodeId = rootNodeId;
                }

                // Create the Node
                const node = {
                    id: nodeId,
                    "linnet:dataType": "Node",
                    "linnet:namedType": namedType,
                    createdAt,
                    updatedAt,
                    createdBy,
                };

                // Add all Create fields to the Node, and extract all the edges
                Object.keys(createNode).forEach(fieldName => {
                    const field = createNode[fieldName];

                    const edge: Edge = edgesOnThisType.find(
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
                            if (
                                nestedItem["linnet:dataType"] === "Node" &&
                                nestedItem["linnet:namedType"] ===
                                    edge.fieldType
                            ) {
                                let edgeDataType: string;
                                let edgeNamedType: string;
                                let edgeNodeId: string;

                                if (edge.principal === EdgePrinciple.TRUE) {
                                    edgeDataType = `${
                                        edge.edgeName
                                    }::${nodeId}`;
                                    edgeNamedType = edge.fieldType;
                                    edgeNodeId = nestedItem.id;
                                } else {
                                    edgeDataType = `${edge.edgeName}::${
                                        nestedItem.id
                                    }`;
                                    edgeNamedType = edge.fieldType;
                                    edgeNodeId = nodeId;
                                }
                                const itemEdge = {
                                    id: nodeId,
                                    "linnet:dataType": edgeDataType,
                                    "linnet:namedType": edgeNamedType,
                                    "linnet:edge": edgeNodeId,
                                };
                                items.push(itemEdge);
                            }
                            items.push(nestedItem);
                        });
                    }
                });

                // Now add the node
                items.push(node);
            });
        }

        if (createInput.connections) {
            // TODO: add connections (create a connection from the id, but dont create a node)
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
        subsegment.close();

        return items;
    } catch (error) {
        console.error("processEvent", error.message);
        subsegment.addError(error.message, false);
        subsegment.close();
        throw error;
    }
}

/**
 * Given the root nodeId,
 * contruct a return object
 * @param options
 */
function getRootNode({
    segment,
    rootNodeId,
    edgeTypes,
    items,
    linnetFields,
}: {
    segment: any;
    rootNodeId: string;
    edgeTypes: Edge[];
    items: any[];
    linnetFields: string[];
}): any {
    const subsegment = segment.addNewSubsegment("getRootNode");
    try {
        const rootNode = items.find(item => {
            if (item.id === rootNodeId && item["linnet:dataType"] === "Node") {
                return true;
            }
            return false;
        });
        const edgeFields = {};
        for (const edgeIndex in edgeTypes) {
            const edge: Edge = edgeTypes[edgeIndex];
            if (edge.typeName === rootNode["linnet:namedType"]) {
                rootNode[edge.field] = {
                    parentId: rootNode.id,
                    edgeName: edge.edgeName,
                };
                // rootNode[edge.field] = items.filter(item => {
                //     if (
                //         item["linnet:dataType"].startsWith(`${edge.edgeName}::`)
                //     ) {
                //         // if (edge.principal === EdgePrinciple.TRUE) {
                //         //     if (item.id === rootNode.id) {
                //         //         if (edge.cardinality === "ONE") {
                //         //             edgeFields[edge.field] = {
                //         //                 edge: item["linnet:edge"],
                //         //             };
                //         //         } else if (edge.cardinality === "MANY") {
                //         //             if (
                //         //                 typeof rootNode[edge.field] ==
                //         //                 "undefined"
                //         //             ) {
                //         //                 edgeFields[edge.field] = { edges: [] };
                //         //             }
                //         //             edgeFields[edge.field].edges.push(item.id);
                //         //         }
                //         //     }
                //         // } else if (edge.principal === EdgePrinciple.FALSE) {
                //         //     if (item["linnet:edge"] === rootNode.id) {
                //         //         rootNode[edge.field] = item.id;
                //         //         if (edge.cardinality === "ONE") {
                //         //             edgeFields[edge.field] = {
                //         //                 edge: item["linnet:edge"],
                //         //             };
                //         //         } else if (edge.cardinality === "MANY") {
                //         //             if (
                //         //                 typeof rootNode[edge.field] ==
                //         //                 "undefined"
                //         //             ) {
                //         //                 edgeFields[edge.field] = { edges: [] };
                //         //             }
                //         //             edgeFields[edge.field].edges.push(item.id);
                //         //         }
                //         //     }
                //         // }
                //     }
                // });
            }
        }
        const cleanedRootNode = {};
        Object.keys(rootNode).map(field => {
            if (linnetFields.find(linnetField => linnetField === field)) {
            } else {
                cleanedRootNode[field] = rootNode[field];
            }
        });

        return {
            ...cleanedRootNode,
            ...edgeFields,
        };
    } catch (error) {
        console.error("processEvent", error.message);
        subsegment.addError(error.message, false);
        subsegment.close();
        throw error;
    }
}

export { handler };
