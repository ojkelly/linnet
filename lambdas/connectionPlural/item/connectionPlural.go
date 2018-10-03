package item

import (
	"context"
	"fmt"

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
	data types.Node,
	errors []error,
) {
	var err error
	ctx, segment := xray.BeginSubsegment(ctx, "Get")
	defer segment.Close(err)

	var edges []string
	var nodes []types.Node

	var rootNodeID string
	var sortKey string

	var limit int64
	limit = 10

	var edge types.Edge
	var lastEvaluatedKey string

	// The number of nodes found
	var count string

	var cursor string

	var haveFilter, haveCursor bool

	if event.Context.Arguments.Filter != nil {
		haveFilter = true
	}

	if event.Context.Arguments.Cursor != "" {
		haveCursor = true
		cursor = event.Context.Arguments.Cursor
	}

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

	if event.Context.Arguments.Limit != 0 {
		limit = event.Context.Arguments.Limit
	}

	tableName := event.DataSource.TableName

	fmt.Println("rootNodeID: ", rootNodeID)
	fmt.Println("haveFilter: ", haveFilter)
	fmt.Println("haveCursor: ", haveCursor)
	fmt.Println("sortKey: ", sortKey)
	fmt.Println("limit: ", limit)

	// Are we using a filter?
	// This is more expensive as we need to load all the nodes in order to filter them
	if haveFilter {
		// We default to a limit of 1000 edges, but will page in order to get all edges
		var queryLimit int64
		queryLimit = 1000

		// Query for edges
		edges, _, err = database.QueryForAllEdges(
			ctx,
			dynamo,
			tableName,
			rootNodeID,
			edge,
			queryLimit,
			cursor,
		)
		if err != nil {
			errors = append(errors, err)
		}

		// Hydrate the nodes
		var hydratedNodes []types.Node

		hydratedNodes, err := database.HydrateNodes(
			ctx,
			dynamo,
			tableName,
			edges,
		)
		if err != nil {
			errors = append(errors, err)
		}

		// Sort the nodes
		sortedNodes, err := SortNodes(
			ctx,
			hydratedNodes,
			sortKey,
		)
		if err != nil {
			errors = append(errors, err)
		}

		// Filter the nodes
		nodes, err = FilterNodes(
			ctx,
			event.Context.Arguments.Filter,
			sortedNodes,
		)

		// page to limit

		if err != nil {
			errors = append(errors, err)
		}
	} else { // No filter
		// Query for edges
		edges, lastEvaluatedKey, err = database.QueryForEdges(
			ctx,
			dynamo,
			tableName,
			rootNodeID,
			edge,
			limit,
			cursor,
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
	}

	data = types.Node{
		"edges": nodes,
		"count": count,
	}

	if lastEvaluatedKey == "" {
		data["cursor"] = nil
	} else {
		data["cursor"] = lastEvaluatedKey
	}

	return data, errors
}

// SortNodes -
func SortNodes(
	ctx context.Context,
	nodes []types.Node,
	sortKey string,
) (
	nodesSorted []types.Node,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "SortNodes")
	defer segment.Close(err)
	nodesSorted = nodes
	return nodesSorted, err
}
