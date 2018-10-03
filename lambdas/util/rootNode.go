package util

import (
	"context"
	"strings"

	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/constants"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

// CleanRootNode -
func CleanRootNode(
	ctx context.Context,
	rootNodeID string,
	edgeTypes []types.Edge,
	linnetFields []string,
	items []types.Node,
) (
	rootNode types.Node,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "CleanRootNode")
	defer segment.Close(nil)

	rootNode = ReduceEdgeFields(
		rootNodeID,
		edgeTypes,
		items,
		StripLinnetFields(
			findRootNode(rootNodeID, items),
		),
	)

	return
}

func findRootNode(rootNodeID string, nodes []types.Node) types.Node {
	for _, node := range nodes {
		if node != nil &&
			node["id"] == rootNodeID &&
			node["linnet:dataType"] == "Node" {
			return node
		}
	}
	return nil
}

// StripLinnetFields from a Node
func StripLinnetFields(
	rawNode types.Node,
) (
	node types.Node,
) {
	node = make(types.Node)
	for key, value := range rawNode {
		for _, linnetField := range constants.LinnetFields {
			if key != linnetField {
				node[key] = value
			}
		}
	}

	return
}

// ReduceEdgeFields from a Node
func ReduceEdgeFields(
	rootNodeID string,
	edgeTypes []types.Edge,
	nodes []types.Node,
	rootNode types.Node,
) types.Node {
	// First, find the edges that are on the root node
	for _, edge := range edgeTypes {
		if edge.TypeName == rootNode["linnet:namedType"] {
			// We need a var to collect our edge items
			var edgeItems []types.Node

			// Now iterate through our nodes to find the edges
			for _, node := range nodes {
				if node["linnet:edge"] != nil &&
					strings.HasPrefix(
						node["linnet:dataType"].(string),
						edge.EdgeName,
					) &&
					node["id"] != nil {

					// The nodeID will come from a different field,
					// depending on if this is the principal side
					// of the edge
					var nodeID string

					if edge.Principal == "TRUE" {
						nodeID = node["linnet:edge"].(string)
					} else if edge.Principal == "FALSE" {
						nodeID = node["id"].(string)
					}

					// Construct our edge item, and save it
					edgeItems = append(edgeItems, types.Node{
						"id":       nodeID,
						"parentId": rootNodeID,
						"edgeName": edge.EdgeName,
					},
					)
				}
			}
			rootNode[edge.Field] = map[string][]types.Node{
				"items": edgeItems,
			}
		}
	}

	return rootNode
}
