package main

import (
	"context"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/delete/item"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

func processEvent(
	ctx context.Context,
	dynamo *dynamodb.DynamoDB,
	event *types.LambdaEvent,
) (
	response types.LambdaResponse,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "processEvent")
	defer segment.Close(err)

	xray.AWS(dynamo.Client)

	var deleteID string

	if event.Context.Arguments != nil &&
		event.Context.Arguments["where"] != nil &&
		event.Context.Arguments["where"].(map[string]interface{})["id"] != nil {
		deleteID = event.Context.Arguments["where"].(map[string]interface{})["id"].(string)
	} else {
		response.Errors = append(response.Errors, "Cannot Delete, no ID passed")
		return
	}

	var ttl string
	if event.Context.Arguments["set"] != nil &&
		event.Context.Arguments["set"].(map[string]interface{})["timeToLive"] != nil {
		ttl = strconv.FormatInt(
			int64(event.Context.Arguments["set"].(map[string]interface{})["timeToLive"].(float64)),
			10,
		)
	} else {
		// Set the ttl to expire at
		now := time.Now()
		ttl = strconv.FormatInt(now.Unix(), 10)
	}

	deletedCount, err := item.Delete(
		ctx,
		dynamo,
		aws.String(event.DataSource.TableName),
		deleteID,
		ttl,
	)

	response.Data = map[string]interface{}{
		"count": deletedCount,
	}

	return
}
