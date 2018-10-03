package database_test

import (
	"context"
	"fmt"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/request"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/database"
	"github.com/ojkelly/linnet/lambdas/util/types"
	"github.com/stretchr/testify/assert"
)

type mockDynamoDBClient struct {
	dynamodbiface.DynamoDBAPI
}

func (m *mockDynamoDBClient) QueryWithContext(
	ctx aws.Context,
	input *dynamodb.QueryInput,
	options ...request.Option,
) (
	*dynamodb.QueryOutput,
	error,
) {
	queryOutput := dynamodb.QueryOutput{
		Items: []map[string]*dynamodb.AttributeValue{
			map[string]*dynamodb.AttributeValue{
				"createdAt": &dynamodb.AttributeValue{
					S: aws.String("2018-08-16T05:10:24.092529313Z"),
				},
				"id": &dynamodb.AttributeValue{
					S: aws.String("81af6f8f-8639-4ff6-a881-083eb7135de0"),
				},
				"createdBy": &dynamodb.AttributeValue{
					S: aws.String("linnet"),
				},
				"linnet:namedType": &dynamodb.AttributeValue{
					S: aws.String("Order"),
				},
				"linnet:edge": &dynamodb.AttributeValue{
					S: aws.String("05c339a9-e3d3-40c3-9df6-6fb28bae495a"),
				},
				"linnet:dataType": &dynamodb.AttributeValue{
					S: aws.String("OrdersOnCustomer::05c339a9-e3d3-40c3-9df6-6fb28bae495a"),
				},
				"updatedAt": &dynamodb.AttributeValue{
					S: aws.String("2018-08-16T05:10:24.092529313Z"),
				},
			},
		},
		LastEvaluatedKey: map[string]*dynamodb.AttributeValue{
			"id": &dynamodb.AttributeValue{
				S: aws.String("81af6f8f-8639-4ff6-a881-083eb7135de0"),
			},
		},
		Count:        aws.Int64(1),
		ScannedCount: aws.Int64(1),
	}
	return &queryOutput, nil
}

func TestQueryForEdges(t *testing.T) {

	type Input struct {
		TableName string
		ID        string
		Edge      types.Edge
		Limit     int64
	}

	type Output struct {
		edges            []string
		lastEvaluatedKey string
	}

	tests := []struct {
		input  Input
		output Output
		throws bool
	}{
		{
			input: Input{
				TableName: "TestTable",
				ID:        "81af6f8f-8639-4ff6-a881-083eb7135de0",
				Edge: types.Edge{
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
				Limit: 10,
			},
			output: Output{
				edges: []string{
					"05c339a9-e3d3-40c3-9df6-6fb28bae495a",
				},
				lastEvaluatedKey: "81af6f8f-8639-4ff6-a881-083eb7135de0",
			},
			throws: false,
		},
	}

	for i, test := range tests {
		ctx, _ := xray.BeginSegment(context.Background(), "TestProcessEvent")

		dynamo := mockDynamoDBClient{}

		assert := assert.New(t)

		edges, lastEvaluatedKey, err := database.QueryForEdges(
			ctx,
			&dynamo,
			test.input.TableName,
			test.input.ID,
			test.input.Edge,
			test.input.Limit,
		)

		if test.throws {
			assert.NotNil(err)
		} else {
			assert.Nil(err)
			assert.Equal(
				test.output.edges,
				edges,
				fmt.Sprintf("Test %d", i),
			)
			assert.Equal(
				test.output.lastEvaluatedKey,
				lastEvaluatedKey,
				fmt.Sprintf("Test %d", i),
			)
		}
	}
}
