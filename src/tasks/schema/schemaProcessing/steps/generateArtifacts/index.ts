import {
  parse,
  printSchema,
  buildSchema,
  DocumentNode,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLInt,
} from "graphql";
import { directives } from "../../../util/directives";
import { printDirectives } from "../../../util/printer";

import { generateTypes } from "./generateTypes";
import { generateInputTypes } from "./generateInputTypes";
import { generateEdgeInputTypes } from "./generateEdgeInputTypes";
import { cleanupTypes } from "./cleanupTypes";
import { generateResolverMappingTemplates } from "../../../resolvers/generateResolverMappingTemplates";
import { DataSourceTemplates } from "../../../dataSources/dataSources";
import { Subscriber } from "rxjs";

import { formatString, formatAst } from "gql-format";
import { mergeStrings } from "gql-merge";

import { Config } from "../../../../common/types";
import { mergeAndDeDupeAst } from "../../../util/ast";

import { extractEdges } from "./extractEdges";
import { createEdgeTypes } from "./types/createEdgeTypes";

/**
 * Generate a new schema with default fields, and
 * create all the input types
 *
 * 2. Add all the extra fields to the mutation and query
 * objects
 * 3. Then extract all the relationships
 * including type, and direction
 * 4. Then extract the dataSources
 * This is only needed for Lambda and ES, as
 * DyanmoDB sources are implicit on being of the
 * Node interface
 *
 * @param options
 */
async function generateArtifacts({
  typeDefs,
  config,
  observer,
}: {
  typeDefs: string;
  config: Config;
  observer: Subscriber<any>;
}) {
  // [ Setup ]------------------------------------------------------------------------------------

  let dataSourceTemplates: DataSourceTemplates = {};

  // Keep a map of scalar values and how to serialise them
  // Not used until AppSync supports cusotm scalars
  // let scalarTypeMap: any[] = [];

  // Input Types tobe used throughout the schema
  const newInputTypes = {
    BatchPayload: new GraphQLObjectType({
      name: `BatchPayload`,
      description: `Number of nodes affected by the mutation`,
      fields: () => ({
        count: { type: GraphQLInt },
      }),
    }),
    DeleteAttributes: new GraphQLInputObjectType({
      name: `DeleteAttributes`,
      description: `Attributes to set on the deleted node`,
      fields: () => ({
        // cascade: { type: GraphQLBoolean }, // this is cool, but not sure how to implement yet
        timeToLive: { type: GraphQLInt },
      }),
    }),
  };

  // Create a var to store the new query and mutation types
  const newTypeFields: any = {
    query: {},
    mutation: {},
  };
  const newTypeDataSourceMap: any = {
    query: {},
    mutation: {},
  };

  // Print the server directive to a string
  const printedDirectives: string = printDirectives(directives);
  // Merge our directives with the incoming typeDefs
  const mergedTypeDefs = formatString(
    mergeStrings([printedDirectives, typeDefs]),
  );

  // Build a schema from the incoming typeDefs
  const schema: GraphQLSchema = buildSchema(mergedTypeDefs);

  // Then add the default Query and Mutation fields for those ObjectTypeDefinition
  // Walk the AST and extract resolver Templates, and dataSources
  const ast: DocumentNode = parse(mergedTypeDefs);

  // TODO: walk ast and check no field is prefixed with `linnet:`

  // [ Extract Edges ]----------------------------------------------------------------------------
  observer.next("Extracting edges from Schema");
  let edges = extractEdges({
    ast,
    schema,
  });

  // [ Create Input Types ]-----------------------------------------------------------------------
  observer.next("Creating Input types");
  generateInputTypes({
    ast,
    schema,
    newInputTypes,
    edges,
  });

  // [ Create New Types ]-------------------------------------------------------------------------
  observer.next("Creating Types");
  generateTypes({
    ast,
    schema,
    newTypeFields,
    newTypeDataSourceMap,
    newInputTypes,
    dataSourceTemplates,
    config,
    edges,
  });

  // [ Create Edge Input Types ]------------------------------------------------------------------
  observer.next("Creating Edge Input Types");
  generateEdgeInputTypes({
    ast,
    schema,
    newInputTypes,
    edges,
  });

  observer.next("Finalising Schema");
  // resolverTemplates for those as well, (they will tie in with the @node dataSources)
  const newSchema: GraphQLSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: () => ({
        ...newTypeFields.query,
      }),
    }),
    mutation: new GraphQLObjectType({
      name: "Mutation",
      fields: () => ({
        ...newTypeFields.mutation,
      }),
    }),
  });
  // const remainingNodes: string = formatAst(ast);
  const schemaRoot: string = `
schema {
query: Query
mutation: Mutation
}
`;
  // console.dir(newInputTypes);

  const newTypeDefs: string = printSchema(newSchema);
  // console.log(`${newTypeDefs}`);

  const finalisedDoc: DocumentNode = parse(
    `${mergedTypeDefs}\n\n${newTypeDefs}\n\n${schemaRoot}`,
  );
  const finalisedTypeDefs: string = formatString(
    mergeAndDeDupeAst(finalisedDoc),
  );

  // [ Create Edge Types ]------------------------------------------------------------------------
  observer.next("Creating Edge Types");
  const schemaDocWithEdges = createEdgeTypes({
    edges,
    schemaDocument: parse(finalisedTypeDefs),
  });

  // [ Finalise Schema ]--------------------------------------------------------------------------

  const cleanedAst = cleanupTypes({ ast: schemaDocWithEdges });
  const strippedTypeDefs = formatAst(cleanedAst);

  console.log(`${strippedTypeDefs}`);

  // At this point we have extracted entities with @dataSource's into
  // dataSourceTempalates, and we've added default fields to those entities
  // So now we have enough info to generate the resolver templates.
  observer.next("Generating resolver mapping templates");
  const resolverTemplates = generateResolverMappingTemplates({
    dataSourceTemplates,
    newTypeDataSourceMap,
    types: newTypeFields,
    typeDefs: strippedTypeDefs,
    edges,
    config,
  });

  return {
    typeDefs: strippedTypeDefs,
    resolverTemplates,
    dataSourceTemplates: dataSourceTemplates,
  };
}
export { generateArtifacts };
