package database

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/types"
	"github.com/stretchr/testify/assert"
)

func TestMarshallItemsToWriteRequests(t *testing.T) {
	type Input struct {
		items []types.Node
	}
	type Output struct {
		requests [][]*dynamodb.WriteRequest
		err      error
	}

	currentTime := time.Unix(1517446800, 10)

	tests := []struct {
		input  Input
		output Output
		throws bool
	}{
		{
			input: Input{
				items: []types.Node{
					types.Node{
						"id":               "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"linnet:dataType":  "ProductsOnOrders::9160bc4b-1f8e-44ec-bd10-0919be6a2bc0",
						"linnet:namedType": "Product",
						"linnet:edge":      "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
					},
					types.Node{
						"linnet:dataType":  "Node",
						"updatedAt":        currentTime,
						"title":            "Product 1",
						"createdBy":        "linnet",
						"description":      "This is another product",
						"price":            "1",
						"id":               "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"linnet:namedType": "Product",
						"createdAt":        currentTime,
					},
					types.Node{
						"id":               "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"linnet:dataType":  "ProductsOnOrders::2a118104-be39-4a4b-af98-fe7e1acdb160",
						"linnet:namedType": "Product",
						"linnet:edge":      "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
					},
					types.Node{
						"createdAt":        currentTime,
						"updatedAt":        currentTime,
						"title":            "Product 2",
						"description":      "This is another product",
						"id":               "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"linnet:dataType":  "Node",
						"linnet:namedType": "Product",
						"createdBy":        "linnet",
						"price":            "2",
					},
					types.Node{
						"linnet:namedType": "Product",
						"linnet:edge":      "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"id":               "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"linnet:dataType":  "ProductsOnOrders::c013614b-a323-47d3-9d62-4143152e4478",
					},
					types.Node{
						"price":            "3",
						"title":            "Product 3",
						"linnet:namedType": "Product",
						"createdBy":        "linnet",
						"description":      "This is another product",
						"updatedAt":        currentTime,
						"id":               "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"linnet:dataType":  "Node",
						"createdAt":        currentTime,
					},
					types.Node{
						"id":               "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"linnet:dataType":  "OrdersOnCustomer::33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"linnet:namedType": "Order",
						"linnet:edge":      "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
					},
					types.Node{
						"linnet:namedType": "Order",
						"updatedAt":        currentTime,
						"createdBy":        "linnet",
						"status":           "COMPLETE",
						"id":               "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"linnet:dataType":  "Node",
						"createdAt":        currentTime,
						"price":            99,
						"paid":             true,
					},
					types.Node{
						"createdBy":        "linnet",
						"suburb":           "w4egrw4g5",
						"postcode":         "sfefsd",
						"id":               "33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
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
			},
			throws: false,
			output: Output{
				requests: [][]*dynamodb.WriteRequest{
					[]*dynamodb.WriteRequest{{
						PutRequest: &dynamodb.PutRequest{
							Item: map[string]*dynamodb.AttributeValue{
								"linnet:edge": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
								"id": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
								"linnet:dataType": &dynamodb.AttributeValue{
									S: aws.String("ProductsOnOrders::9160bc4b-1f8e-44ec-bd10-0919be6a2bc0"),
								},
								"linnet:namedType": &dynamodb.AttributeValue{
									S: aws.String("Product"),
								},
							},
						},
					}, {
						PutRequest: &dynamodb.PutRequest{
							Item: map[string]*dynamodb.AttributeValue{
								"price": &dynamodb.AttributeValue{
									S: aws.String("1"),
								},
								"id": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
								"title": &dynamodb.AttributeValue{
									S: aws.String("Product 1"),
								},
								"linnet:dataType": &dynamodb.AttributeValue{
									S: aws.String("Node"),
								},
								"description": &dynamodb.AttributeValue{
									S: aws.String("This is another product"),
								},
								"createdBy": &dynamodb.AttributeValue{
									S: aws.String("linnet"),
								},
								"updatedAt": &dynamodb.AttributeValue{
									S: aws.String("2018-02-01T12:00:00.00000001+11:00"),
								},
								"linnet:namedType": &dynamodb.AttributeValue{
									S: aws.String("Product"),
								},
								"createdAt": &dynamodb.AttributeValue{
									S: aws.String("2018-02-01T12:00:00.00000001+11:00"),
								},
							},
						},
					}, {
						PutRequest: &dynamodb.PutRequest{
							Item: map[string]*dynamodb.AttributeValue{
								"id": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
								"linnet:dataType": &dynamodb.AttributeValue{
									S: aws.String("ProductsOnOrders::2a118104-be39-4a4b-af98-fe7e1acdb160"),
								},
								"linnet:namedType": &dynamodb.AttributeValue{
									S: aws.String("Product"),
								},
								"linnet:edge": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
							},
						},
					}, {
						PutRequest: &dynamodb.PutRequest{
							Item: map[string]*dynamodb.AttributeValue{
								"linnet:namedType": &dynamodb.AttributeValue{
									S: aws.String("Product"),
								},
								"description": &dynamodb.AttributeValue{
									S: aws.String("This is another product"),
								},
								"id": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
								"price": &dynamodb.AttributeValue{
									S: aws.String("2"),
								},
								"updatedAt": &dynamodb.AttributeValue{
									S: aws.String("2018-02-01T12:00:00.00000001+11:00"),
								},
								"linnet:dataType": &dynamodb.AttributeValue{
									S: aws.String("Node"),
								},
								"title": &dynamodb.AttributeValue{
									S: aws.String("Product 2"),
								},
								"createdAt": &dynamodb.AttributeValue{
									S: aws.String("2018-02-01T12:00:00.00000001+11:00"),
								},
								"createdBy": &dynamodb.AttributeValue{
									S: aws.String("linnet"),
								},
							},
						},
					}, {
						PutRequest: &dynamodb.PutRequest{
							Item: map[string]*dynamodb.AttributeValue{
								"linnet:namedType": &dynamodb.AttributeValue{
									S: aws.String("Product"),
								},
								"linnet:edge": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
								"id": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
								"linnet:dataType": &dynamodb.AttributeValue{
									S: aws.String("ProductsOnOrders::c013614b-a323-47d3-9d62-4143152e4478"),
								},
							},
						},
					}, {
						PutRequest: &dynamodb.PutRequest{
							Item: map[string]*dynamodb.AttributeValue{
								"createdBy": &dynamodb.AttributeValue{
									S: aws.String("linnet"),
								},
								"linnet:dataType": &dynamodb.AttributeValue{
									S: aws.String("Node"),
								},
								"createdAt": &dynamodb.AttributeValue{
									S: aws.String("2018-02-01T12:00:00.00000001+11:00"),
								},
								"updatedAt": &dynamodb.AttributeValue{
									S: aws.String("2018-02-01T12:00:00.00000001+11:00"),
								},
								"price": &dynamodb.AttributeValue{
									S: aws.String("3"),
								},
								"title": &dynamodb.AttributeValue{
									S: aws.String("Product 3"),
								},
								"linnet:namedType": &dynamodb.AttributeValue{
									S: aws.String("Product"),
								},
								"id": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
								"description": &dynamodb.AttributeValue{
									S: aws.String("This is another product"),
								},
							},
						},
					}, {
						PutRequest: &dynamodb.PutRequest{
							Item: map[string]*dynamodb.AttributeValue{
								"linnet:dataType": &dynamodb.AttributeValue{
									S: aws.String("OrdersOnCustomer::33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
								"linnet:namedType": &dynamodb.AttributeValue{
									S: aws.String("Order"),
								},
								"linnet:edge": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
								"id": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
							},
						},
					}, {
						PutRequest: &dynamodb.PutRequest{
							Item: map[string]*dynamodb.AttributeValue{
								"status": &dynamodb.AttributeValue{
									S: aws.String("COMPLETE"),
								},
								"linnet:dataType": &dynamodb.AttributeValue{
									S: aws.String("Node"),
								},
								"createdAt": &dynamodb.AttributeValue{
									S: aws.String("2018-02-01T12:00:00.00000001+11:00"),
								},
								"updatedAt": &dynamodb.AttributeValue{
									S: aws.String("2018-02-01T12:00:00.00000001+11:00"),
								},
								"createdBy": &dynamodb.AttributeValue{
									S: aws.String("linnet"),
								},
								"price": &dynamodb.AttributeValue{
									N: aws.String("99"),
								},
								"paid": &dynamodb.AttributeValue{
									BOOL: aws.Bool(true),
								},
								"linnet:namedType": &dynamodb.AttributeValue{
									S: aws.String("Order"),
								},
								"id": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
							},
						},
					}, {
						PutRequest: &dynamodb.PutRequest{
							Item: map[string]*dynamodb.AttributeValue{
								"postcode": &dynamodb.AttributeValue{
									S: aws.String("sfefsd"),
								},
								"id": &dynamodb.AttributeValue{
									S: aws.String("33d47355-cf1b-4c78-aeb5-13f4d60e63ad"),
								},
								"createdBy": &dynamodb.AttributeValue{
									S: aws.String("linnet"),
								},
								"phoneNumber": &dynamodb.AttributeValue{
									S: aws.String("239487y789234"),
								},
								"email": &dynamodb.AttributeValue{
									S: aws.String("dsarggsdrf@dsfgfsd.sfd"),
								},
								"name": &dynamodb.AttributeValue{
									S: aws.String("customer name"),
								},
								"address": &dynamodb.AttributeValue{
									S: aws.String("asdasda"),
								},
								"linnet:dataType": &dynamodb.AttributeValue{
									S: aws.String("Node"),
								},
								"updatedAt": &dynamodb.AttributeValue{
									S: aws.String("2018-02-01T12:00:00.00000001+11:00"),
								},
								"createdAt": &dynamodb.AttributeValue{
									S: aws.String("2018-02-01T12:00:00.00000001+11:00"),
								},
								"suburb": &dynamodb.AttributeValue{
									S: aws.String("w4egrw4g5"),
								},
								"linnet:namedType": &dynamodb.AttributeValue{
									S: aws.String("Customer"),
								},
							},
						},
					},
					},
				},
				err: nil,
			},
		},
	}

	for i, test := range tests {
		ctx, _ := xray.BeginSegment(context.Background(), "Test")

		assert := assert.New(t)
		output, err := MarshallItemsToWriteRequests(
			ctx,
			test.input.items,
		)
		fmt.Printf("%#v", output)

		if test.throws {
			assert.NotNil(err)
		} else {
			assert.Nil(err)

			assert.Equal(
				test.output.requests,
				output,
				fmt.Sprintf("Test %d", i),
			)
		}
	}
}
