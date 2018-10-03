package util_test

import (
	"fmt"
	"testing"

	"github.com/ojkelly/linnet/lambdas/util"
	"github.com/ojkelly/linnet/lambdas/util/types"
	"github.com/stretchr/testify/assert"
)

func TestGetEdgesOnType(t *testing.T) {
	type Input struct {
		NamedType string
		EdgeTypes []types.Edge
	}

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
		}, types.Edge{
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
		}, types.Edge{
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
		}, types.Edge{
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
		input  Input
		output []types.Edge
	}{
		{
			input: Input{
				NamedType: "Customer",
				EdgeTypes: edgeTypes,
			},
			output: []types.Edge{
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
		},
		{
			input: Input{
				NamedType: "Order",
				EdgeTypes: edgeTypes,
			},
			output: []types.Edge{
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
						TypeName: "Product", Field: "orders",
					},
				},
			},
		},
		{
			input: Input{
				NamedType: "Product",
				EdgeTypes: edgeTypes,
			},
			output: []types.Edge{
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
		},
		{
			input: Input{
				NamedType: "",
				EdgeTypes: edgeTypes,
			},
			output: []types.Edge(nil),
		},
		{
			input: Input{
				NamedType: "Post",
				EdgeTypes: edgeTypes,
			},
			output: []types.Edge(nil),
		},
	}

	for i, test := range tests {
		assert := assert.New(t)

		output := util.GetEdgesOnType(
			test.input.NamedType,
			test.input.EdgeTypes,
		)
		assert.Equal(
			test.output,
			output,
			fmt.Sprintf("Test %d", i),
		)
	}
}
