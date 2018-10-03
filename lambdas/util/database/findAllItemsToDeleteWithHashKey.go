package database

import (
	"context"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
)

// FindAllItemsToDeleteWithHashKey -
func FindAllItemsToDeleteWithHashKey(
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
