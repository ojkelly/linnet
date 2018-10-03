package util

import (
	"reflect"

	"github.com/ojkelly/linnet/lambdas/util/types"
)

// ExtractDataFromInput from the standard mutation input,
// extract the "data" object
func ExtractDataFromInput(
	input map[string]interface{},
) (
	nodes []types.Node,
) {
	// check if data is a map or array
	dataType := reflect.ValueOf(input["data"]).Kind()

	// Add all data entries to the nodes map,
	// in some cases this is a map, others it's a Slice/Array
	// The reason if primarily DX
	if dataType == reflect.Map {
		nodes = append(nodes, input["data"].(map[string]interface{}))
	} else if dataType == reflect.Array || dataType == reflect.Slice {
		for _, node := range input["data"].([]interface{}) {
			nodes = append(
				nodes,
				node.(map[string]interface{}),
			)
		}
	}

	return
}
