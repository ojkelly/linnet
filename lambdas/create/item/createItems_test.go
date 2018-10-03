package item

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/constants"
	"github.com/ojkelly/linnet/lambdas/util/types"
	"github.com/stretchr/testify/assert"
)

func TestCreateItems(t *testing.T) {
	type Input struct {
		linnetFields []string
		dataSource   types.DataSourceDynamoDBConfig
		namedType    string
		edgeTypes    []types.Edge
		rootNodeID   string
		parentNodeID string
		createdAt    time.Time
		updatedAt    time.Time
		createdBy    string
		createInput  map[string]interface{}
	}
	type Output struct {
		items []types.Node
		err   error
	}

	currentTime := time.Unix(1517446800, 10)

	tests := []struct {
		input  Input
		output Output
		throws bool
	}{
		{
			input: Input{
				linnetFields: constants.LinnetFields,
				dataSource: types.DataSourceDynamoDBConfig{
					UseCallerCredentials: false,
					AwsRegion:            "us-east-1",
					TableName:            "DynamoDBTestTable",
				},
				namedType: "Customer",
				edgeTypes: []types.Edge{
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
				},
				rootNodeID:   "",
				parentNodeID: "",
				createdAt:    currentTime,
				updatedAt:    currentTime,
				createdBy:    "linnet",
				createInput: map[string]interface{}{
					"data": map[string]interface{}{
						"email":       "dsarggsdrf@dsfgfsd.sfd",
						"name":        "customer name",
						"address":     "asdasda",
						"suburb":      "w4egrw4g5",
						"postcode":    "sfefsd",
						"phoneNumber": "239487y789234",
					},
				},
			},
			output: Output{
				items: []types.Node{
					types.Node{
						"id":               "",
						"email":            "dsarggsdrf@dsfgfsd.sfd",
						"name":             "customer name",
						"address":          "asdasda",
						"suburb":           "w4egrw4g5",
						"postcode":         "sfefsd",
						"phoneNumber":      "239487y789234",
						"linnet:dataType":  "Node",
						"linnet:namedType": "Customer",
						"createdAt":        currentTime,
						"updatedAt":        currentTime,
						"createdBy":        "linnet",
					},
				},
				err: nil,
			},
			throws: false,
		},

		{
			input: Input{
				linnetFields: constants.LinnetFields,
				dataSource: types.DataSourceDynamoDBConfig{
					UseCallerCredentials: false,
					AwsRegion:            "us-east-1",
					TableName:            "DynamoDBTestTable",
				},
				namedType: "Customer",
				edgeTypes: []types.Edge{
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
				},
				rootNodeID:   "",
				parentNodeID: "",
				createdAt:    currentTime,
				updatedAt:    currentTime,
				createdBy:    "linnet",
				createInput: map[string]interface{}{
					"data": map[string]interface{}{
						"email": "dsarggsdrf@dsfgfsd.sfd",
						"orders": map[string]interface{}{
							"data": []interface{}{
								map[string]interface{}{
									"status": "COMPLETE",
									"products": map[string]interface{}{
										"data": []interface{}{
											map[string]interface{}{
												"title":       "Product 1",
												"description": "This is another product",
												"price":       "1",
											},
											map[string]interface{}{
												"title":       "Product 2",
												"description": "This is another product",
												"price":       "2",
											},
											map[string]interface{}{
												"title":       "Product 3",
												"description": "This is another product",
												"price":       "3",
											},
										},
									},
									"price": 99,
									"paid":  true,
								},
							},
						},
						"name":        "customer name",
						"address":     "asdasda",
						"suburb":      "w4egrw4g5",
						"postcode":    "sfefsd",
						"phoneNumber": "239487y789234",
					},
				},
			},
			output: Output{
				items: []types.Node{
					types.Node{
						"id":               "",
						"linnet:dataType":  "ProductsOnOrders::9160bc4b-1f8e-44ec-bd10-0919be6a2bc0",
						"linnet:namedType": "Product",
						"linnet:edge":      "",
					},
					types.Node{
						"linnet:dataType":  "Node",
						"updatedAt":        currentTime,
						"title":            "Product 1",
						"createdBy":        "linnet",
						"description":      "This is another product",
						"price":            "1",
						"id":               "",
						"linnet:namedType": "Product",
						"createdAt":        currentTime,
					},
					types.Node{
						"id":               "",
						"linnet:dataType":  "ProductsOnOrders::2a118104-be39-4a4b-af98-fe7e1acdb160",
						"linnet:namedType": "Product",
						"linnet:edge":      "",
					},
					types.Node{
						"createdAt":        currentTime,
						"updatedAt":        currentTime,
						"title":            "Product 2",
						"description":      "This is another product",
						"id":               "",
						"linnet:dataType":  "Node",
						"linnet:namedType": "Product",
						"createdBy":        "linnet",
						"price":            "2",
					},
					types.Node{
						"linnet:namedType": "Product",
						"linnet:edge":      "",
						"id":               "",
						"linnet:dataType":  "ProductsOnOrders::c013614b-a323-47d3-9d62-4143152e4478",
					},
					types.Node{
						"price":            "3",
						"title":            "Product 3",
						"linnet:namedType": "Product",
						"createdBy":        "linnet",
						"description":      "This is another product",
						"updatedAt":        currentTime,
						"id":               "",
						"linnet:dataType":  "Node",
						"createdAt":        currentTime,
					},
					types.Node{
						"id":               "",
						"linnet:dataType":  "OrdersOnCustomer::33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"linnet:namedType": "Order",
						"linnet:edge":      "",
					},
					types.Node{
						"linnet:namedType": "Order",
						"updatedAt":        currentTime,
						"createdBy":        "linnet",
						"status":           "COMPLETE",
						"id":               "",
						"linnet:dataType":  "Node",
						"createdAt":        currentTime,
						"price":            99,
						"paid":             true,
					},
					types.Node{
						"createdBy":        "linnet",
						"suburb":           "w4egrw4g5",
						"postcode":         "sfefsd",
						"id":               "",
						"linnet:namedType": "Customer",
						"updatedAt":        currentTime,
						"phoneNumber":      "239487y789234",
						"email":            "dsarggsdrf@dsfgfsd.sfd",
						"name":             "customer name",
						"address":          "asdasda",
						"linnet:dataType":  "Node",
						"createdAt":        currentTime,
					},
				},
				err: nil,
			},
			throws: false,
		},

		{
			input: Input{
				linnetFields: constants.LinnetFields,
				dataSource: types.DataSourceDynamoDBConfig{
					UseCallerCredentials: false,
					AwsRegion:            "us-east-1",
					TableName:            "DynamoDBTestTable",
				},
				namedType: "Customer",
				edgeTypes: []types.Edge{
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
				},
				rootNodeID:   "",
				parentNodeID: "",
				createdAt:    currentTime,
				updatedAt:    currentTime,
				createdBy:    "linnet",
				createInput: map[string]interface{}{
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
				},
			},
			output: Output{
				items: []types.Node{
					types.Node{
						"title":            "Test Product 1",
						"description":      "Test Product 1 Description",
						"price":            "1.00",
						"id":               "",
						"linnet:dataType":  "Node",
						"linnet:namedType": "Customer",
						"createdAt":        currentTime,
						"updatedAt":        currentTime,
						"createdBy":        "linnet",
					},
					types.Node{
						"linnet:namedType": "Customer",
						"createdAt":        currentTime,
						"updatedAt":        currentTime,
						"createdBy":        "linnet",
						"description":      "Test Product 2 Description",
						"price":            "2.00",
						"id":               "",
						"linnet:dataType":  "Node", "title": "Test Product 2",
					},
					types.Node{
						"price":            "3.00",
						"id":               "",
						"createdAt":        currentTime,
						"updatedAt":        currentTime,
						"createdBy":        "linnet",
						"description":      "Test Product 3 Description",
						"title":            "Test Product 3",
						"linnet:dataType":  "Node",
						"linnet:namedType": "Customer",
					},
				},
				err: nil,
			},
			throws: false,
		},
	}

	for i, test := range tests {
		ctx, _ := xray.BeginSegment(context.Background(), "TestCreateItems")

		assert := assert.New(t)

		output, err := createItems(
			ctx,
			test.input.linnetFields,
			test.input.dataSource,
			test.input.namedType,
			test.input.edgeTypes,
			test.input.rootNodeID,
			test.input.parentNodeID,
			test.input.createdAt,
			test.input.updatedAt,
			test.input.createdBy,
			test.input.createInput,
		)

		if test.throws {
			assert.NotNil(err)
		} else {
			assert.Nil(err)

			// We can't do straight deepEquals checks, because of uuid
			outputItemsNeeded := len(test.output.items)
			foundItems := 0

			var seenEdges []string

			for _, outputItem := range output {
				// Check Edge
				// The make up of fields is pretty different, so we need to test these
				// seperately with a different pattern
				if outputItem["linnet:edge"] != nil &&
					outputItem["linnet:dataType"] != "Node" {

					var haveSeenEdge bool
					for _, seenEdge := range seenEdges {
						if seenEdge == outputItem["id"].(string) {
							haveSeenEdge = true
						}
					}
					if haveSeenEdge {
						continue
					}

					// The end of linnet:dataType is generated, so we're just checking against the prefix
					dataType := strings.Split(outputItem["linnet:dataType"].(string), "::")
					dataTypePrefix := dataType[0]

					for _, testItem := range test.output.items {
						if testItem["linnet:edge"] != nil &&
							strings.HasPrefix(testItem["linnet:dataType"].(string), dataTypePrefix) &&
							testItem["linnet:namedType"] == outputItem["linnet:namedType"] {
							seenEdges = append(seenEdges, outputItem["id"].(string))
							foundItems = foundItems + 1

						}
					}
				} else {
					// Check each Node
					for _, testItem := range test.output.items {
						// Again we're going to see how many fields we expect, then
						// compare each one from our output to our expected
						// tally the results, and pass if they match
						fieldsToMatch := len(testItem) - 1
						fieldsMatch := 0

						for testItemKey := range testItem {
							if testItemKey != "id" && // id is generated so we can't compare it
								testItem[testItemKey] == outputItem[testItemKey] {
								fieldsMatch = fieldsMatch + 1
							}
						}
						if fieldsMatch == fieldsToMatch {
							foundItems = foundItems + 1
						}
					}

				}

			}

			assert.Equal(
				foundItems,
				outputItemsNeeded,
				fmt.Sprintf("Test %d", i),
			)
		}
	}
}
