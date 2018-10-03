import { visit } from "graphql";
import * as _ from "lodash";

function cleanupTypes({ ast }) {
  return visit(ast, {
    enter(node: any) {
      if (
        typeof node !== "undefined" &&
        node.kind === "ObjectTypeDefinition" &&
        typeof node.name !== "undefined" &&
        node.name.value === "Query"
      ) {
        node.fields.forEach((field, i) => {
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
