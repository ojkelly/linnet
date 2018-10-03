// Adapted from https://github.com/liamcurry/gql/blob/master/packages/gql-format/src/index.js

import { GraphQLDirective, GraphQLArgument } from "graphql";

function join(maybeArray: any[], separator: string) {
    return maybeArray ? maybeArray.filter(x => x).join(separator || "") : "";
}
function wrap(start: string, maybeString: string | undefined, end: string) {
    return maybeString ? start + maybeString + (end || "") : "";
}

/**
 * Print a GraphQL Directive Arguement
 * @param arg GraphQLArgument
 */
function printDirectiveArg(arg: GraphQLArgument): string {
    return arg.name + ": " + arg.type + wrap(" = ", arg.defaultValue, "");
}

/**
 * Print a single directive to a string
 * @param directive GraphQLDirective
 */
function printDirective(directive: GraphQLDirective): string {
    return (
        "directive @" +
        directive.name +
        wrap(
            "(",
            join(
                directive.args.map((arg: GraphQLArgument) =>
                    printDirectiveArg(arg),
                ),
                ", ",
            ),
            ")",
        ) +
        " on " +
        join(directive.locations, " | ") +
        "\n"
    );
}

/**
 * Given an array of GraphQLDirective's print them to an SDL string
 * @param directives GraphQLDirective[]
 */
function printDirectives(directives: GraphQLDirective[]): string {
    return directives
        .map((directive: GraphQLDirective) => printDirective(directive))
        .reduce(
            (accumulator: string, directive: string) =>
                `${accumulator}\n${directive}`,
        );
}

export { printDirectives };
