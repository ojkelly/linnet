import {
  DataSource,
  DataSourceTemplate,
  DataSourceDynamoDBConfig,
} from "../schema/dataSources/dataSources";
import { TaskContext, Config } from "../common/types";
import { Subscriber } from "rxjs";

import * as AWS from "aws-sdk";
async function upsertDynamoDBTable({
  config,
  dataSourceTemplate,
  observer,
}: {
  config: Config;
  dataSourceTemplate: DataSourceTemplate;
  observer: Subscriber<any>;
}): Promise<any> {
  const dataSourceConfig: DataSourceDynamoDBConfig = dataSourceTemplate.config as DataSourceDynamoDBConfig;

  try {
    const dynamodb = new AWS.DynamoDB({
      apiVersion: "2012-08-10",
      region: dataSourceConfig.awsRegion,
    });

    observer.next(`Checking if ${dataSourceConfig.tableName} exists.`);
    const describeTableParams: AWS.DynamoDB.DescribeTableInput = {
      TableName: dataSourceConfig.tableName,
    };

    const updateTimeToLiveParams: AWS.DynamoDB.Types.UpdateTimeToLiveInput = {
      TableName: dataSourceConfig.tableName,
      TimeToLiveSpecification: {
        Enabled: true,
        AttributeName: "linnet:ttl",
      },
    };

    let tableExists: boolean = false;

    try {
      let describeTable: AWS.DynamoDB.DescribeTableOutput = await dynamodb
        .describeTable(describeTableParams)
        .promise();
      if (describeTable.Table.TableName === dataSourceConfig.tableName) {
        tableExists = true;
      }
    } catch (describeTableError) {
      if (describeTableError.code !== "ResourceNotFoundException") {
        throw describeTableError;
      }
    }

    if (tableExists === false) {
      observer.next(`Creating new table ${dataSourceConfig.tableName}`);
      const createTableParams: AWS.DynamoDB.CreateTableInput = {
        AttributeDefinitions: [
          {
            AttributeName: "id",
            AttributeType: "S",
          },
          {
            AttributeName: "linnet:dataType",
            AttributeType: "S",
          },
          {
            AttributeName: "linnet:edge",
            AttributeType: "S",
          },
          {
            AttributeName: "linnet:namedType",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "id",
            KeyType: "HASH",
          },
          {
            AttributeName: "linnet:dataType",
            KeyType: "RANGE",
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits:
            config.dataSources.DynamoDB.provisionedThroughput.nodeTable
              .readCapacityUnits,
          WriteCapacityUnits:
            config.dataSources.DynamoDB.provisionedThroughput.nodeTable
              .writeCapacityUnits,
        },
        TableName: dataSourceConfig.tableName,
        GlobalSecondaryIndexes: [
          {
            IndexName: "edge-dataType",
            KeySchema: [
              {
                AttributeName: "linnet:edge",
                KeyType: "HASH",
              },
              {
                AttributeName: "linnet:dataType",
                KeyType: "RANGE",
              },
            ],
            Projection: {
              ProjectionType: "ALL",
            },
            ProvisionedThroughput: {
              ReadCapacityUnits:
                config.dataSources.DynamoDB.provisionedThroughput
                  .edgeDataTypeIndex.readCapacityUnits,
              WriteCapacityUnits:
                config.dataSources.DynamoDB.provisionedThroughput
                  .edgeDataTypeIndex.writeCapacityUnits,
            },
          },
          {
            IndexName: "namedType-id",
            KeySchema: [
              {
                AttributeName: "linnet:namedType",
                KeyType: "HASH",
              },
              {
                AttributeName: "id",
                KeyType: "RANGE",
              },
            ],
            Projection: {
              ProjectionType: "ALL",
            },
            ProvisionedThroughput: {
              ReadCapacityUnits:
                config.dataSources.DynamoDB.provisionedThroughput
                  .namedTypeIdIndex.readCapacityUnits,
              WriteCapacityUnits:
                config.dataSources.DynamoDB.provisionedThroughput
                  .namedTypeIdIndex.writeCapacityUnits,
            },
          },
        ],
      };

      const createTable: AWS.DynamoDB.CreateTableOutput = await dynamodb
        .createTable(createTableParams)
        .promise();
    } else {
      try {
        observer.next(`Updating table ${dataSourceConfig.tableName}`);
        const updateTableParams: AWS.DynamoDB.UpdateTableInput = {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
            {
              AttributeName: "linnet:dataType",
              AttributeType: "S",
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits:
              config.dataSources.DynamoDB.provisionedThroughput.nodeTable
                .readCapacityUnits,
            WriteCapacityUnits:
              config.dataSources.DynamoDB.provisionedThroughput.nodeTable
                .writeCapacityUnits,
          },
          TableName: dataSourceConfig.tableName,
        };

        const updateTable: AWS.DynamoDB.UpdateTableOutput = await dynamodb
          .updateTable(updateTableParams)
          .promise();
      } catch (updateTableError) {
        if (updateTableError.code === "ValidationException") {
          // This is safe to ignore
          observer.next(`No updates needed`);
          observer.complete();
          return;
        }
        observer.error(updateTableError);
        throw updateTableError;
      }
    }

    let describeTable: AWS.DynamoDB.DescribeTableOutput = await dynamodb
      .describeTable(describeTableParams)
      .promise();

    observer.next(
      `${describeTable.Table.TableStatus}: ${dataSourceConfig.tableName}`,
    );

    // Now wait for the schema creation to finish
    describeTable = await new Promise(async (resolve, reject) => {
      if (describeTable.Table.TableStatus === "ACTIVE") {
        resolve(describeTable);
      }
      while (describeTable.Table.TableStatus !== "ACTIVE") {
        try {
          // Get the status
          describeTable = await dynamodb
            .describeTable(describeTableParams)
            .promise();

          if (describeTable.Table.TableStatus === "ACTIVE") {
            resolve(describeTable);
          }
        } catch (err) {
          reject(err);
        }

        // Wait so we dont hit a rate limit
        setTimeout(() => {}, 1000);
      }
    });

    // Now add TTL
    await dynamodb.updateTimeToLive(updateTimeToLiveParams).promise();
    observer.next(`Created DynamoDB Table: ${dataSourceConfig.tableName}`);
  } catch (error) {
    if (error.code === "ResourceInUseException") {
      observer.next(`Exists DynamoDB Table: ${dataSourceConfig.tableName}`);
    } else {
      observer.error(error);
      throw error;
    }
  }
}
export { upsertDynamoDBTable };
