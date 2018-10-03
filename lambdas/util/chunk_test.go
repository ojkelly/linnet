package util_test

import (
	"fmt"
	"testing"

	"github.com/ojkelly/linnet/lambdas/util"
	"github.com/ojkelly/linnet/lambdas/util/types"
	"github.com/stretchr/testify/assert"
)

func TestChunk(t *testing.T) {
	type Input struct {
		array []types.Node
		chunk int
	}
	tests := []struct {
		input  Input
		output [][]types.Node
	}{
		{
			input: Input{
				array: []types.Node{
					types.Node{
						"id":               "",
						"linnet:dataType":  "ProductsOnOrders::9160bc4b-1f8e-44ec-bd10-0919be6a2bc0",
						"linnet:namedType": "Product",
						"linnet:edge":      "",
					},
					types.Node{
						"linnet:dataType":  "Node",
						"updatedAt":        "currentTime",
						"title":            "Product 1",
						"createdBy":        "linnet",
						"description":      "This is another product",
						"price":            "1",
						"id":               "",
						"linnet:namedType": "Product",
						"createdAt":        "currentTime",
					},
					types.Node{
						"id":               "",
						"linnet:dataType":  "ProductsOnOrders::2a118104-be39-4a4b-af98-fe7e1acdb160",
						"linnet:namedType": "Product",
						"linnet:edge":      "",
					},
					types.Node{
						"createdAt":        "currentTime",
						"updatedAt":        "currentTime",
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
						"updatedAt":        "currentTime",
						"id":               "",
						"linnet:dataType":  "Node",
						"createdAt":        "currentTime",
					},
					types.Node{
						"id":               "",
						"linnet:dataType":  "OrdersOnCustomer::33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
						"linnet:namedType": "Order",
						"linnet:edge":      "",
					},
					types.Node{
						"linnet:namedType": "Order",
						"updatedAt":        "currentTime",
						"createdBy":        "linnet",
						"status":           "COMPLETE",
						"id":               "",
						"linnet:dataType":  "Node",
						"createdAt":        "currentTime",
						"price":            99,
						"paid":             true,
					},
					types.Node{
						"createdBy":        "linnet",
						"suburb":           "w4egrw4g5",
						"postcode":         "sfefsd",
						"id":               "",
						"linnet:namedType": "Customer",
						"updatedAt":        "currentTime",
						"phoneNumber":      "239487y789234",
						"email":            "dsarggsdrf@dsfgfsd.sfd",
						"name":             "customer name",
						"address":          "asdasda",
						"linnet:dataType":  "Node",
						"createdAt":        "currentTime",
					},
				},
				chunk: 2,
			},
			output: [][]types.Node{[]types.Node{types.Node{"id": "",
				"linnet:dataType":  "ProductsOnOrders::9160bc4b-1f8e-44ec-bd10-0919be6a2bc0",
				"linnet:namedType": "Product",
				"linnet:edge":      "",
			}, types.Node{"description": "This is another product",
				"id":               "",
				"linnet:dataType":  "Node",
				"updatedAt":        "currentTime",
				"title":            "Product 1",
				"createdBy":        "linnet",
				"price":            "1",
				"linnet:namedType": "Product",
				"createdAt":        "currentTime",
			},
			},
				[]types.Node{types.Node{"id": "",
					"linnet:dataType":  "ProductsOnOrders::2a118104-be39-4a4b-af98-fe7e1acdb160",
					"linnet:namedType": "Product",
					"linnet:edge":      "",
				}, types.Node{"createdAt": "currentTime",
					"title":            "Product 2",
					"linnet:dataType":  "Node",
					"linnet:namedType": "Product",
					"createdBy":        "linnet",
					"updatedAt":        "currentTime",
					"description":      "This is another product",
					"id":               "",
					"price":            "2",
				},
				},
				[]types.Node{types.Node{"linnet:namedType": "Product",
					"linnet:edge":     "",
					"id":              "",
					"linnet:dataType": "ProductsOnOrders::c013614b-a323-47d3-9d62-4143152e4478",
				}, types.Node{"title": "Product 3",
					"createdBy":        "linnet",
					"description":      "This is another product",
					"id":               "",
					"linnet:dataType":  "Node",
					"price":            "3",
					"linnet:namedType": "Product",
					"updatedAt":        "currentTime",
					"createdAt":        "currentTime",
				},
				},
				[]types.Node{types.Node{"id": "",
					"linnet:dataType":  "OrdersOnCustomer::33d47355-cf1b-4c78-aeb5-13f4d60e63ad",
					"linnet:namedType": "Order",
					"linnet:edge":      "",
				}, types.Node{"status": "COMPLETE",
					"id":    "",
					"price": 99, "paid": true, "linnet:namedType": "Order",
					"updatedAt":       "currentTime",
					"createdBy":       "linnet",
					"linnet:dataType": "Node",
					"createdAt":       "currentTime",
				},
				},
				[]types.Node{types.Node{
					"address":          "asdasda",
					"linnet:dataType":  "Node",
					"createdAt":        "currentTime",
					"postcode":         "sfefsd",
					"id":               "",
					"phoneNumber":      "239487y789234",
					"email":            "dsarggsdrf@dsfgfsd.sfd",
					"name":             "customer name",
					"createdBy":        "linnet",
					"suburb":           "w4egrw4g5",
					"linnet:namedType": "Customer",
					"updatedAt":        "currentTime",
				},
				},
			},
		},
	}

	for i, test := range tests {
		assert := assert.New(t)

		output := util.ChunkNodes(
			test.input.array,
			test.input.chunk,
		)

		assert.Equal(
			test.output,
			output,
			fmt.Sprintf("Test %d", i),
		)
	}
}
