package util_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util"
	"github.com/ojkelly/linnet/lambdas/util/constants"
	"github.com/ojkelly/linnet/lambdas/util/types"
	"github.com/stretchr/testify/assert"
)

func TestCleanRootNode(t *testing.T) {
	type Input struct {
		rootNodeID string
		event      types.LambdaEvent
		items      []types.Node
	}

	currentTime := time.Unix(1517446800, 10)

	edgeTypes := []types.Edge{
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
		types.Edge{
			TypeName:    "Order",
			Field:       "customer",
			FieldType:   "Customer",
			EdgeName:    "OrdersOnCustomer",
			Required:    true,
			Cardinality: "ONE",
			Principal:   "FALSE",
			Counterpart: types.EdgeCounterpart{
				TypeName: "Customer",
				Field:    "orders",
			},
		},
		types.Edge{
			TypeName:    "Order",
			Field:       "products",
			FieldType:   "Product",
			EdgeName:    "ProductsOnOrders",
			Required:    true,
			Cardinality: "MANY",
			Principal:   "TRUE",
			Counterpart: types.EdgeCounterpart{
				TypeName: "Product",
				Field:    "orders",
			},
		},
		types.Edge{
			TypeName:    "Product",
			Field:       "orders",
			FieldType:   "Order",
			EdgeName:    "ProductsOnOrders",
			Required:    false,
			Cardinality: "MANY",
			Principal:   "FALSE",
			Counterpart: types.EdgeCounterpart{
				TypeName: "Order",
				Field:    "products",
			},
		},
	}

	tests := []struct {
		input  Input
		output types.Node
	}{
		{
			input: Input{
				rootNodeID: "43a67e91-c1b8-4da3-bc32-51e763bb5596",
				event: types.LambdaEvent{
					LinnetFields: constants.LinnetFields,
					DataSource: types.DataSourceDynamoDBConfig{
						UseCallerCredentials: false,
						AwsRegion:            "us-east-1",
						TableName:            "DynamoDBTestTable",
					},
					NamedType: "Customer",
					EdgeTypes: edgeTypes,
					Context:   types.LinnetResolverContext{},
				},
				items: []types.Node{
					types.Node{
						"id":               "bd9fc4c8-8209-4e68-9713-78e0c18c5df8",
						"linnet:dataType":  "ProductsOnOrders::c82c8ee5-5457-4f6b-a516-390662230bb0",
						"linnet:namedType": "Product",
						"linnet:edge":      "c82c8ee5-5457-4f6b-a516-390662230bb0",
					},
					types.Node{
						"createdAt":        currentTime,
						"updatedAt":        currentTime,
						"title":            "Product 1",
						"price":            "1",
						"id":               "c82c8ee5-5457-4f6b-a516-390662230bb0",
						"linnet:dataType":  "Node",
						"linnet:namedType": "Product",
						"createdBy":        "linnet",
						"description":      "This is another product",
					},
					types.Node{
						"linnet:namedType": "Product",
						"linnet:edge":      "a7e2371d-69a4-4c28-b5a2-a4ac72ce2c26",
						"id":               "bd9fc4c8-8209-4e68-9713-78e0c18c5df8",
						"linnet:dataType":  "ProductsOnOrders::a7e2371d-69a4-4c28-b5a2-a4ac72ce2c26",
					},
					types.Node{
						"updatedAt":        currentTime,
						"createdBy":        "linnet",
						"description":      "This is another product",
						"linnet:dataType":  "Node",
						"createdAt":        currentTime,
						"title":            "Product 2",
						"price":            "2",
						"id":               "a7e2371d-69a4-4c28-b5a2-a4ac72ce2c26",
						"linnet:namedType": "Product",
					},
					types.Node{
						"linnet:dataType":  "ProductsOnOrders::960612f4-1f2f-4b86-9c85-4a211c0ca203",
						"linnet:namedType": "Product",
						"linnet:edge":      "960612f4-1f2f-4b86-9c85-4a211c0ca203",
						"id":               "bd9fc4c8-8209-4e68-9713-78e0c18c5df8",
					},
					types.Node{
						"linnet:dataType":  "Node",
						"linnet:namedType": "Product",
						"createdAt":        currentTime,
						"title":            "Product 3",
						"description":      "This is another product",
						"id":               "960612f4-1f2f-4b86-9c85-4a211c0ca203",
						"updatedAt":        currentTime,
						"createdBy":        "linnet",
						"price":            "3",
					},
					types.Node{
						"linnet:edge":      "bd9fc4c8-8209-4e68-9713-78e0c18c5df8",
						"id":               "43a67e91-c1b8-4da3-bc32-51e763bb5596",
						"linnet:dataType":  "OrdersOnCustomer::bd9fc4c8-8209-4e68-9713-78e0c18c5df8",
						"linnet:namedType": "Order",
					},
					types.Node{
						"linnet:dataType":  "Node",
						"createdAt":        currentTime,
						"status":           "COMPLETE",
						"price":            99,
						"id":               "bd9fc4c8-8209-4e68-9713-78e0c18c5df8",
						"linnet:namedType": "Order",
						"updatedAt":        currentTime,
						"createdBy":        "linnet",
						"paid":             true,
					},
					types.Node{
						"suburb":           "w4egrw4g5",
						"postcode":         "sfefsd",
						"linnet:dataType":  "Node",
						"linnet:namedType": "Customer",
						"email":            "dsarggsdrf@dsfgfsd.sfd",
						"address":          "asdasda",
						"phoneNumber":      "239487y789234",
						"name":             "customer name",
						"id":               "43a67e91-c1b8-4da3-bc32-51e763bb5596",
						"createdAt":        currentTime,
						"updatedAt":        currentTime,
						"createdBy":        "linnet",
					},
				},
			},
			output: types.Node{
				"updatedAt":        currentTime,
				"suburb":           "w4egrw4g5",
				"phoneNumber":      "239487y789234",
				"createdAt":        currentTime,
				"address":          "asdasda",
				"email":            "dsarggsdrf@dsfgfsd.sfd",
				"id":               "43a67e91-c1b8-4da3-bc32-51e763bb5596",
				"name":             "customer name",
				"postcode":         "sfefsd",
				"linnet:dataType":  "Node",
				"createdBy":        "linnet",
				"linnet:namedType": "Customer",
				"orders": map[string][]types.Node{
					"items": []types.Node{
						types.Node{
							"id":       "bd9fc4c8-8209-4e68-9713-78e0c18c5df8",
							"parentId": "43a67e91-c1b8-4da3-bc32-51e763bb5596",
							"edgeName": "OrdersOnCustomer",
						},
					},
				},
			},
		},
	}

	for i, test := range tests {
		ctx, _ := xray.BeginSegment(context.Background(), "Test")
		assert := assert.New(t)

		output := util.CleanRootNode(
			ctx,
			test.input.rootNodeID,
			test.input.event.EdgeTypes,
			test.input.event.LinnetFields,
			test.input.items,
		)
		assert.Equal(
			test.output,
			output,
			fmt.Sprintf("Test %d", i),
		)
	}
}
