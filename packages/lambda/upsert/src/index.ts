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
import * as chunk from "lodash.chunk";

import {
  HandlerEvent,
  upsertInput,
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
      subsegment.addAnnotation("ResolverType", "upsert");
      AWSXRay.capturePromise();

      console.log(JSON.stringify(event));

      // Process the event
      if (typeof event.context.arguments.data === "undefined") {
          throw new Error("No data argument supplied.");
      }
      const result: any = await processEvent({
          segment,
          linnetFields: event.linnetFields,
          dataSource: event.dataSource,
          namedType: event.namedType,
          edgeTypes: event.edgeTypes,
          upsertInput: event.context.arguments,
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
* Process the upsert Resolver event, and return the result
* @param options
*/
async function processEvent({
  segment,
  linnetFields,
  dataSource,
  namedType,
  edgeTypes,
  upsertInput,
  source,
}: {
  segment: any;
  linnetFields: string[];
  dataSource: DataSourceDynamoDBConfig;
  namedType: string;
  edgeTypes: Edge[];
  upsertInput: upsertInput;
  source: any;
}): Promise<any> {
  const subsegment = segment.addNewSubsegment("processEvent");
  try {
      const result = await generateupsert({
          segment,
          linnetFields,
          dataSource,
          namedType,
          edgeTypes,
          upsertInput,
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
async function generateupsert({
  segment,
  linnetFields,
  dataSource,
  namedType,
  edgeTypes,
  upsertInput,
  source,
}: {
  segment: any;
  linnetFields: string[];
  dataSource: DataSourceDynamoDBConfig;
  namedType: string;
  edgeTypes: Edge[];
  upsertInput: upsertInput;
  source: any;
}): Promise<any> {
  const subsegment = segment.addNewSubsegment("generateupsert");
  try {
      const rootNodeId = uuid.v4();
      const upsertdAt = Date.now();
      const updatedAt = upsertdAt;

      // TODO: This needs to be updated to reflect the user who upsertd this node
      const upsertdBy = "linnet";

      // upsert all the items
      // TODO: this cant handle multiple items in a nested upsert
      const items = generateWriteItem({
          segment,
          linnetFields,
          namedType,
          edgeTypes,
          upsertdAt,
          updatedAt,
          upsertdBy,
          upsertInput,
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

      // Chunk the items array into the max size allowed by the dynamo api 25
      const batchItems = chunk(items, 25);
      // Do a batch update on all items in chunks
      const batchWriteResults = await Promise.all(
          batchItems.map(async batch => {
              const batchWriteParams: AWS.DynamoDB.BatchWriteItemInput = {
                  RequestItems: {
                      [dataSource.tableName]: batch.map(item => ({
                          PutRequest: {
                              Item: AWS.DynamoDB.Converter.marshall(item),
                          },
                      })),
                  },
              };

              // TODO: check for failures, and retry up to 3 times
              return dynamoDB.batchWriteItem(batchWriteParams).promise();
          }),
      );
      console.log(JSON.stringify(batchWriteResults));
      subsegment.close();
      // Return the root node to the resolve
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
* and recurse on itself, if there are nested upserts
* @param options
*/
function generateWriteItem({
  segment,
  linnetFields,
  parentNodeId,
  edgeTypes,
  namedType,
  upsertdAt,
  updatedAt,
  upsertdBy,
  upsertInput,
  rootNodeId,
}: {
  segment: any;
  linnetFields: string[];
  parentNodeId?: string;
  edgeTypes: Edge[];
  namedType: string;
  upsertdAt: number;
  updatedAt: number;
  upsertdBy: string;
  upsertInput: upsertInput;
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

      if (upsertInput.data) {
          const nodesToupsert = [];

          // Handle GraphQLList types the same as NamedTypes
          if (Array.isArray(upsertInput.data)) {
              nodesToupsert.push(...upsertInput.data);
          } else {
              nodesToupsert.push(upsertInput.data);
          }

          nodesToupsert.forEach(upsertNode => {
              let nodeId = uuid.v4();
              if (rootNodeId) {
                  nodeId = rootNodeId;
              }

              // upsert the Node
              const node = {
                  id: nodeId,
                  "linnet:dataType": "Node",
                  "linnet:namedType": namedType,
                  upsertdAt,
                  updatedAt,
                  upsertdBy,
              };

              // Add all upsert fields to the Node, and extract all the edges
              Object.keys(upsertNode).forEach(fieldName => {
                  const field = upsertNode[fieldName];

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
                          upsertdAt,
                          updatedAt,
                          upsertdBy,
                          upsertInput: field,
                      });

                      nestedItems.forEach(nestedItem => {
                          if (
                              nestedItem["linnet:dataType"] === "Node" &&
                              nestedItem["linnet:namedType"] ===
                                  edge.fieldType
                          ) {
                              let itemEdge: any = {};
                              let edgeDataType: string;
                              let edgeNamedType: string;
                              let edgeNodeId: string;

                              if (edge.principal === EdgePrinciple.TRUE) {
                                  itemEdge = {
                                      id: nodeId,
                                      // dataType is a sort key, that exists to upsert
                                      // a unique record
                                      "linnet:dataType": `${edge.edgeName}::${
                                          nestedItem.id
                                      }`,
                                      "linnet:namedType": edge.fieldType,
                                      "linnet:edge": nestedItem.id,
                                  };
                              } else {
                                  itemEdge = {
                                      id: nestedItem.id,
                                      // dataType is a sort key, that exists to upsert
                                      // a unique record
                                      "linnet:dataType": `${
                                          edge.edgeName
                                      }::${nodeId}`,
                                      "linnet:namedType":
                                          edge.counterpart.type,
                                      "linnet:edge": nodeId,
                                  };
                              }
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

      if (upsertInput.connections) {
          // TODO: add connections (upsert a connection from the id, but dont upsert a node)
          // upsert any Connections
          //   Object.keys(upsertInput.data).forEach(fieldName => {
          //     const edge = edgesOnThisType.find(
          //         edge => edge.field == fieldName,
          //     );
          //     console.log(edge);
          //     const field = upsertInput.data[fieldName];
          // });
      }

      // upsert the Connections and any nested Nodes
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
