package item

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util"
	"github.com/ojkelly/linnet/lambdas/util/types"
	"github.com/satori/go.uuid"
)

// Create object(s) in DynamoDB
func Create(
	ctx context.Context,
	event *types.LambdaEvent,
	dynamo dynamodbiface.DynamoDBAPI,
	now time.Time,
) (
	rootNode types.Node,
	errors []error,
) {
	var err error
	ctx, segment := xray.BeginSubsegment(ctx, "create")
	defer segment.Close(err)

	// Setup some initial vars
	rootNodeID := uuid.NewV4().String()
	createdAt := now
	updatedAt := now

	createdBy := "linnet"

	// Transform the createInput into an object ready for Dynamodb
	items, err := createItems(
		ctx,
		event.LinnetFields,
		event.DataSource,
		event.NamedType,
		event.EdgeTypes,
		rootNodeID,
		rootNodeID,
		createdAt,
		updatedAt,
		createdBy,
		event.Context.Arguments,
	)
	if err != nil {
		errors = append(errors, err)
		return
	}

	// Chunk the items array into the max size allowed by the dynamo api 25
	chunks := util.ChunkNodes(items, 25)

	var unprocessedItems map[string][]*dynamodb.WriteRequest

	// Do a batch update on all items in chunks
	for _, batchItems := range chunks {
		var writeItems []*dynamodb.WriteRequest

		for _, item := range batchItems {
			itemMap, err := dynamodbattribute.MarshalMap(item)
			if err != nil {
				fmt.Println(err)
				errors = append(errors, err)
			}
			writeItems = append(
				writeItems,
				&dynamodb.WriteRequest{
					PutRequest: &dynamodb.PutRequest{
						Item: itemMap,
					},
				},
			)
		}

		batchWriteItemInput := dynamodb.BatchWriteItemInput{
			RequestItems: map[string][]*dynamodb.WriteRequest{
				event.DataSource.TableName: writeItems,
			},
		}

		// fmt.Printf("%#v\n", batchWriteItemInput)

		// Write the items
		batchWriteItemResult, err := dynamo.BatchWriteItemWithContext(
			ctx,
			&batchWriteItemInput,
		)
		if err != nil {
			// if aerr, ok := err.(awserr.Error); ok {
			// 	switch aerr.Code() {
			// 	case dynamodb.ErrCodeProvisionedThroughputExceededException:
			// 		fmt.Println(dynamodb.ErrCodeProvisionedThroughputExceededException, aerr.Error())
			// 	case dynamodb.ErrCodeResourceNotFoundException:
			// 		fmt.Println(dynamodb.ErrCodeResourceNotFoundException, aerr.Error())
			// 	case dynamodb.ErrCodeInternalServerError:
			// 		fmt.Println(dynamodb.ErrCodeInternalServerError, aerr.Error())
			// 	default:
			// 		fmt.Println(aerr.Error())
			// 	}
			// } else {
			// 	// Print the error, cast err to awserr.Error to get the Code and
			// 	// Message from an error.
			// 	fmt.Println(err.Error())
			// }
			errors = append(errors, err)
		}

		if batchWriteItemResult != nil {
			if batchWriteItemResult.UnprocessedItems != nil {
				unprocessedItems = mergeWriteRequst(
					unprocessedItems,
					batchWriteItemResult.UnprocessedItems,
				)
			}
		}
	}

	// Clean up the rootNode for return
	rootNode = util.CleanRootNode(
		ctx,
		rootNodeID,
		event.EdgeTypes,
		event.LinnetFields,
		items,
	)
	return
}

func mergeWriteRequst(
	maps ...map[string][]*dynamodb.WriteRequest,
) (
	result map[string][]*dynamodb.WriteRequest,
) {

	result = maps[0]
	for i, m := range maps {
		if i >= 1 { // map[0] is used as the starting point, so ignore it in this loop
			for k, v := range m {
				result[k] = v
			}
		}
	}
	return
}
