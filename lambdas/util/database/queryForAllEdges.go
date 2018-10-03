package database

import (
	"context"

	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

// QueryForAllEdges will recursively query for edges, until we have them all
func QueryForAllEdges(
	ctx context.Context,
	dynamo dynamodbiface.DynamoDBAPI,
	tableName,
	id string,
	edge types.Edge,
	limit int64,
	cursor string,
) (
	edges []string,
	lastEvaluatedKey string, // this may be used as the cursor next time
	err error,
) {
	var newEdges []string

	// Try query for edges
	newEdges, lastEvaluatedKey, err = QueryForEdges(
		ctx,
		dynamo,
		tableName,
		id,
		edge,
		limit,
		cursor,
	)
	if len(newEdges) > 0 {
		edges = append(edges, newEdges...)
	}

	// We have a new cursor, so recurse again
	if lastEvaluatedKey != "" {
		edges, lastEvaluatedKey, err = QueryForAllEdges(
			ctx,
			dynamo,
			tableName,
			id,
			edge,
			limit,
			cursor,
		)
		if len(newEdges) > 0 {
			edges = append(edges, newEdges...)
		}
	}

	return edges, lastEvaluatedKey, err
}
