import {
    visit,
    GraphQLNamedType,
    GraphQLType,
    GraphQLObjectType,
} from "graphql";
import * as _ from "lodash";
import { fieldsConflictMessage } from "graphql/validation/rules/OverlappingFieldsCanBeMerged";

function cleanupTypes({ ast }) {
    return visit(ast, {
        enter(node: any, key, parent: any, path, ancestors) {
            if (
                typeof node !== "undefined" &&
                node.kind === "ObjectTypeDefinition" &&
                typeof node.name !== "undefined" &&
                node.name.value === "Query"
            ) {
                node.fields.forEach((field, i) => {
                    // console.log(field);
                    if (_.endsWith(field.name.value, "Connection")) {
                        delete node.fields[i];
                    }
                });
            }
            // @return
            //   undefined: no action
            //   false: skip visiting this node
            //   visitor.BREAK: stop visiting altogether
            //   null: delete this node
            //   any value: replace this node with the returned value
        },
    });
}
export { cleanupTypes };
