package item

import (
	"context"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/database"
)

// Delete item by id
// Also delete all edges where this Node was the PRIMARY edge
//
// Deletion process is as follows:
// 1. Items to delete are discoved
// 2. Items to delete are updated with a NodeState ==
func Delete(
	ctx context.Context,
	dynamo dynamodbiface.DynamoDBAPI,
	tableName *string,
	id string,
	ttl string,
) (
	deletedCount int,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "Delete")
	defer segment.Close(err)

	// First get a list of all the Hash and Sort keys matching this ID
	itemsToDelete, err := database.FindAllItemsToDeleteWithHashKey(
		ctx,
		dynamo,
		tableName,
		id,
		ttl,
	)
	if err != nil {
		return
	}

	for _, item := range *itemsToDelete {
		// Then delete everything in that list.
		deleted, err := database.UpdateItemTTL(
			ctx,
			dynamo,
			tableName,
			item,
			ttl,
		)
		if err != nil {
			return deletedCount, err
		}

		if deleted {
			deletedCount = deletedCount + 1
		}
	}
	return deletedCount, err
}

func findAllItemsWithHashKey(
	ctx context.Context,
	dynamo dynamodbiface.DynamoDBAPI,
	tableName *string,
	hash string,
	ttl string,
) (
	itemsToDelete *[]map[string]*dynamodb.AttributeValue,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "findAllItemsWithHashKey")
	defer segment.Close(err)

	// TODO: handle pages
	queryInput := &dynamodb.QueryInput{
		TableName: tableName,
		ExpressionAttributeNames: map[string]*string{
			"#dataType": aws.String("linnet:dataType"),
			"#ttl":      aws.String("linnet:ttl"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":idValue": &dynamodb.AttributeValue{
				S: aws.String(hash),
			},
			":now": &dynamodb.AttributeValue{
				S: aws.String(ttl),
			},
		},
		KeyConditionExpression: aws.String("id = :idValue"),
		// We only want the HASH and RANGE keys returned, as that's all we're deleting atm.
		// We can extend this to linnet:edge at some point in the future, but that
		// could be almosst unbounded (if you have a lot of data), so we're not handling that
		// style of cascading deletes yet.
		ProjectionExpression: aws.String("id, #dataType"),
		FilterExpression:     aws.String("attribute_not_exists(#ttl) OR #ttl > :now"),
	}

	queryResult, err := dynamo.QueryWithContext(
		ctx,
		queryInput,
	)

	itemsToDelete = &queryResult.Items

	return
}
