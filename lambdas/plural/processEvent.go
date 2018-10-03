package main

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/connection/item"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

func processEvent(
	ctx context.Context,
	dynamo *dynamodb.DynamoDB,
	event *types.ConnectionPluralLambdaEvent,
	currentTime time.Time,
) (
	response types.LambdaResponse,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "processEvent")
	defer segment.Close(nil)

	xray.AWS(dynamo.Client)

	var errs []error
	fmt.Printf("%#v\n", event)

	response.Data, errs = item.Get(
		ctx,
		event,
		dynamo,
	)

	if errs != nil {
		for _, err := range errs {
			response.Errors = append(response.Errors, err.Error())
		}
	}

	// If successfully created, return a cleaned Root Node
	return response
}
