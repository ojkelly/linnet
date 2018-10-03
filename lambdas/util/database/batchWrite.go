package database

import (
	"context"

	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
)

// BatchWriteRequestsToDynamoDB -
func BatchWriteRequestsToDynamoDB(
	ctx context.Context,
	tableName string,
	requests []*dynamodb.WriteRequest,
	dynamo dynamodbiface.DynamoDBAPI,
	maxRetries int,
	retryNumber int,
) (
	unprocessedItems []*dynamodb.WriteRequest,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "BatchWriteRequestsToDynamoDB")
	defer segment.Close(err)

	batchWriteItemInput := dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]*dynamodb.WriteRequest{
			tableName: requests,
		},
	}

	// fmt.Printf("%#v\n", batchWriteItemInput)

	// Write the items
	// batchWriteItemResult
	_, err = dynamo.BatchWriteItemWithContext(
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
		return
	}

	// If there are unprocessed items, we will retry them
	// if batchWriteItemResult != nil {
	// 	if batchWriteItemResult.UnprocessedItems != nil &&
	// 		batchWriteItemResult.UnprocessedItems[tableName][0] != nil {
	// 		unprocessedItems = batchWriteItemResult.UnprocessedItems[tableName]

	// 		// retry the unprocessed items
	// 		unprocessedItems, err = BatchWriteRequestsToDynamoDB(
	// 			ctx,
	// 			tableName,
	// 			unprocessedItems,
	// 			dynamo,
	// 			maxRetries,
	// 			retryNumber,
	// 		)
	// 		if err != nil {
	// 			return unprocessedItems, err
	// 		}

	// 		retryNumber = retryNumber + 1
	// 	}
	// }

	return unprocessedItems, err
}
