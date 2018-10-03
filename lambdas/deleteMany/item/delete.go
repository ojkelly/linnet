package item

import (
	"context"

	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/database"
)

// Delete item by id
// Also delete all edges where this Node was the PRIMARY edge
//
// Deletion process is as follows:
// 1. Items to delete are discoved
// 2. Items to delete are updated with a NodeState ==
func DeleteMany(
	ctx context.Context,
	dynamo dynamodbiface.DynamoDBAPI,
	tableName *string,
	ids []string,
	ttl string,
) (
	deletedCount int,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "Delete")
	defer segment.Close(err)

	for _, id := range ids {
		// First get a list of all the Hash and Sort keys matching this ID
		itemsToDelete, err := database.FindAllItemsToDeleteWithHashKey(
			ctx,
			dynamo,
			tableName,
			id,
			ttl,
		)
		if err != nil {
			return deletedCount, err
		}

		for _, item := range *itemsToDelete {
			// Then delete everything in that list.
			deleted, err := database.UpdateItemTTL(
				ctx,
				dynamo,
				tableName,
				item,
				ttl,
			)
			if err != nil {
				return deletedCount, err
			}

			if deleted {
				deletedCount = deletedCount + 1
			}
		}
	}
	return deletedCount, err
}
