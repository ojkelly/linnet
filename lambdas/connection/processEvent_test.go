package main

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/ojkelly/linnet/lambdas/util/types"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/request"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/stretchr/testify/assert"
)

type mockDynamoDBClient struct {
	dynamodbiface.DynamoDBAPI
}

func (m *mockDynamoDBClient) PutItemWithContext(
	ctx aws.Context,
	input *dynamodb.PutItemInput,
	options ...request.Option,
) (
	*dynamodb.PutItemOutput,
	error,
) {
	fmt.Println(input)
	return nil, nil
}

func TestProcessEvent(t *testing.T) {

	currentTime := time.Unix(1517446800, 10)

	tests := []struct {
		event  types.ConnectionPluralLambdaEvent
		output types.LambdaResponse
		throws bool
	}{
		{
			event: types.ConnectionPluralLambdaEvent{
				LinnetFields: []string{
					"linnet:dataType",
					"linnet:edge",
					"linnet:namedType",
					"linnet:ttl",
				},
				DataSource: types.DataSourceDynamoDBConfig{
					UseCallerCredentials: false,
					AwsRegion:            "ap-southeast-2",
					TableName:            "TestAppSync-Development-NodeTable",
				},
				NamedType: "OrdersConnection",
				EdgeTypes: []types.Edge{
					types.Edge{
						TypeName:    "Customer",
						Field:       "orders",
						FieldType:   "Order",
						EdgeName:    "OrdersOnCustomer",
						Required:    false,
						Cardinality: "MANY",
						Principal:   "TRUE",
						Counterpart: types.EdgeCounterpart{
							TypeName: "Order",
							Field:    "customer",
						},
					},
				},
				Context: types.ConnectionPluralLambdaResolverContext{
					Arguments: types.ConnectionPluralLambdaArguments{},
					Result:    map[string]interface{}(nil),
					Source: map[string]interface{}{
						"createdBy":   "linnet",
						"name":        "customer name",
						"suburb":      "w4egrw4g5",
						"id":          "81af6f8f-8639-4ff6-a881-083eb7135de0",
						"email":       "dsarggsdrf@dsfgfsd.sfd",
						"updatedAt":   "2018-08-16T05:10:24.092529313Z",
						"postcode":    "sfefsd",
						"createdAt":   "2018-08-16T05:10:24.092529313Z",
						"phoneNumber": "239487y789234",
						"address":     "asdasda",
					},
				},
			},
			output: types.LambdaResponse{
				Data:   types.Node{},
				Errors: []string{},
			},
		},
	}

	for i, test := range tests {
		ctx, _ := xray.BeginSegment(context.Background(), "TestProcessEvent")

		assert := assert.New(t)

		output := processEvent(
			ctx,
			dynamo,
			&test.event,
			currentTime,
		)
		fmt.Println("output:", output)
		t.Fail()

		fieldsToMatch := len(test.output.Data)
		fieldsMatch := 0

		for key, value := range test.output.Data {
			for outputKey, outputValue := range output.Data {
				if key == outputKey &&
					value == outputValue {
					fieldsMatch = fieldsMatch + 1
				}
			}
		}

		assert.Equal(
			fieldsToMatch,
			fieldsMatch,
			fmt.Sprintf("Test %d", i),
		)
	}
}
