import { GraphQLField, GraphQLType, GraphQLNamedType } from "graphql";

import {
    ResolverTemplate,
    ResolverTemplates,
    ResolverMappingType,
} from "../types";

import {
    DataSource,
    DataSourceTemplate,
    DataSourceTemplates,
    DataSourceDynamoDBConfig,
} from "../../dataSources/dataSources";
import {
    Edge,
    EdgePrinciple,
} from "../../schemaProcessing/steps/generateArtifacts/extractEdges";
import * as pluralize from "pluralize";

function generateRequestTemplate({
    fieldName,
    fieldType,
    namedType,
    dataSource,
    resolverType,
    edges,
    headerString,
}: {
    fieldName: string;
    namedType: string;
    fieldType: GraphQLField<any, any, any>;
    dataSource: DataSourceTemplate;
    resolverType: string;
    edges: Edge[];
    headerString: string;
}): string | any {
    const dataSourceConfig: DataSourceDynamoDBConfig = dataSource.config as DataSourceDynamoDBConfig;

    const typeEdges: Edge[] = edges
        .map(edge => {
            if (edge.typeName === namedType) {
                return edge;
            }
        })
        .filter(Boolean);

    const edgesArray: string[] = typeEdges.map(edge => `"${edge.field}"`);
    // const edgeIdArray: string[] = typeEdges.map(edge => `"${edge.fieldId}"`);

    // TODO: add nested node creates
    // Max 10 levels nested
    // use the starting edge, to find the counterpoint type, and then the counterpoint field
    // then use the counterpoint type, to futher find nested types
    return `${headerString}

#set($create = [])


#set($rootId = $util.autoId())
#set($createdAt = $util.time.nowEpochMilliSeconds() )
#set($updatedAt = $util.time.nowEpochMilliSeconds() )
#set($createdBy = "Test" )

#set($rootType = "${namedType}")
#set($edgeTypes = ${JSON.stringify(edges)})

#set($rootNode = $context.arguments.create)

${generateRequestNestedCreate(2, 0)}


## Add the root node

## Add the system fields
$util.qr($rootNode.put("id", $rootId))
$util.qr($rootNode.put("linnet:dataType", "Node"))
$util.qr($rootNode.put("linnet:namedType", "${namedType}"))
$util.qr($rootNode.put("createdAt", $createdAt))
$util.qr($rootNode.put("updatedAt", $updatedAt))
$util.qr($rootNode.put("createdBy", $createdBy))

## Now add the node to our create array
$util.qr($create.add($util.dynamodb.toMapValues($rootNode)))

##$util.error($util.toJson($create))

{
  "version" : "2018-05-29",
  "operation" : "BatchPutItem",
  "tables" : {
    "${dataSourceConfig.tableName}": $util.toJson($create)
  }
}
`;
}

function generateResponseTemplate({
    fieldName,
    fieldType,
    namedType,
    dataSource,
    resolverType,
    edges,
    headerString,
}: {
    fieldName: string;
    namedType: string;
    fieldType: GraphQLField<any, any, any>;
    dataSource: DataSourceTemplate;
    resolverType: string;
    edges: Edge[];
    headerString: string;
}): string | any {
    const dataSourceConfig: DataSourceDynamoDBConfig = dataSource.config as DataSourceDynamoDBConfig;

    return `${headerString}

#set($result = $ctx.result.data["${dataSourceConfig.tableName}"])
#set($return = {})
#foreach($item in $result)
  #if(($item["linnet:dataType"] == "Node") && ($item["linnet:namedType"] == "${namedType}"))
  #set($return = $util.map.copyAndRemoveAllKeys($item, $linnetFields))
  #end
#end

$util.toJson($return)
`;
}

function generateRequestNestedCreate(
    // Desired depth
    depth: number = 3,
    // current depth
    nestLevel: number,
): string {
    const currentDepth = nestLevel + 1;
    if (nestLevel > depth) {
        return `## Nest depth limit reached.`;
    }

    let parentType: string;
    let parentId: string;
    let parentContext: string;
    if (nestLevel === 0) {
        parentType = "$rootType";
        parentId = "$rootId";
        parentContext = "$context.arguments.create";
    } else {
        parentType = `$nestedType${nestLevel - 1}`;
        parentId = `$nestedId${nestLevel - 1}`;
        parentContext = `$nestedContext${nestLevel - 1}`;
    }

    const templateString = `
## [ Level: ${nestLevel} ]--------------------------------------------------------------------------
#foreach($edgeType${nestLevel} in $edgeTypes)
  #if($edgeType${nestLevel}.typeName == ${parentType})
    #if(${nestLevel} == 0)
      ## Remove this edge field from the node object
      #set($rootNode = $util.map.copyAndRemoveAllKeys($rootNode, $edgeType${nestLevel}.field))

      #set($nestedContext${nestLevel} = $rootNode)
    #else
      #set($nestedContext${nestLevel} = $nestedContext${nestLevel - 1})
    #end


    ## Get the field for this edge
    #set($edge${nestLevel} = $util.map.copyAndRetainAllKeys($context.arguments.create, $edgeType${nestLevel}.field))

    ## Create with connection via ID
    #if($edge${nestLevel})
      #if($edgeType${nestLevel}.cardinality == "ONE")
        #if($edge${nestLevel}.connection)
          #set($map = {})
          #set($edgeName = $edgeType${nestLevel}.edgeName)

          $util.qr($map.put("createdAt", $createdAt))
          $util.qr($map.put("updatedAt", $updatedAt))
          $util.qr($map.put("createdBy", $createdBy))


          #if($edgeType.principal == "TRUE")
            $util.qr($map.put("id", ${parentId}))
            $util.qr($map.put("linnet:edge", $edge${nestLevel}.connection))
            $util.qr($map.put("linnet:namedType", ${parentType}))
            $util.qr($map.put("linnet:dataType", "$edgeName${nestLevel}::$edge${nestLevel}.connection"))
          #else
            $util.qr($map.put("id", $edge${nestLevel}.connection))
            $util.qr($map.put("linnet:edge", ${parentId}))
            $util.qr($map.put("linnet:namedType", $edgeType${nestLevel}.counterpart))
            $util.qr($map.put("linnet:dataType", "$edgeName::${parentId}"))
          #end

          $util.qr(
            $create.add(
              $util.dynamodb.toMapValues($map)
              )
          )
        #end
        #if($edge${nestLevel}.create)
          #set($nestedType${nestLevel} = $edgeType${nestLevel}.counterpart.type)
          #set($nestedNode${nestLevel} = $edgeType${nestLevel}.counterpart.type)

          $util.qr($nestedNode${nestLevel}.put("id", ${parentId}))
          $util.qr($nestedNode${nestLevel}.put("linnet:dataType", "Node"))
          $util.qr($nestedNode${nestLevel}.put("linnet:namedType", $nestedType${nestLevel}))
          $util.qr($nestedNode${nestLevel}.put("createdAt", $createdAt))
          $util.qr($nestedNode${nestLevel}.put("updatedAt", $updatedAt))
          $util.qr($nestedNode${nestLevel}.put("createdBy", $createdBy))

          ## Now add the node to our create array
          $util.qr($create.add($util.dynamodb.toMapValues($nestedNode${nestLevel})))

          ${generateRequestNestedCreate(depth, currentDepth)}

        #end
      #elseif($edgeType${nestLevel}.cardinality == "MANY")
        #if($edge${nestLevel}.connection)
          #foreach($edgeId in $edge${nestLevel}.connection)
            #set($map = {})
            #set($edgeName = $edgeType${nestLevel}.edgeName)

            $util.qr($map.put("createdAt", $createdAt))
            $util.qr($map.put("updatedAt", $updatedAt))
            $util.qr($map.put("createdBy", $createdBy))

            #if($edgeType.principal == "TRUE")
              $util.qr($map.put("id", ${parentId}))
              $util.qr($map.put("linnet:edge", $edgeId))
              $util.qr($map.put("linnet:namedType", ${parentType}))
              $util.qr($map.put("linnet:dataType", "$edgeName::${parentId}"))
            #else
              $util.qr($map.put("id", $edgeId))
              $util.qr($map.put("linnet:edge", ${parentId}))
              $util.qr($map.put("linnet:namedType", $edgeType${nestLevel}.counterpart))
              $util.qr($map.put("linnet:dataType", "$edgeName::${parentId}"))
            #end

            $util.qr(
              $create.add(
                $util.dynamodb.toMapValues($map)
                )
            )
          #end
        #end
        #if($edge${nestLevel}.create)
          #set($nestedType${nestLevel} = $edgeType.counterpart.type)
          #foreach($nestedCreate${nestLevel} in $edge.create)
            ${generateRequestNestedCreate(depth, currentDepth)}
          #end
        #end
      #end
    #end
  #end
#end
## [ END level: ${nestLevel} ]----------------------------------------------------------------------
`;
    const templateStringLines = templateString.split("\n");
    const templateStringPadded = templateStringLines
        .map((line: string) => {
            const indent = Array(currentDepth + 2)
                .fill(" ")
                .join(" ");
            return `${indent}${line}`;
        })
        .join("\n");

    return templateStringPadded;
}

export { generateRequestTemplate, generateResponseTemplate };
