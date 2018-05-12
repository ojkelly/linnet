//  let dataSourceTemplates: DataSourceTemplates = {};

//  // Keep a map of scalar values and how to serialise them
//  // Not used until AppSync supports cusotm scalars
//  let scalarTypeMap: any[] = [];

//  // Input Types tobe used throughout the schema
//  const newInputTypes = {
//      BatchPayload: new GraphQLObjectType({
//          name: `BatchPayload`,
//          description: `Number of nodes affected by the mutation`,
//          fields: () => ({
//              count: { type: GraphQLInt },
//          }),
//      }),
//  };

//  // Create a var to store the new query and mutation types
//  const newTypeFields: any = {
//      query: {},
//      mutation: {},
//  };
//  const newTypeDataSourceMap: any = {
//      query: {},
//      mutation: {},
//  };

//  // Print the server directive to a string
//  const printedDirectives: string = printDirectives(directives);

//  // Merge our directives with the incoming typeDefs
//  const mergedTypeDefs = formatString(
//      mergeStrings([printedDirectives, typeDefs]),
//  );

//  // Build a schema from the incoming typeDefs
//  const schema: GraphQLSchema = buildSchema(mergedTypeDefs);

//  // Get all the directives from the schema
//  const schemaDirectives: GraphQLDirective[] = schema.getDirectives();

//  // Then add the default Query and Mutation fields for those ObjectTypeDefinition
//  // Walk the AST and extract resolver Templates, and dataSources
//  const ast: DocumentNode = parse(mergedTypeDefs);

//  // Create Input Types
//  visit(ast, {
//      enter: (
//          node: any,
//          key: any,
//          parent: any,
//          path: any,
//          ancestors: any,
//      ) => {
//          switch (node.kind) {
//              // Process our ObjectTypes / @nodes
//              case "ObjectTypeDefinition":
//                  {
//                      if (
//                          node.name.value === "Query" ||
//                          node.name.value === "Mutation" ||
//                          node.name.value === "Subscription"
//                      ) {
//                          // https://www.youtube.com/watch?v=otCpCn0l4Wo
//                          return;
//                      }
//                      // If the node has the @node directive, it gets a dataSource
//                      // resolver template, and default fields
//                      node.directives.forEach((directive, index) => {
//                          if (directive.name.value === "node") {
//                              const type: GraphQLNamedType = schema.getType(
//                                  node.name.value,
//                              );
//                              // TODO: Pass the dataSource type to the default Type creators
//                              // as dynamodb, lambda, and elasticsearch all had different added types
//                              if (
//                                  type instanceof GraphQLObjectType ===
//                                  true
//                              ) {
//                                  // Create the Input Types
//                                  createInputTypes({
//                                      node,
//                                      type,
//                                      newInputTypes,
//                                  });
//                              }
//                          }
//                      });
//                  }
//                  break;
//          }
//          return node;
//      },
//  });

//  console.log({ newInputTypes });
//  // Create new Types
//  visit(ast, {
//      enter: (
//          node: any,
//          key: any,
//          parent: any,
//          path: any,
//          ancestors: any,
//      ) => {
//          // console.log({ node });
//          switch (node.kind) {
//              // Keep a map of scalar types and how to serialise them
//              // we can only do simple things, like serialise them into
//              // DynamoDB types.
//              // Anything more complex requires custom resolver mapping templates.
//              case "ScalarTypeDefinition": {
//                  throw new Error(
//                      "AppSync can't handle custom Scalar types yet.",
//                  );
//                  // node.directives.forEach((directive, index) => {
//                  //     if (directive.name.value === "scalarSerialise") {
//                  //         directive.arguments.forEach(argument => {
//                  //             if (
//                  //                 argument.name.value === "serialiseType"
//                  //             ) {
//                  //                 scalarTypeMap.push({
//                  //                     type: node.name.value,
//                  //                     serialiseAs: argument.value.value,
//                  //                 });
//                  //             }
//                  //         });
//                  //     }
//                  // });
//              }

//              // Process our ObjectTypes / @nodes
//              case "ObjectTypeDefinition":
//                  {
//                      if (
//                          node.name.value === "Query" ||
//                          node.name.value === "Mutation" ||
//                          node.name.value === "Subscription"
//                      ) {
//                          // https://www.youtube.com/watch?v=otCpCn0l4Wo
//                          return;
//                      }
//                      // If the node has the @node directive, it gets a dataSource
//                      // resolver template, and default fields
//                      node.directives.forEach((directive, index) => {
//                          if (directive.name.value === "node") {
//                              const type: GraphQLNamedType = schema.getType(
//                                  node.name.value,
//                              );
//                              // TODO: Pass the dataSource type to the default Type creators
//                              // as dynamodb, lambda, and elasticsearch all had different added types
//                              if (
//                                  type instanceof GraphQLObjectType ===
//                                  true
//                              ) {
//                                  // Add the default fields
//                                  const typeWithDefaults: GraphQLType = addDefaultFieldsToType(
//                                      type as GraphQLObjectType,
//                                  );

//                                  // Add the default Types
//                                  createTypes({
//                                      node,
//                                      type: typeWithDefaults,
//                                      newTypeFields,
//                                      newTypeDataSourceMap,
//                                      newInputTypes,
//                                  });

//                                  // Parse this node, and extract the resolverMapping,
//                                  // and DataSource templates
//                                  createDataSourceTemplate(
//                                      config,
//                                      node,
//                                      typeWithDefaults,
//                                      dataSourceTemplates,
//                                  );
//                              }
//                          }
//                      });
//                  }
//                  break;
//          }
//          return node;
//      },
//  });

//  // Add relationship input types to relationship fields
//  //   visit(ast, {
//  //     enter: (
//  //         node: any,
//  //         key: any,
//  //         parent: any,
//  //         path: any,
//  //         ancestors: any,
//  //     ) => {
//  //         switch (node.kind) {
//  //             // Process our ObjectTypes / @nodes
//  //             case "ObjectTypeDefinition":
//  //                 {
//  //                     if (
//  //                         node.name.value === "Query" ||
//  //                         node.name.value === "Mutation" ||
//  //                         node.name.value === "Subscription"
//  //                     ) {
//  //                         // https://www.youtube.com/watch?v=otCpCn0l4Wo
//  //                         return;
//  //                     }
//  //                     // If the node has the @node directive, it gets a dataSource
//  //                     // resolver template, and default fields
//  //                     node.directives.forEach((directive, index) => {
//  //                         if (directive.name.value === "node") {
//  //                             const type: GraphQLNamedType = schema.getType(
//  //                                 node.name.value,
//  //                             );
//  //                             // TODO: Pass the dataSource type to the default Type creators
//  //                             // as dynamodb, lambda, and elasticsearch all had different added types
//  //                             if (
//  //                                 type instanceof GraphQLObjectType ===
//  //                                 true
//  //                             ) {
//  //                                 // Create the Input Types
//  //                                 createInputTypes({
//  //                                     node,
//  //                                     type,
//  //                                     newInputTypes,
//  //                                 });
//  //                             }
//  //                         }
//  //                     });
//  //                 }
//  //                 break;
//  //         }
//  //         return node;
//  //     },
//  // });

//  // resolverTemplates for those as well, (they will tie in with the @node dataSources)
//  const newSchema: GraphQLSchema = new GraphQLSchema({
//      query: new GraphQLObjectType({
//          name: "Query",
//          fields: () => ({
//              ...newTypeFields.query,
//          }),
//      }),
//      mutation: new GraphQLObjectType({
//          name: "Mutation",
//          fields: () => ({
//              ...newTypeFields.mutation,
//          }),
//      }),
//  });

//  // const remainingNodes: string = formatAst(ast);
//  const schemaRoot: string = `
// schema {
// query: Query
// mutation: Mutation
// }
// `;
//  const newTypeDefs: string = printSchema(newSchema);
//  const finalisedDoc: DocumentNode = parse(
//      `${mergedTypeDefs}\n\n${newTypeDefs}\n\n${schemaRoot}`,
//  );
//  const finalisedTypeDefs: string = formatString(
//      mergeAndDeDupeAst(finalisedDoc),
//  );

//  const finalisedSchemaDocument = buildSchema(finalisedTypeDefs);

//  // // console.log(JSON.stringify(fullSchemaStr, null, 2));
//  // // TODO: Now you need to process the newTypeFields and generate

//  const strippedTypeDefs = printSchema(finalisedSchemaDocument);
//  console.log(`${strippedTypeDefs}`);

//  // At this point we have extracted entities with @dataSource's into
//  // dataSourceTempalates, and we've added default fields to those entities
//  // So now we have enough info to generate the resolver templates.
//  const resolverTemplates = generateResolverMappingTemplates({
//      dataSourceTemplates,
//      newTypeDataSourceMap,
//      types: newTypeFields,
//      typeDefs: strippedTypeDefs,
//  });
//  return {
//      resolverTemplates,
//      typeDefs: finalisedTypeDefs,
//      dataSourceTemplates: dataSourceTemplates,
//  };

//----------------------------------------------------------------------------------------------------------------------

// function convertASTValueToMappingValue(type: any): string {
//   // console.log("convertASTValueToMappingValue", type.kind, type.name);
//   if (type.kind === "NamedType") {
//       switch (type.value) {
//           case "String":
//               return "S";
//           case "Int":
//               return "N";
//       }
//   }

//   //   fields: node.fields.map(field => {
//   //     console.log({ field });
//   //     return {
//   //         fieldName: field.name.value,
//   //         type: convertASTValueToMappingValue(
//   //             field.type,
//   //         ),
//   //         // value:
//   //     };
//   // }),
// }

// function mergeAndDeDupeAst(schemaAst: DocumentNode): string {
//   const typeDefs = {};

//   // Go through the AST and extract/merge type definitions.
//   const editedAst: Document = visit(schemaAst, {
//       enter(node) {
//           const nodeName = node.name ? node.name.value : null;

//           // Don't transform TypeDefinitions directly
//           if (!nodeName || !node.kind.endsWith("TypeDefinition")) {
//               return;
//           }

//           const oldNode = typeDefs[nodeName];

//           if (!oldNode) {
//               // First time seeing this type so just store the value.
//               typeDefs[nodeName] = node;
//               return null;
//           }
//           // This type is defined multiple times, so merge the fields and values.
//           const concatProps = ["fields", "values", "types"];
//           concatProps.forEach(propName => {
//               if (node[propName] && oldNode[propName]) {
//                   const newProp = {};
//                   // Favour existing props first
//                   if (typeof oldNode[propName] !== "undefined") {
//                       Object.keys(oldNode[propName]).forEach((prop: any) => {
//                           if (typeof newProp[propName] === "undefined") {
//                               newProp[(propName = prop)];
//                           }
//                       });
//                   }
//                   if (typeof node[propName] !== "undefined") {
//                       Object.keys(node[propName]).forEach((prop: any) => {
//                           if (typeof newProp[propName] === "undefined") {
//                               newProp[(propName = prop)];
//                           }
//                       });
//                   }
//                   node[propName] = newProp;
//               }
//           });

//           typeDefs[nodeName] = node;
//           return null;
//       },
//   });
//   // console.log(JSON.stringify(typeDefs, null, 2));
//   const remainingNodesStr = formatAst(editedAst);
//   const typeDefsStr = Object.values(typeDefs)
//       .map(formatAst)
//       .join("\n");
//   const fullSchemaStr = `${remainingNodesStr}\n\n${typeDefsStr}`;

//   return formatString(fullSchemaStr);
// }
export {};
