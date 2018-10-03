package main

// import (
// 	"context"
// 	"fmt"
// 	"io/ioutil"
// 	"testing"

// 	"github.com/aws/aws-xray-sdk-go/xray"
// 	"github.com/ojkelly/linnet/lambdas/util/types"
// 	"github.com/stretchr/testify/assert"
// )

// func TestHandler(t *testing.T) {

// 	type TestNode struct {
// 		Title       string `json:"title"`
// 		Description string `json:"description"`
// 		Price       string `json:"price"`
// 	}

// 	type Output struct {
// 		response types.Node
// 		err      error
// 	}
// 	tests := []struct {
// 		output Output
// 		throws bool
// 	}{
// 		{
// 			throws: false,
// 			output: Output{
// 				response: nil,
// 				err:      nil,
// 			},
// 		},
// 		{
// 			throws: false,
// 			output: Output{
// 				response: nil,
// 				err:      nil,
// 			},
// 		},
// 		{
// 			throws: false,
// 			output: Output{
// 				response: nil,
// 				err:      nil,
// 			},
// 		},
// 	}

// 	for i, test := range tests {
// 		ctx, _ := xray.BeginSegment(context.Background(), "TestHandler")

// 		assert := assert.New(t)

// 		fileName := fmt.Sprintf("testdata/handler/%d.json", i)
// 		event, err := ioutil.ReadFile(fileName)
// 		if err != nil {
// 			panic(err)
// 		}

// 		output, err := handler(
// 			ctx,
// 			event,
// 		)

// 		if test.throws {
// 			assert.NotNil(err)
// 		} else {
// 			assert.Nil(err)

// 			fieldsToMatch := len(test.output.response)
// 			fieldsMatch := 0

// 			for key, value := range test.output.response {
// 				for outputKey, outputValue := range output {
// 					if key == outputKey &&
// 						value == outputValue {
// 						fieldsMatch = fieldsMatch + 1
// 					}
// 				}
// 			}

// 			assert.Equal(
// 				fieldsToMatch,
// 				fieldsMatch,
// 				fmt.Sprintf("Test %d", i),
// 			)
// 		}
// 	}
// }
