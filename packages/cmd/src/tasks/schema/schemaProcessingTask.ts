import { Observable } from "rxjs";
import { TaskContext, Config } from "../common/types";
import { ListrTaskWrapper } from "listr";

import {
    processSchema,
    ProcessSchemaReturn,
} from "./schemaProcessing/processSchema";

/**
 * Process the Schema
 *
 * We need to:
 * - Extract the relationships
 * - Extract the nodes/datasources
 * - Add any default fields
 * @param options
 */
function schemaProcessingTask({
    context,
    task,
}: {
    context: TaskContext;
    task: ListrTaskWrapper;
}): Observable<any> {
    return new Observable(observer => {
        async function run() {
            observer.next("Preparing schema");
            const processSchemaReturn: ProcessSchemaReturn = await processSchema(
                {
                    typeDefs: context.initialTypeDefs,
                    config: context.config,
                    observer,
                },
            );

            context.schema.resolverTemplates =
                processSchemaReturn.resolverTemplates;
            context.schema.dataSourceTemplates =
                processSchemaReturn.dataSourceTemplates;
            context.schema.typeDefs = processSchemaReturn.typeDefs;
        }
        run().then(() => observer.complete(), e => observer.error(e));
    });
}

export { schemaProcessingTask };
