import {
    GraphQLDirective,
    DirectiveLocation,
    GraphQLString,
    GraphQLBoolean,
    GraphQLEnumType,
} from "graphql";

const directives: GraphQLDirective[] = [
    new GraphQLDirective({
        name: "node",
        locations: [DirectiveLocation.OBJECT],
        args: {
            dataSource: {
                type: GraphQLString,
            },
            consistentRead: {
                type: GraphQLBoolean,
            },
        },
    }),
    new GraphQLDirective({
        name: "edge",
        locations: [DirectiveLocation.FIELD_DEFINITION],
        args: {
            name: {
                type: GraphQLString,
            },
            principal: {
                type: GraphQLBoolean,
            },
        },
    }),
    // To be implemented when AppSync can do custom scalars
    // new GraphQLDirective({
    //     name: "scalarSerialise",
    //     locations: [DirectiveLocation.SCALAR],
    //     args: {
    //         serialiseType: {
    //             type: GraphQLString,
    //         },
    //     },
    // }),
];

export { directives };
