package types

// LambdaResponse is the struct returned by all lambdas
type LambdaResponse struct {
	// This is the data that is returned to the user
	Data map[string]interface{} `json:"data"`

	// Errors passed here, are sent back to the user
	// Therefore, internal errors should only be logged
	// and not returned via this array
	Errors []string `json:"errors"`
}
