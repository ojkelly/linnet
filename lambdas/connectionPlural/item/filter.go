package item

import (
	"context"
	"fmt"
	"reflect"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-xray-sdk-go/xray"
	"github.com/ojkelly/linnet/lambdas/util/types"
)

// FilterNodes -
func FilterNodes(
	ctx context.Context,
	filterConfig map[string]types.FilterConfigValue,
	nodes []types.Node,
) (
	nodesFiltered []types.Node,
	err error,
) {
	ctx, segment := xray.BeginSubsegment(ctx, "FilterNodes")
	defer segment.Close(err)

	// check each node passes the filter condition
	for _, node := range nodes {
		nodeValid := false

		// Run the filter over every field on the node
		for fieldKey, fieldValue := range node {
			if fieldKey != "" &&
				fieldValue != nil {

				// Run only on the fields with criteria
				for filterConfigKey, filterConfigValue := range filterConfig {
					if fieldKey == filterConfigKey {
						fmt.Println("fieldKey, filterConfigKey, filterConfigValue", fieldKey, filterConfigKey, filterConfigValue)
						fmt.Println("fieldValue type", reflect.TypeOf(fieldValue))

						switch fieldValue.(type) {
						case bool:
							var notEqualTo *bool
							var equalTo *bool

							if filterConfigValue["notEqualTo"] != nil {
								notEqualTo = aws.Bool(filterConfigValue["notEqualTo"].(bool))
							}
							if filterConfigValue["equalTo"] != nil {
								equalTo = aws.Bool(filterConfigValue["equalTo"].(bool))
							}

							nodeValid = filterBoolean(
								fieldValue.(bool),
								notEqualTo,
								equalTo,
							)
						case string:
							var notEqualTo *string
							var equalTo *string
							var lessThanOrEqualTo *string
							var lessThan *string
							var greaterThanOrEqualTo *string
							var greaterThan *string
							var contains *string
							var notContains *string
							var beginsWith *string
							var endsWith *string

							if filterConfigValue["notEqualTo"] != nil {
								notEqualTo = aws.String(filterConfigValue["notEqualTo"].(string))
							}
							if filterConfigValue["equalTo"] != nil {
								equalTo = aws.String(filterConfigValue["equalTo"].(string))
							}
							if filterConfigValue["lessThanOrEqualTo"] != nil {
								lessThanOrEqualTo = aws.String(filterConfigValue["lessThanOrEqualTo"].(string))
							}
							if filterConfigValue["lessThan"] != nil {
								lessThan = aws.String(filterConfigValue["lessThan"].(string))
							}
							if filterConfigValue["greaterThanOrEqualTo"] != nil {
								greaterThanOrEqualTo = aws.String(filterConfigValue["greaterThanOrEqualTo"].(string))
							}
							if filterConfigValue["greaterThan"] != nil {
								greaterThan = aws.String(filterConfigValue["greaterThan"].(string))
							}
							if filterConfigValue["contains"] != nil {
								contains = aws.String(filterConfigValue["contains"].(string))
							}
							if filterConfigValue["notContains"] != nil {
								notContains = aws.String(filterConfigValue["notContains"].(string))
							}
							if filterConfigValue["beginsWith"] != nil {
								beginsWith = aws.String(filterConfigValue["beginsWith"].(string))
							}
							if filterConfigValue["endsWith"] != nil {
								endsWith = aws.String(filterConfigValue["endsWith"].(string))
							}

							nodeValid = filterString(
								fieldValue.(string),
								notEqualTo,
								equalTo,
								lessThanOrEqualTo,
								lessThan,
								greaterThanOrEqualTo,
								greaterThan,
								contains,
								notContains,
								beginsWith,
								endsWith,
							)

						case int:
							var notEqualTo *int
							var equalTo *int
							var lessThanOrEqualTo *int
							var lessThan *int
							var greaterThanOrEqualTo *int
							var greaterThan *int
							var contains *int
							var notContains *int
							var between []*int

							if filterConfigValue["notEqualTo"] != nil {
								notEqualTo = aws.Int(filterConfigValue["notEqualTo"].(int))
							}
							if filterConfigValue["equalTo"] != nil {
								equalTo = aws.Int(filterConfigValue["equalTo"].(int))
							}
							if filterConfigValue["lessThanOrEqualTo"] != nil {
								lessThanOrEqualTo = aws.Int(filterConfigValue["lessThanOrEqualTo"].(int))
							}
							if filterConfigValue["lessThan"] != nil {
								lessThan = aws.Int(filterConfigValue["lessThan"].(int))
							}
							if filterConfigValue["greaterThanOrEqualTo"] != nil {
								greaterThanOrEqualTo = aws.Int(filterConfigValue["greaterThanOrEqualTo"].(int))
							}
							if filterConfigValue["greaterThan"] != nil {
								greaterThan = aws.Int(filterConfigValue["greaterThan"].(int))
							}
							if filterConfigValue["contains"] != nil {
								contains = aws.Int(filterConfigValue["contains"].(int))
							}
							if filterConfigValue["notContains"] != nil {
								notContains = aws.Int(filterConfigValue["notContains"].(int))
							}
							if filterConfigValue["between"] != nil {
								between = aws.IntSlice(filterConfigValue["between"].([]int))
							}

							nodeValid = filterInt(
								fieldValue.(int),
								notEqualTo,
								equalTo,
								lessThanOrEqualTo,
								lessThan,
								greaterThanOrEqualTo,
								greaterThan,
								contains,
								notContains,
								between,
							)

						case float64:
							var notEqualTo *float64
							var equalTo *float64
							var lessThanOrEqualTo *float64
							var lessThan *float64
							var greaterThanOrEqualTo *float64
							var greaterThan *float64
							var contains *float64
							var notContains *float64
							var between []*float64

							if filterConfigValue["notEqualTo"] != nil {
								notEqualTo = aws.Float64(filterConfigValue["notEqualTo"].(float64))
							}
							if filterConfigValue["equalTo"] != nil {
								equalTo = aws.Float64(filterConfigValue["equalTo"].(float64))
							}
							if filterConfigValue["lessThanOrEqualTo"] != nil {
								lessThanOrEqualTo = aws.Float64(filterConfigValue["lessThanOrEqualTo"].(float64))
							}
							if filterConfigValue["lessThan"] != nil {
								lessThan = aws.Float64(filterConfigValue["lessThan"].(float64))
							}
							if filterConfigValue["greaterThanOrEqualTo"] != nil {
								greaterThanOrEqualTo = aws.Float64(filterConfigValue["greaterThanOrEqualTo"].(float64))
							}
							if filterConfigValue["greaterThan"] != nil {
								greaterThan = aws.Float64(filterConfigValue["greaterThan"].(float64))
							}
							if filterConfigValue["contains"] != nil {
								contains = aws.Float64(filterConfigValue["contains"].(float64))
							}
							if filterConfigValue["notContains"] != nil {
								notContains = aws.Float64(filterConfigValue["notContains"].(float64))
							}
							if filterConfigValue["between"] != nil {
								between = aws.Float64Slice(filterConfigValue["between"].([]float64))
							}

							nodeValid = filterFloat64(
								fieldValue.(float64),
								notEqualTo,
								equalTo,
								lessThanOrEqualTo,
								lessThan,
								greaterThanOrEqualTo,
								greaterThan,
								contains,
								notContains,
								between,
							)

						}
					}
				}
			}
		}

		if nodeValid {
			nodesFiltered = append(nodesFiltered, node)
		}
	}

	return nodesFiltered, err
}

func filterBoolean(
	value bool,
	notEqualTo *bool,
	equalTo *bool,
) (
	valid bool,
) {
	if notEqualTo != nil {
		if value != *notEqualTo {
			valid = true
		}
	}

	if equalTo != nil {
		if value == *equalTo {
			valid = true
		}
	}

	return valid
}

func filterString(
	value string,
	notEqualTo *string,
	equalTo *string,
	lessThanOrEqualTo *string,
	lessThan *string,
	greaterThanOrEqualTo *string,
	greaterThan *string,
	contains *string,
	notContains *string,
	beginsWith *string,
	endsWith *string,
) (
	valid bool,
) {

	if notEqualTo != nil {
		if value != *notEqualTo {
			valid = true
		}
	}
	if equalTo != nil {
		if value == *equalTo {
			valid = true
		}
	}
	if lessThanOrEqualTo != nil {
		if value <= *lessThanOrEqualTo {
			valid = true
		}
	}
	if lessThan != nil {
		if value < *lessThan {
			valid = true
		}
	}
	if greaterThanOrEqualTo != nil {
		if value >= *greaterThanOrEqualTo {
			valid = true
		}
	}
	if greaterThan != nil {
		if value > *greaterThan {
			valid = true
		}
	}
	if contains != nil {
		if strings.Contains(value, *contains) {
			valid = true
		}
	}
	if notContains != nil {
		if !strings.Contains(value, *contains) {
			valid = true
		}
	}
	if beginsWith != nil {
		if strings.HasPrefix(value, *beginsWith) {
			valid = true
		}
	}

	if endsWith != nil {
		if strings.HasSuffix(value, *endsWith) {
			valid = true
		}
	}

	return valid
}

func filterInt(
	value int,
	notEqualTo *int,
	equalTo *int,
	lessThanOrEqualTo *int,
	lessThan *int,
	greaterThanOrEqualTo *int,
	greaterThan *int,
	contains *int,
	notContains *int,
	between []*int,
) (
	valid bool,
) {
	if notEqualTo != nil {
		if value != *notEqualTo {
			valid = true
		}
	}
	if equalTo != nil {
		if value == *equalTo {
			valid = true
		}
	}
	if lessThanOrEqualTo != nil {
		if value <= *lessThanOrEqualTo {
			valid = true
		}
	}
	if lessThan != nil {
		if value < *lessThan {
			valid = true
		}
	}
	if greaterThanOrEqualTo != nil {
		if value >= *greaterThanOrEqualTo {
			valid = true
		}
	}
	if greaterThan != nil {
		if value > *greaterThan {
			valid = true
		}
	}
	if contains != nil {
		if value == *contains {
			valid = true
		}
	}
	if notContains != nil {
		if value == *notContains {
			valid = true
		}
	}
	if between != nil {
		if len(between) == 2 {
			if value >= *between[0] && value <= *between[1] {
				valid = true
			}
		} else {
			// TODO: handle error??
		}
	}

	return valid
}

func filterFloat64(
	value float64,
	notEqualTo *float64,
	equalTo *float64,
	lessThanOrEqualTo *float64,
	lessThan *float64,
	greaterThanOrEqualTo *float64,
	greaterThan *float64,
	contains *float64,
	notContains *float64,
	between []*float64,
) (
	valid bool,
) {
	return valid
}
