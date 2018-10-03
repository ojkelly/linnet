package item

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util"
	"github.com/ojkelly/linnet/lambdas/util/types"
	uuid "github.com/satori/go.uuid"
)

// Generate a single Node
// and recurse on itself, if there are nested creates
func createItems(
	ctx context.Context,
	linnetFields []string,
	dataSource types.DataSourceDynamoDBConfig,
	namedType string,
	edgeTypes []types.Edge,
	rootNodeID string,
	parentNodeID string,
	createdAt time.Time,
	updatedAt time.Time,
	createdBy string,
	createInput map[string]interface{},
) (
	items []types.Node,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "createItems")
	defer segment.Close(err)

	// First get any and all Edges on this namedType
	edgesOnType := util.GetEdgesOnType(
		namedType,
		edgeTypes,
	)

	// Check createInput is not nil
	if createInput == nil {
		return
	}

	// Next check if there is any data on our input
	if createInput["data"] != nil {
		nodesToCreate := util.ExtractDataFromInput(createInput)

		// Now create a new DynamoDB Write object for each node
		for _, createNode := range nodesToCreate {
			var nodeID string

			nodeID = uuid.NewV4().String()

			if rootNodeID != "" {
				nodeID = rootNodeID
			}

			// Create the base of the node
			node := map[string]interface{}{
				"id":               nodeID,
				"linnet:dataType":  "Node",
				"linnet:namedType": namedType,
				"createdAt":        createdAt,
				"updatedAt":        updatedAt,
				"createdBy":        createdBy,
			}

			// Now iterate over the values from the user
			for fieldName, fieldValue := range createNode {
				field := createNode[fieldName]

				// Check if this is an edge
				foundEdge, edge := util.GetEdgeFromEdgeTypes(
					fieldName,
					edgesOnType,
				)

				if foundEdge == false { // If this is not an edge, add the field to our new Node
					node[fieldName] = field
				} else { // This field IS an edge
					var nestedItems []types.Node

					// Create any and all nested Nodes, by recursing the current function
					nestedItems, err = createItems(
						ctx,
						linnetFields,
						dataSource,
						edge.FieldType,
						edgeTypes,
						"",
						nodeID,
						createdAt,
						updatedAt,
						createdBy,
						fieldValue.(map[string]interface{}),
					)

					// Now process all the edges
					for _, nestedItem := range nestedItems {
						if nestedItem["linnet:dataType"] == "Node" &&
							nestedItem["linnet:namedType"] == edge.FieldType {
							var itemEdge types.Node
							itemEdge = make(types.Node)

							if nestedItem["id"] != nil {
								// Create an Edge

								// "linnet:dataType" is a sort key, that exists to create
								// a unique record
								if edge.Principal == "TRUE" {
									itemEdge["id"] = nodeID
									itemEdge["linnet:dataType"] = fmt.Sprintf(
										"%s::%s",
										edge.EdgeName,
										nestedItem["id"],
									)
									itemEdge["linnet:namedType"] = edge.FieldType
									itemEdge["linnet:edge"] = nestedItem["id"]
									itemEdge["createdAt"] = createdAt
									itemEdge["updatedAt"] = updatedAt
									itemEdge["createdBy"] = createdBy

								} else {
									itemEdge["id"] = nestedItem["id"]
									itemEdge["linnet:dataType"] = fmt.Sprintf(
										"%s::%s",
										edge.EdgeName,
										nodeID,
									)
									itemEdge["linnet:namedType"] = edge.Counterpart.TypeName
									itemEdge["linnet:edge"] = nodeID
									itemEdge["createdAt"] = createdAt
									itemEdge["updatedAt"] = updatedAt
									itemEdge["createdBy"] = createdBy

								}
							}
							// Add the edge to our items
							items = append(items, itemEdge)
						}
						// Add the new nestedItem to our items
						items = append(items, nestedItem)
					}
				}

			}

			// Add the node to our return items
			items = append(items, node)
		}
	}

	// Check for any connections
	if createInput["connections"] != nil {
		// TODO: add connections (create a connection from the id, but dont create a node)
	}

	return
}
