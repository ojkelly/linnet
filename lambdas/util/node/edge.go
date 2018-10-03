package node

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

// CreateEdgeItem -
func CreateEdgeItem(
	ctx context.Context,
	edge types.Edge,
	nodeID string,
	edgeID string,
	createdAt time.Time,
	updatedAt time.Time,
	createdBy string,
) (
	edgeItem types.Node,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "CreateEdgeItem")
	defer segment.Close(nil)

	edgeItem = make(types.Node)

	if edgeID != "" {
		// Create an Edge

		// "linnet:dataType" is a sort key, that exists to create
		// a unique record
		if edge.Principal == "TRUE" {
			edgeItem["id"] = nodeID
			edgeItem["linnet:dataType"] = fmt.Sprintf(
				"%s::%s",
				edge.EdgeName,
				edgeID,
			)
			edgeItem["linnet:namedType"] = edge.FieldType
			edgeItem["linnet:edge"] = edgeID
			edgeItem["createdAt"] = createdAt
			edgeItem["updatedAt"] = updatedAt
			edgeItem["createdBy"] = createdBy

		} else {
			edgeItem["id"] = edgeID
			edgeItem["linnet:dataType"] = fmt.Sprintf(
				"%s::%s",
				edge.EdgeName,
				nodeID,
			)
			edgeItem["linnet:namedType"] = edge.Counterpart.TypeName
			edgeItem["linnet:edge"] = nodeID
			edgeItem["createdAt"] = createdAt
			edgeItem["updatedAt"] = updatedAt
			edgeItem["createdBy"] = createdBy
		}
	}
	return edgeItem
}
