package main

import (
	"context"
	"time"

	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

func processEvent(
	ctx context.Context,
	dynamo *dynamodb.DynamoDB,
	event *types.LambdaEvent,
	currentTime time.Time,
) (
	rootNode types.Node,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "processEvent")
	defer segment.Close(nil)

	xray.AWS(dynamo.Client)

	// If successfully created, return a cleaned Root Node
	return
}
