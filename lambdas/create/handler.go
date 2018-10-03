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
	ctx, segment := xray.BeginSubsegment(ctx, "handler")
	defer segment.Close(err)

	// Unmarshall the Event
	var event types.LambdaEvent
	err = json.Unmarshal(evt, &event)
	if err != nil {
		return
	}

	// Process the event, and return the rootNode
	result := processEvent(
		ctx,
		dynamo,
		&event,
		time.Now(),
	)

	// Return the rootNode as json, encoded in base64
	response, err = json.Marshal(result)
	return
}
