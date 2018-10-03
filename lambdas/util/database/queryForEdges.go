package database

import (
	"context"
	"encoding/base64"
	"encoding/json"

	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

// QueryForEdges from a rootNodeID and Edge
func QueryForEdges(
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
	ctx, segment := xray.BeginSubsegment(ctx, "QueryForEdges")
	defer segment.Close(err)

	var partitionKeyName string
	var edgeKeyName string
	var index *string

	if edge.Principal == "TRUE" {
		partitionKeyName = "id"
		edgeKeyName = "linnet:edge"
	} else if edge.Principal == "FALSE" { // TODO: test this case
		partitionKeyName = "linnet:edge"
		edgeKeyName = "id"
		index = aws.String("edge-dataType")
	}

	// TODO: handle pages
	queryInput := dynamodb.QueryInput{
		TableName: aws.String(tableName),
		IndexName: index,
		Limit:     aws.Int64(limit),
		ExpressionAttributeNames: map[string]*string{
			"#partitionKeyName": aws.String(partitionKeyName),
			"#sortKeyName":      aws.String("linnet:dataType"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":partitionKeyValue": &dynamodb.AttributeValue{
				S: aws.String(id),
			},
			":sortKeyValue": &dynamodb.AttributeValue{
				S: aws.String(edge.EdgeName),
			},
		},
		KeyConditionExpression: aws.String(
			"#partitionKeyName = :partitionKeyValue AND begins_with(#sortKeyName, :sortKeyValue)",
		),
	}

	// If we have a cursor decode it, and use it as the start key
	var exclusiveStartKey map[string]string
	if cursor != "" {
		cursorString, err := base64.StdEncoding.DecodeString(cursor)
		if err != nil {
			return edges, lastEvaluatedKey, err
		}

		err = json.Unmarshal(cursorString, &exclusiveStartKey)
		if err != nil {
			return edges, lastEvaluatedKey, err
		}

		exclusiveStartKeyMap, err := dynamodbattribute.MarshalMap(exclusiveStartKey)
		if err != nil {
			return edges, lastEvaluatedKey, err
		}

		queryInput.ExclusiveStartKey = exclusiveStartKeyMap
	}

	// Query for edges
	queryResult, err := dynamo.QueryWithContext(
		ctx,
		&queryInput,
	)

	var scannedCount int64
	if queryResult.ScannedCount != nil {
		scannedCount = *queryResult.ScannedCount
	}

	edgeItems := make([]map[string]string, scannedCount)
	err = dynamodbattribute.UnmarshalListOfMaps(queryResult.Items, &edgeItems)
	if err != nil {
		return edges, lastEvaluatedKey, err
	}

	for _, edgeItem := range edgeItems {
		if edgeItem[edgeKeyName] != "" {
			edges = append(edges, edgeItem[edgeKeyName])
		}
	}

	edges = unique(edges)

	// Check for a new cursor
	lastEvaluatedKeyMap := make(map[string]string)

	err = dynamodbattribute.UnmarshalMap(queryResult.LastEvaluatedKey, &lastEvaluatedKeyMap)
	if err != nil {
		return edges, lastEvaluatedKey, err
	}
	if lastEvaluatedKeyMap["id"] != "" {

		lastEvaluatedKeyMapJSON, err := json.Marshal(lastEvaluatedKeyMap)
		if err != nil {
			return edges, lastEvaluatedKey, err
		}

		lastEvaluatedKey = string(base64.StdEncoding.EncodeToString([]byte(lastEvaluatedKeyMapJSON)))
	}
	return edges, lastEvaluatedKey, err
}

func unique(stringSlice []string) []string {
	keys := make(map[string]bool)
	list := []string{}
	for _, entry := range stringSlice {
		if _, value := keys[entry]; !value {
			keys[entry] = true
			list = append(list, entry)
		}
	}
	return list
}
