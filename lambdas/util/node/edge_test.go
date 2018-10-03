package node_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/node"
	"github.com/ojkelly/linnet/lambdas/util/types"
	"github.com/stretchr/testify/assert"
)

func TestCreateItems(t *testing.T) {
	type Input struct {
		edge      types.Edge
		nodeID    string
		edgeID    string
		createdAt time.Time
		updatedAt time.Time
		createdBy string
	}

	currentTime := time.Unix(1517446800, 10)

	tests := []struct {
		input  Input
		output types.Node
		throws bool
	}{
		{
			input: Input{
				edge: types.Edge{
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
				nodeID:    "00c90271-b30b-4d7a-a7c4-5ecdee461de2",
				edgeID:    "013d2882-f2c1-45fe-97ae-fde27e658b87",
				createdAt: currentTime,
				updatedAt: currentTime,
				createdBy: "testing",
			},
			output: types.Node{
				"id":               "00c90271-b30b-4d7a-a7c4-5ecdee461de2",
				"linnet:dataType":  "OrdersOnCustomer::013d2882-f2c1-45fe-97ae-fde27e658b87",
				"linnet:namedType": "Order",
				"linnet:edge":      "013d2882-f2c1-45fe-97ae-fde27e658b87",
				"createdAt":        currentTime,
				"updatedAt":        currentTime,
				"createdBy":        "testing",
			},
		},
		{
			input: Input{
				edge: types.Edge{
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
				nodeID:    "00c90271-b30b-4d7a-a7c4-5ecdee461de2",
				edgeID:    "013d2882-f2c1-45fe-97ae-fde27e658b87",
				createdAt: currentTime,
				updatedAt: currentTime,
				createdBy: "testing",
			},
			output: types.Node{
				"updatedAt":        currentTime,
				"createdBy":        "testing",
				"id":               "013d2882-f2c1-45fe-97ae-fde27e658b87",
				"linnet:dataType":  "OrdersOnCustomer::00c90271-b30b-4d7a-a7c4-5ecdee461de2",
				"linnet:namedType": "Customer",
				"linnet:edge":      "00c90271-b30b-4d7a-a7c4-5ecdee461de2",
				"createdAt":        currentTime,
			},
		},
	}
	for i, test := range tests {
		ctx, _ := xray.BeginSegment(context.Background(), "TestCreateItems")

		assert := assert.New(t)
		output := node.CreateEdgeItem(
			ctx,
			test.input.edge,
			test.input.nodeID,
			test.input.edgeID,
			test.input.createdAt,
			test.input.updatedAt,
			test.input.createdBy,
		)
		assert.Equal(
			test.output,
			output,
			fmt.Sprintf("Test %d", i),
		)
	}
}
