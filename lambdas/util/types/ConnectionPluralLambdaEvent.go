package types

// ConnectionPluralLambdaEvent -
type ConnectionPluralLambdaEvent struct {
	LinnetFields []string                              `json:"linnetFields"`
	DataSource   DataSourceDynamoDBConfig              `json:"dataSource"`
	NamedType    string                                `json:"namedType"`
	EdgeTypes    []Edge                                `json:"edgeTypes"`
	Context      ConnectionPluralLambdaResolverContext `json:"context"`
}

//ConnectionPluralLambdaResolverContext -
type ConnectionPluralLambdaResolverContext struct {
	Arguments ConnectionPluralLambdaArguments `json:"arguments"`
	Result    map[string]interface{}          `json:"result"`
	Source    map[string]interface{}          `json:"source"`
}

// ConnectionPluralLambdaArguments -
type ConnectionPluralLambdaArguments struct {
	Filter map[string]FilterConfigValue `json:"filter"`
	Limit  int64                        `json:"limit"`
	Cursor string                       `json:"cursor"`
	Where  WhereArguments               `json:"where"`
}

// FilterConfigValue -
type FilterConfigValue map[string]interface{}
