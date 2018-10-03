import { Observable, Subscriber } from "rxjs";
import { TaskContext, Config } from "../common/types";
import { ListrTaskWrapper } from "listr";
import * as Listr from "listr";
import { ResolverTemplate } from "../schema/resolvers/types";
import * as AWS from "aws-sdk";

/**
 * Process the Schema
 *
 * We need to:
 * - Extract the relationships
 * - Extract the nodes/datasources
 * - Add any default fields
 * @param options
 */
function appSyncResolversTask({
    context,
    task,
}: {
    context: TaskContext;
    task: ListrTaskWrapper;
}): any {
    return new Listr(
        Object.keys(context.schema.resolverTemplates).map(index => {
            const resolverTemplate = context.schema.resolverTemplates[index];

            return {
                title: `${resolverTemplate.typeName}.${
                    resolverTemplate.fieldName
                }`,
                task: () =>
                    new Observable(observer => {
                        async function run() {
                            await addResolver({
                                config: context.config,
                                resolverTemplate,
                                observer,
                            });
                        }
                        run().then(
                            () => observer.complete(),
                            e => observer.error(e),
                        );
                    }),
            };
        }),
    );
}

async function addResolver({
    config,
    resolverTemplate,
    depth,
    observer,
}: {
    config: Config;
    resolverTemplate: ResolverTemplate;
    depth?: number;
    observer: Subscriber<any>;
}): Promise<
    AWS.AppSync.CreateResolverResponse | AWS.AppSync.UpdateResolverResponse
> {
    if (!depth) {
        depth = 1;
    }
    if (depth > 5) {
        observer.error("Max depth hit for addResolver.");
    }
    try {
        const appsync = new AWS.AppSync({
            apiVersion: "2017-07-25",
            region: config.region,
        });

        const listResolversParams: AWS.AppSync.ListResolversRequest = {
            apiId: config.appSync.graphQLApiId,
            typeName: resolverTemplate.typeName,
            maxResults: 0,
        };

        const listResolvers: AWS.AppSync.ListResolversResponse = await appsync
            .listResolvers(listResolversParams)
            .promise();
        observer.next(
            `Checking: ${resolverTemplate.typeName}.${
                resolverTemplate.fieldName
            }`,
        );

        const existingResolver: any = listResolvers.resolvers.find(
            (resolver: AWS.AppSync.Resolver) =>
                `${resolver.typeName}.${resolver.fieldName}` ===
                `${resolverTemplate.typeName}.${resolverTemplate.fieldName}`,
        );

        if (existingResolver) {
            // update
            const updateResolverParams: AWS.AppSync.UpdateResolverRequest = {
                apiId: config.appSync.graphQLApiId,
                dataSourceName: resolverTemplate.dataSourceName,
                fieldName: resolverTemplate.fieldName,
                requestMappingTemplate: resolverTemplate.requestMappingTemplate,
                typeName: resolverTemplate.typeName,
                responseMappingTemplate:
                    resolverTemplate.responseMappingTemplate,
            };

            const updateResolver: AWS.AppSync.UpdateResolverResponse = await appsync
                .updateResolver(updateResolverParams)
                .promise();

            observer.next(
                `Updated: ${resolverTemplate.typeName}.${
                    resolverTemplate.fieldName
                }`,
            );

            return updateResolver;
        } else {
            // create
            const createResolverParams: AWS.AppSync.CreateResolverRequest = {
                apiId: config.appSync.graphQLApiId,
                dataSourceName: resolverTemplate.dataSourceName,
                fieldName: resolverTemplate.fieldName,
                requestMappingTemplate: resolverTemplate.requestMappingTemplate,
                typeName: resolverTemplate.typeName,
                responseMappingTemplate:
                    resolverTemplate.responseMappingTemplate,
            };

            const createResolver: AWS.AppSync.CreateResolverResponse = await appsync
                .createResolver(createResolverParams)
                .promise();

            observer.next(
                `Created: ${resolverTemplate.typeName}.${
                    resolverTemplate.fieldName
                }`,
            );

            return createResolver;
        }
    } catch (error) {
        observer.error(error);
    }
}

export { appSyncResolversTask };
