enum ResolverType {
    Query = "Query",
    Mutation = "Mutation",
    Subscription = "Subscription",
}

enum ResolverMappingType {
    Request,
    Response,
}

// Resolver templates are used to create a Resolver
type ResolverTemplate = {
    // The dataSource Name
    dataSourceName: string;
    // The GraphQL Type Name
    typeName: string;

    // The name of the field to attach the resolver to.
    fieldName: string;

    // A resolver uses a request mapping template to convert a GraphQL expression
    // into a format that a data source can understand. Mapping templates are
    // written in Apache Velocity Template Language (VTL)
    requestMappingTemplate: string;

    //The mapping template to be used for responses from the data source.
    responseMappingTemplate: string;
};

type ResolverTemplates = {
    [key: string]: ResolverTemplate;
};

export { ResolverTemplate, ResolverTemplates, ResolverMappingType };
