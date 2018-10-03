package item

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/request"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/constants"
	"github.com/ojkelly/linnet/lambdas/util/types"
	"github.com/stretchr/testify/assert"
)

type mockDynamoDBClient struct {
	dynamodbiface.DynamoDBAPI
}

func (m *mockDynamoDBClient) BatchWriteItemWithContext(
	ctx aws.Context,
	input *dynamodb.BatchWriteItemInput,
	options ...request.Option,
) (
	*dynamodb.BatchWriteItemOutput,
	error,
) {
	fmt.Println(input)
	return nil, nil
}

func TestCreate(t *testing.T) {
	type Output struct {
		response types.Node
		err      error
	}

	currentTime := time.Unix(1517446800, 10)

	edgeTypes := []types.Edge{
		types.Edge{
			TypeName:  "Customer",
			Field:     "orders",
			FieldType: "Order",
			EdgeName:  "OrdersOnCustomer",
			Required:  false, Cardinality: "MANY",
			Principal: "TRUE",
			Counterpart: types.EdgeCounterpart{
				TypeName: "Order",
				Field:    "customer",
			},
		},
		types.Edge{
			TypeName:  "Order",
			Field:     "customer",
			FieldType: "Customer",
			EdgeName:  "OrdersOnCustomer",
			Required:  true, Cardinality: "ONE",
			Principal: "FALSE",
			Counterpart: types.EdgeCounterpart{
				TypeName: "Customer",
				Field:    "orders",
			},
		},
		types.Edge{
			TypeName:  "Order",
			Field:     "products",
			FieldType: "Product",
			EdgeName:  "ProductsOnOrders",
			Required:  true, Cardinality: "MANY",
			Principal: "TRUE",
			Counterpart: types.EdgeCounterpart{
				TypeName: "Product",
				Field:    "orders",
			},
		},
		types.Edge{
			TypeName:  "Product",
			Field:     "orders",
			FieldType: "Order",
			EdgeName:  "ProductsOnOrders",
			Required:  false, Cardinality: "MANY",
			Principal: "FALSE",
			Counterpart: types.EdgeCounterpart{
				TypeName: "Order",
				Field:    "products",
			},
		},
	}

	tests := []struct {
		event  types.LambdaEvent
		output Output
		throws bool
	}{
		{
			event: types.LambdaEvent{
				LinnetFields: constants.LinnetFields,
				DataSource: types.DataSourceDynamoDBConfig{
					UseCallerCredentials: false,
					AwsRegion:            "us-east-1",
					TableName:            "DynamoDBTestTable",
				},
				NamedType: "Customer",
				EdgeTypes: edgeTypes,
				Context: types.LinnetResolverContext{
					Arguments: map[string]interface{}{
						"data": []interface{}{
							map[string]interface{}{
								"title":       "Test Product 1",
								"description": "Test Product 1 Description",
								"price":       "1.00",
							},
							map[string]interface{}{
								"description": "Test Product 2 Description",
								"price":       "2.00",
								"title":       "Test Product 2",
							},
							map[string]interface{}{
								"title":       "Test Product 3",
								"description": "Test Product 3 Description",
								"price":       "3.00",
							},
						},
						"connections": map[string]string{},
						"where":       map[string]interface{}(nil),
					},
					Result: interface{}(nil),
					Source: interface{}(nil),
				},
			},
			throws: false,
			output: Output{
				response: types.Node{
					"updatedAt":   currentTime,
					"title":       "Test Product 1",
					"description": "Test Product 1 Description",
					"createdAt":   currentTime,
					"createdBy":   "linnet",
					"price":       "1.00",
				},
				err: nil,
			},
		},
		{
			event: types.LambdaEvent{
				LinnetFields: constants.LinnetFields,
				DataSource: types.DataSourceDynamoDBConfig{
					UseCallerCredentials: false,
					AwsRegion:            "us-east-1",
					TableName:            "DynamoDBTestTable",
				},
				NamedType: "Customer",
				EdgeTypes: edgeTypes,
				Context: types.LinnetResolverContext{Arguments: map[string]interface{}{
					"data": map[string]interface{}{
						"address":     "asdasda",
						"suburb":      "w4egrw4g5",
						"postcode":    "sfefsd",
						"phoneNumber": "239487y789234",
						"email":       "dsarggsdrf@dsfgfsd.sfd",
						"orders": map[string]interface{}{
							"data": []interface{}{
								map[string]interface{}{
									"paid": true, "nodeState": "ACTIVE",
									"status": "COMPLETE",
									"products": map[string]interface{}{
										"data": []interface{}{
											map[string]interface{}{
												"nodeState":   "ACTIVE",
												"title":       "Product 23423",
												"description": "This is another product",
												"price":       "33",
											},
											map[string]interface{}{
												"price":       "33",
												"nodeState":   "ACTIVE",
												"title":       "Product 345235345",
												"description": "This is another product",
											},
											map[string]interface{}{
												"description": "This is another product",
												"price":       "33",
												"nodeState":   "ACTIVE",
												"title":       "Product 32452345345",
											},
										},
									},
									"price": 99,
								},
							},
						},
						"nodeState": "ACTIVE",
						"name":      "customer name",
					},
				},
					Result: interface{}(nil),
					Source: interface{}(nil),
				},
			},
			throws: false,
			output: Output{
				response: types.Node{
					"createdAt":   currentTime,
					"nodeState":   "ACTIVE",
					"updatedAt":   currentTime,
					"createdBy":   "linnet",
					"address":     "asdasda",
					"suburb":      "w4egrw4g5",
					"postcode":    "sfefsd",
					"phoneNumber": "239487y789234",
					"email":       "dsarggsdrf@dsfgfsd.sfd",
				},
				err: nil,
			},
		},
	}

	for i, test := range tests {
		ctx, _ := xray.BeginSegment(context.Background(), "TestProcessEvent")

		assert := assert.New(t)
		// var mockDynamoDB mockDynamoDBClient
		mockDynamoDB := &mockDynamoDBClient{}

		// mockDynamoDB.BatchWriteItemWithContext()
		output, err := Create(
			ctx,
			&test.event,
			mockDynamoDB,
			currentTime,
		)
		fmt.Printf("%#v", output)
		if test.throws {
			assert.NotNil(err)
		} else {
			assert.Nil(err)

			fmt.Println(output)
			fieldsToMatch := len(test.output.response)
			fieldsMatch := 0

			for key, value := range test.output.response {
				for outputKey, outputValue := range output {
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
}
