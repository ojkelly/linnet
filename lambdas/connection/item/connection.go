package item

import (
	"context"

	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/database"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

// Get a connectionPlural Node
func Get(
	ctx context.Context,
	event *types.ConnectionPluralLambdaEvent,
	dynamo dynamodbiface.DynamoDBAPI,
) (
	rootNode types.Node,
	errors []error,
) {
	var err error
	ctx, segment := xray.BeginSubsegment(ctx, "Get")
	defer segment.Close(err)

	var edges []string
	var nodes []types.Node

	var rootNodeID string

	var limit int64
	limit = 1

	var edge types.Edge

	if event.EdgeTypes != nil && len(event.EdgeTypes) >= 1 {
		edge = event.EdgeTypes[0]
	} else {
		// PANIC
		return
	}

	// Get the rootNodeID
	if event.Context.Source["id"] != nil &&
		event.Context.Source["id"].(string) != "" {
		rootNodeID = event.Context.Source["id"].(string)
	} else if event.Context.Arguments.Where.ID != "" {
		rootNodeID = event.Context.Arguments.Where.ID
	} else {
		// PANIC
		return
	}

	tableName := event.DataSource.TableName

	// Query for edges
	edges, _, err = database.QueryForEdges(
		ctx,
		dynamo,
		tableName,
		rootNodeID,
		edge,
		limit,
		"",
	)
	if err != nil {
		errors = append(errors, err)
	}

	// hydrate
	nodes, err = database.HydrateNodes(
		ctx,
		dynamo,
		tableName,
		edges,
	)
	if err != nil {
		errors = append(errors, err)
	}

	if len(nodes) == 1 {
		rootNode = nodes[0]
	}

	return rootNode, errors
}
