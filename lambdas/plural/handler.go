package main

import (
	"context"
	"encoding/json"
	"time"

	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

var dynamo *dynamodb.DynamoDB

func init() {
	dynamo = dynamodb.New(
		session.Must(
			session.NewSession(),
		),
	)
}

func handler(ctx context.Context, evt json.RawMessage) (response []byte, err error) {
	xray.Configure(xray.Config{LogLevel: "error"})
	ctx, segment := xray.BeginSubsegment(ctx, "handler")
	defer segment.Close(err)

	// Unmarshall the Event
	var event types.ConnectionPluralLambdaEvent
	err = json.Unmarshal(evt, &event)
	if err != nil {
		return
	}

	// Process the event
	rootNode := processEvent(
		ctx,
		dynamo,
		&event,
		time.Now(),
	)

	response, err = json.Marshal(rootNode)

	return response, err
}
