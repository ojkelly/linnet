package database

import (
	"context"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
)

// UpdateItemTTL -
func UpdateItemTTL(
	ctx context.Context,
	dynamo dynamodbiface.DynamoDBAPI,
	tableName *string,
	item map[string]*dynamodb.AttributeValue,
	ttl string,
) (
	deleted bool,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "updateItemTTL")
	defer segment.Close(err)

	xray.AddAnnotation(ctx, "ttl", ttl)

	updateItemInput := &dynamodb.UpdateItemInput{
		TableName: tableName,
		Key:       item,
		ExpressionAttributeNames: map[string]*string{
			"#ttl": aws.String("linnet:ttl"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":ttlValue": &dynamodb.AttributeValue{
				N: aws.String(ttl),
			},
		},
		UpdateExpression: aws.String("SET #ttl = :ttlValue"),
		ReturnValues:     aws.String("NONE"),
	}

	_, err = dynamo.UpdateItemWithContext(
		ctx,
		updateItemInput,
	)

	return true, err
}
