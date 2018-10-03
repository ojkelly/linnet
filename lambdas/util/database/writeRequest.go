package database

import (
	"context"

	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

// MarshallItemsToWriteRequests in chunks of 25
func MarshallItemsToWriteRequests(
	ctx context.Context,
	items []types.Node,
) (
	requests [][]*dynamodb.WriteRequest,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "MarshallItemsToWriteRequests")
	defer segment.Close(err)

	// Chunk the items array into the max size allowed by the dynamo api 25
	chunks := util.ChunkNodes(items, 25)

	// Do a batch update on all items in chunks
	for _, batchItems := range chunks {
		var writeItems []*dynamodb.WriteRequest

		for _, item := range batchItems {
			itemMap, err := dynamodbattribute.MarshalMap(item)
			if err != nil {
				return requests, err
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
		requests = append(
			requests,
			writeItems,
		)
	}
	return requests, err
}
