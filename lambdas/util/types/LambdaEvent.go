package types

// LambdaEvent is the base type sent from linnet to the resolver
type LambdaEvent struct {
	LinnetFields []string                 `json:"linnetFields"`
	DataSource   DataSourceDynamoDBConfig `json:"dataSource"`
	NamedType    string                   `json:"namedType"`
	EdgeTypes    []Edge                   `json:"edgeTypes"`
	Context      LinnetResolverContext    `json:"context"`
}

// LinnetResolverContext -
type LinnetResolverContext struct {
	Arguments map[string]interface{} `json:"arguments"`
	Result    interface{}            `json:"result"`
	Source    interface{}            `json:"source"`
}

// LinnetArguments -
type LinnetArguments struct {
	Data        []interface{}     `json:"data"`
	Connections map[string]string `json:"connections"`
	Where       WhereArguments    `json:"where"`
}

type WhereArguments struct {
	ID string `json:"id"`
}
