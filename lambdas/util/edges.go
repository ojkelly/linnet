package util

import "github.com/ojkelly/linnet/lambdas/util/types"

// GetEdgesOnType for a namedType, given an array of Edges
func GetEdgesOnType(
	namedType string,
	edgeTypes []types.Edge,
) (
	edges []types.Edge,
) {
	for _, edge := range edgeTypes {
		if edge.TypeName == namedType {
			edges = append(edges, edge)
		}
	}

	return
}

// GetEdgeFromEdgeTypes for a fieldName
func GetEdgeFromEdgeTypes(
	fieldName string,
	edgeTypes []types.Edge,
) (
	found bool,
	edge types.Edge,
) {
	for _, edge := range edgeTypes {
		if edge.Field == fieldName {
			return true, edge
		}
	}

	return
}
