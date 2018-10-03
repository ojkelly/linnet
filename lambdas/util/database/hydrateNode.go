package database

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

// HydrateNodes with a given ID, return its Node item
func HydrateNodes(
	ctx context.Context,
	dynamo dynamodbiface.DynamoDBAPI,
	tableName string,
	edges []string,
) (
	nodes []types.Node,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "HydrateNode")
	defer segment.Close(err)
	requests, err := MarshallItemsToGetItemRequests(
		ctx,
		tableName,
		edges,
	)
	if err != nil {
		return
	}
	for _, request := range requests {
		batchGetItemResult, err := dynamo.BatchGetItemWithContext(
			ctx,
			request,
		)
		if err != nil {
			return nil, err
		}
		responses := batchGetItemResult.Responses[tableName]

		for _, response := range responses {
			hydratedItems := make(types.Node, len(batchGetItemResult.Responses[tableName]))
			err = dynamodbattribute.UnmarshalMap(
				response,
				&hydratedItems,
			)
			nodes = append(nodes, hydratedItems)
			if err != nil {
				return nil, err
			}
		}
	}
	return nodes, err
}

// MarshallItemsToGetItemRequests in chunks of 25
func MarshallItemsToGetItemRequests(
	ctx context.Context,
	tableName string,
	edges []string,
) (
	requests []*dynamodb.BatchGetItemInput,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "MarshallItemsToWriteRequests")
	defer segment.Close(err)

	// Chunk the items array into the max size allowed by the dynamo api 25
	chunks := util.ChunkStringArray(edges, 25)

	// Do a batch update on all items in chunks
	for _, chunk := range chunks {
		var keys []map[string]*dynamodb.AttributeValue

		for _, id := range chunk {
			if id != "" {
				key := map[string]*dynamodb.AttributeValue{
					"id": &dynamodb.AttributeValue{
						S: aws.String(id),
					},
					"linnet:dataType": &dynamodb.AttributeValue{
						S: aws.String("Node"),
					},
				}

				keys = append(keys, key)
			}
		}

		requests = append(
			requests,
			&dynamodb.BatchGetItemInput{
				RequestItems: map[string]*dynamodb.KeysAndAttributes{
					tableName: &dynamodb.KeysAndAttributes{
						Keys: keys,
					},
				},
			},
		)
	}
	fmt.Println(requests)

	return requests, err
}
