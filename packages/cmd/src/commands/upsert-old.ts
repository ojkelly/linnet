// import { createSchema } from "../util/createSchema";
// import * as AWS from "aws-sdk";
// import * as path from "path";
// import { loadConfig, Config } from "../util/config";
// import { processSchema, ProcessSchemaReturn } from "../util/processSchema";
// import { buildSchema, parse, printSchema } from "graphql";
// import * as ora from "ora";
// import { default as chalk } from "chalk";
// import { assumeRole } from "../util/assumeRole";
// import { formatString } from "gql-format";

// import { createDataSource } from "../util/dataSources/dataSources";

// import { addDataSource } from "../util/dataSources/addDataSources";
// import { addResolver } from "../util/resolvers/addResolvers";
// // [ Main ]-----------------------------------------------------------------------------------------

// async function upsert({
//     configFile,
//     verbose,
//     environment,
//     profile,
//     region,
// }: UpsertOptions): Promise<boolean> {
//     const spinner = ora();
//     try {
//         spinner.stopAndPersist();

//         if (profile) {
//             const credentials = await assumeRole({ profile });
//             AWS.config.credentials = credentials;
//         }

//         if (typeof configFile === "undefined") {
//             throw new Error("Please specify a --config-file");
//         }
//         if (typeof environment === "undefined") {
//             throw new Error("Please specify a --environment");
//         }
//         spinner.start(chalk.grey("Loading config"));
//         const configPath = path.resolve(configFile);
//         const configPathParsed = path.parse(configPath);
//         // Load config file
//         const config: Config = loadConfig(configPath, environment);
//         if (typeof config.verbose === "undefined") config.verbose = verbose;
//         if (spinner)
//             spinner.stopAndPersist({
//                 symbol: chalk.green("✔"),
//                 text: "Loaded config",
//             });

//         // [ Create Schema ]------------------------------------------------------------------------
//         spinner.start(chalk.grey("Processing Schema"));
//         const initTypeDefs: string = await createSchema(
//             path.resolve(configPathParsed.dir, config.schemaFiles),
//         );

//         // [ Process AST ]--------------------------------------------------------------------------
//         const processSchemaReturn: ProcessSchemaReturn = await processSchema({
//             typeDefs: initTypeDefs,
//             config,
//         });
//         const resolverTemplates = processSchemaReturn.resolverTemplates;
//         const dataSourceTemplates = processSchemaReturn.dataSourceTemplates;
//         const typeDefs = processSchemaReturn.typeDefs;

//         spinner.stopAndPersist({
//             symbol: chalk.green("✔"),
//             text: "Processed Schema",
//         });
//         // console.log(JSON.stringify(result, null, 2));

//         const appsync = new AWS.AppSync({
//             apiVersion: "2017-07-25",
//             region: region ? region : config.region,
//         });

//         // Now create the actual appSync api
//         spinner.start(chalk.grey("Checking for existing AppSync API"));

//         const listGraphqlApis = await appsync
//             .listGraphqlApis({
//                 maxResults: 0,
//             })
//             .promise();

//         let graphQLApi: AWS.AppSync.GraphqlApi = listGraphqlApis.graphqlApis.find(
//             api => api.name === `${config.appSync.name}--${environment}`,
//         );

//         let graphQLApiId: string;

//         if (typeof graphQLApi !== "undefined") {
//             graphQLApiId = graphQLApi.apiId;
//         } else {
//             spinner.start(chalk.grey("Creating AppSync API"));
//             const createGraphqlApiParams: AWS.AppSync.CreateGraphqlApiRequest = {
//                 authenticationType: config.appSync.authenticationType,
//                 name: `${config.appSync.name}--${environment}`,
//             };

//             const createGraphqlApi: AWS.AppSync.CreateGraphqlApiResponse = await appsync
//                 .createGraphqlApi(createGraphqlApiParams)
//                 .promise();

//             graphQLApi = createGraphqlApi.graphqlApi;
//             graphQLApiId = createGraphqlApi.graphqlApi.apiId;
//         }

//         spinner.stopAndPersist({
//             symbol: chalk.green("✔"),
//             text: `Created AppSyncApi: ${config.appSync.name}--${environment}`,
//         });

//         // [ Add Schema ]---------------------------------------------------------------------------

//         spinner.start(chalk.grey("Adding type definitions."));
//         const startSchemaCreationParams: AWS.AppSync.StartSchemaCreationRequest = {
//             apiId: graphQLApiId,
//             definition: typeDefs,
//         };

//         let schemaCreation: AWS.AppSync.StartSchemaCreationResponse = await appsync
//             .startSchemaCreation(startSchemaCreationParams)
//             .promise();

//         const getSchemaCreationStatusParams: AWS.AppSync.GetSchemaCreationStatusRequest = {
//             apiId: graphQLApiId,
//         };

//         let schemaCreationStatus = await appsync
//             .getSchemaCreationStatus(getSchemaCreationStatusParams)
//             .promise();

//         spinner.start(chalk.grey(schemaCreationStatus.details));

//         // Now wait for the schema creation to finish
//         try {
//             schemaCreation = await new Promise(async (resolve, reject) => {
//                 if (schemaCreationStatus.status === "SUCCESS") {
//                     resolve(schemaCreationStatus);
//                 }
//                 if (schemaCreationStatus.status === "FAILED") {
//                     reject(schemaCreationStatus);
//                 }
//                 while (schemaCreationStatus.status === "PROCESSING") {
//                     // Get the status
//                     schemaCreationStatus = await appsync
//                         .getSchemaCreationStatus(getSchemaCreationStatusParams)
//                         .promise();
//                     // console.log({ schemaCreationStatus });
//                     // Wait so we dont hit a rate limit
//                     if (schemaCreationStatus.status === "SUCCESS") {
//                         resolve(schemaCreationStatus);
//                     }
//                     if (schemaCreationStatus.status === "FAILED") {
//                         reject(schemaCreationStatus);
//                     }

//                     setTimeout(() => {}, 1000);
//                 }
//             });
//         } catch (err) {
//             spinner.clear().stopAndPersist({
//                 symbol: chalk.red("✘"),
//                 text: err.details,
//             });
//             process.exit(30);
//         }
//         spinner.stopAndPersist({
//             symbol: chalk.green("✔"),
//             text: schemaCreationStatus.details,
//         });

//         spinner.stopAndPersist({
//             symbol: chalk.green("✔"),
//             text: `Added type definitions.`,
//         });

//         // [ Add dataSources ]----------------------------------------------------------------------

//         // Create the Tables
//         await Promise.all(
//             Object.keys(dataSourceTemplates).map(
//                 async dataSourceKey =>
//                     await createDataSource({
//                         config,
//                         dataSourceTemplate: dataSourceTemplates[dataSourceKey],
//                     }),
//             ),
//         );
//         spinner.stopAndPersist({
//             symbol: chalk.green("✔"),
//             text: `Created Data Sources`,
//         });

//         // Upload dataSource templates to appsync
//         spinner.start(chalk.grey("Getting Data Sources in AppSync"));
//         const listDataSources: AWS.AppSync.ListDataSourcesResponse = await appsync
//             .listDataSources({
//                 apiId: graphQLApi.apiId,
//             })
//             .promise();

//         spinner.start(chalk.grey("Adding Data Sources to AppSync"));

//         await Promise.all(
//             Object.keys(dataSourceTemplates).map(
//                 async dataSourceKey =>
//                     await addDataSource({
//                         apiId: graphQLApi.apiId,
//                         config,
//                         dataSourceTemplate: dataSourceTemplates[dataSourceKey],
//                         listDataSources,
//                     }),
//             ),
//         );

//         spinner.stopAndPersist({
//             symbol: chalk.green("✔"),
//             text: `Added Data Sources to AppSync`,
//         });

//         // Add the resolvers
//         spinner.start(chalk.grey("Adding Resolvers to AppSync"));

//         // const resolversToUpsert: Promise<any>[] =
//         await Promise.all(
//             Object.keys(resolverTemplates).map(
//                 async resolverTemplateKey =>
//                     await addResolver({
//                         apiId: graphQLApi.apiId,
//                         config,
//                         resolverTemplate:
//                             resolverTemplates[resolverTemplateKey],
//                     }),
//             ),
//         );
//         // );
//         // console.log({ resolversToUpsert });
//         // await serial(resolversToUpsert);

//         spinner.stopAndPersist({
//             symbol: chalk.green("✔"),
//             text: `Added Resolvers to AppSync`,
//         });
//         // if (verbose) console.log(`${result.schema}`);
//         // spinner.stop();
//         return true;
//     } catch (error) {
//         spinner.stopAndPersist({
//             symbol: chalk.red("✘"),
//             text: error.message,
//         });
//         console.error(error.message);
//         console.error(error.stack);
//         return false;
//     }
// }

// // https://stackoverflow.com/questions/24586110/resolve-promises-one-after-another-i-e-in-sequence/41115086#41115086
// // const serial = funcs => {
// //     try {
// //         return funcs.reduce(
// //             (promise, func) =>
// //                 promise.then(result =>
// //                     func().then(Array.prototype.concat.bind(result)),
// //                 ),
// //             Promise.resolve([]),
// //         );
// //     } catch (err) {
// //         throw err;
// //     }
// // };

// // [ Types ]-------------------------------------------------

// type UpsertOptions = {
//     profile?: string;
//     region?: string;
//     verbose: boolean;
//     configFile: string;
//     environment: string;
// };

// // [ Exports ]------------------------------------------------

// export { upsert };
