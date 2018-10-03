package main

import "github.com/ojkelly/linnet/lambdas/util/types"

// DeleteLambdaEvent -
type DeleteLambdaEvent struct {
	LinnetFields []string                       `json:"linnetFields"`
	DataSource   types.DataSourceDynamoDBConfig `json:"dataSource"`
	NamedType    string                         `json:"namedType"`
	EdgeTypes    []types.Edge                   `json:"edgeTypes"`
	Context      DeleteLambdaResolverContext    `json:"context"`
}

//DeleteLambdaResolverContext -
type DeleteLambdaResolverContext struct {
	Arguments DeleteLambdaArguments `json:"arguments"`
	Result    interface{}           `json:"result"`
	Source    interface{}           `json:"source"`
}

// DeleteLambdaArguments -
type DeleteLambdaArguments struct {
	Where WhereArguments `json:"where"`
	Set   SetArguments   `json:"set"`
}

// DeleteIDs-
type DeleteIDs = []string

// WhereArguments-
type WhereArguments struct {
	IDs DeleteIDs `json:"ids"`
}

// SetArguments-
type SetArguments struct {
	TimeToLive int `json:"timeToLive"`
}
