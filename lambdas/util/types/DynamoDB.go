package types

// DataSourceDynamoDBConfig contains information about the DynamoDB table
type DataSourceDynamoDBConfig struct {
	// TRUE = use Amazon Cognito credentials with this data source.
	UseCallerCredentials bool   `json:"useCallerCredentials"`
	AwsRegion            string `json:"awsRegion"`
	TableName            string `json:"tableName"`
}
