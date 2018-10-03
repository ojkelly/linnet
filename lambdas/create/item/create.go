package item

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util"
	"github.com/ojkelly/linnet/lambdas/util/types"
	"github.com/satori/go.uuid"
)

var MAX_RETRIES = 5

// Create object(s) in DynamoDB
func Create(
	ctx context.Context,
	event *types.LambdaEvent,
	dynamo dynamodbiface.DynamoDBAPI,
	tableName *string,
	now time.Time,
) (
	rootNode types.Node,
	errors []error,
) {
	var err error
	ctx, segment := xray.BeginSubsegment(ctx, "Create")
	defer segment.Close(err)

	// Setup some initial vars
	rootNodeID := uuid.NewV4().String()
	createdAt := now
	updatedAt := now

	createdBy := "linnet"

	segment.AddAnnotation("rootNodeID", rootNodeID)

	// TODO: Write data as put's, and connections as updates

	// Transform the createInput into an object ready for Dynamodb
	// TODO: add https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html#Expressions.ConditionExpressions.PreventingOverwrites
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

	var wg sync.WaitGroup
	wg.Add(len(items))

	for _, item := range items {
		go func(
			ctx context.Context,
			item types.Node,
			tableName *string,
			dynamo dynamodbiface.DynamoDBAPI,
		) {
			putRequest, err := marshallPutItem(ctx, item, tableName)
			if err != nil {
				wg.Done()
				return
			}

			err = putItem(
				ctx,
				putRequest,
				dynamo,
			)
			if err != nil {
				fmt.Println(err)
				wg.Done()
				return
			}
			wg.Done()
		}(ctx, item, tableName, dynamo)
	}

	// Wait for our put requests to complete
	wg.Wait()

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

func marshallPutItem(
	ctx context.Context,
	item types.Node,
	tableName *string,
) (
	putItem *dynamodb.PutItemInput,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "Create")
	defer segment.Close(err)

	// Marshall our Node into dynamodb's format
	itemMap, err := dynamodbattribute.MarshalMap(item)
	if err != nil {
		return
	}

	// create the put request
	putItem = &dynamodb.PutItemInput{
		Item:                itemMap,
		ConditionExpression: aws.String("attribute_not_exists(id)"),
		TableName:           tableName,
	}

	return putItem, nil
}

func putItem(
	ctx context.Context,
	putRequest *dynamodb.PutItemInput,
	dynamo dynamodbiface.DynamoDBAPI,
) (err error) {
	ctx, segment := xray.BeginSubsegment(ctx, "Create")
	defer segment.Close(err)

	_, err = dynamo.PutItemWithContext(
		ctx,
		putRequest,
	)
	if err != nil {
		if aerr, ok := err.(awserr.Error); ok {
			switch aerr.Code() {
			case dynamodb.ErrCodeProvisionedThroughputExceededException:
				fmt.Println(dynamodb.ErrCodeProvisionedThroughputExceededException, aerr.Error())
			case dynamodb.ErrCodeResourceNotFoundException:
				fmt.Println(dynamodb.ErrCodeResourceNotFoundException, aerr.Error())
			case dynamodb.ErrCodeInternalServerError:
				fmt.Println(dynamodb.ErrCodeInternalServerError, aerr.Error())
			default:
				fmt.Println(aerr.Error())
			}
		} else {
			// Print the error, cast err to awserr.Error to get the Code and
			// Message from an error.
			fmt.Println(err.Error())
		}
	}
	return
}
