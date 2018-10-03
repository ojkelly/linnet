package main

import (
	"context"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/deleteMany/item"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

func processEvent(
	ctx context.Context,
	dynamo *dynamodb.DynamoDB,
	event *DeleteLambdaEvent,
) (
	response types.LambdaResponse,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "processEvent")
	defer segment.Close(err)

	xray.AWS(dynamo.Client)

	var deleteIDs DeleteIDs

	if event.Context.Arguments.Where.IDs != nil {
		deleteIDs = event.Context.Arguments.Where.IDs
	} else {
		response.Errors = append(response.Errors, "Cannot Delete, no ID passed")
		return
	}

	now := time.Now()
	defaultTime := now.Add(time.Duration(-30) * time.Minute).Unix()
	ttl := strconv.FormatInt(
		defaultTime,
		10,
	)

	// If the provided TTL is more than 30m in the past, it may be invalid
	// So we use our default.
	if event.Context.Arguments.Set.TimeToLive < int(defaultTime) {
		ttl = strconv.FormatInt(
			int64(event.Context.Arguments.Set.TimeToLive),
			10,
		)
	} else {
		// Set the ttl to expire at
	}

	deletedCount, err := item.DeleteMany(
		ctx,
		dynamo,
		aws.String(event.DataSource.TableName),
		deleteIDs,
		ttl,
	)

	response.Data = map[string]interface{}{
		"count": deletedCount,
	}

	return
}
