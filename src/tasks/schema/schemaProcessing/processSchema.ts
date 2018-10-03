import { Observable, Subscriber } from "rxjs";
import {
    visit,
    parse,
    printType,
    printSchema,
    buildSchema,
    buildASTSchema,
    DocumentNode,
    ObjectTypeDefinitionNode,
    GraphQLSchema,
    GraphQLFieldConfig,
    GraphQLNamedType,
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLID,
    GraphQLNonNull,
    OperationDefinitionNode,
    TypeInfo,
    GraphQLDirective,
    GraphQLType,
} from "graphql";
import { mergeAst, mergeStrings } from "gql-merge";
import { formatString, formatAst } from "gql-format";
import { mergeAndDeDupeAst } from "../util/ast";
import {
    ResolverTemplate,
    ResolverTemplates,
    ResolverMappingType,
} from "../resolvers/types";
import {
    createDataSourceTemplate,
    DataSource,
    DataSourceTemplate,
    DataSourceTemplates,
} from "../dataSources/dataSources";
import { Config } from "../../common/types";

import { generateArtifacts } from "./steps/generateArtifacts";

import { directives } from "../util/directives";
import { printDirectives } from "../util/printer";

import { generateInitialSchema } from "./steps/initialSchema";

/**
 * Process the Schema
 *
 * We need to process the schema, and extract:
 * - information about the resolver templates
 * - information about the dataSources to create/update
 *
 * @param options ProcessSchemaOptions
 */
async function processSchema({
    typeDefs,
    config,
    observer,
}: ProcessSchemaOptions): Promise<ProcessSchemaReturn | any> {
    try {
        // Generate the initial working schema
        // So add the Node interface object
        // Return typedefs
        observer.next("Generating initial schema.");
        const initialSchema = await generateInitialSchema({
            typeDefs,
        });

        // 2. Generate the schema with new types, default fields
        observer.next("Generating schema artifacts");
        const {
            resolverTemplates,
            typeDefs: finalisedTypeDefs,
            dataSourceTemplates,
        } = await generateArtifacts({
            typeDefs: initialSchema,
            config,
            observer,
        });
        // console.log(finalisedTypeDefs);

        return {
            resolverTemplates,
            dataSourceTemplates,
            typeDefs: finalisedTypeDefs,
        };
    } catch (err) {
        observer.error(err);
        throw err;
    }
}

type ProcessSchemaOptions = {
    typeDefs: string;
    config: Config;
    observer: Subscriber<any>;
};

type ProcessSchemaReturn = {
    resolverTemplates: ResolverTemplates;
    dataSourceTemplates: DataSourceTemplates;
    typeDefs: string;
};

export { processSchema, ProcessSchemaOptions, ProcessSchemaReturn };
