# Tibicen

From a folder of graphql files, create a schema.

Add that schema to Appsync.

Automatically generate resolver templates, save them next to your schema.

Allow you to overwrite the resolver mappings.

https://github.com/maddijoyce/maddis-aws-tools/blob/master

TODO

TODO: Add resolver to relationship fields

DynamoDB nodes

Where a top level type is marked with a directive of @node(dataSource: "DynamoDB"), a table will
be created for that Type. Any nested fields will be stored on the parent node.

Unless the nested field has a @relation(name:'EventOnTimeline', dataSource: 'TimelineTable'), in which
case an id will be stored. The related item must have an @node directive and have it's own datasource.

If you link types together in without a relation field, they will be stored underneath the parent node.
These types are stored as attributes on the parent node, and need to expose filtering options in their
query.

Note the 400kb max item size.

For @relation's across DynamoDB tables, the id field for the type is added as a Global Secondary Index.

For a one (A) to many table (B) the keys are as follows

```
A:
- hash: uuid
- sort: updatedAt (for versioning)
- attribute: <relationName> = map of relation Id's

B:
- hash: uuid
- sort: A.uuid
```

For many (A) to many (A) - (maybe best to avoid?)

```
A:
- hash: uuid
- sort: updatedAt (for versioning)
- attribute: <relationName> = map of relation Id's


B:
- hash: uuid
- sort: updatedAt (for versioning)
```

One table for `@node()`

one table for edges (an adjanency list)

When a Type.field returns a non-scalar type it's a relationship. It must have an `@relation(name)`
directive, where `name` is the name of the vertex.

the node table stores all nodes

the verticies table stores all `@relation` with a hash key of the relation.name?

---

One table for all Nodes
Hash: autoId
Range: ??

N-edges

GSI for adjancency list
Hash: id from node
Range: `${edgeName}:${edgeNodeId}`

```
Order: {
  id: 1
  name: 'My Order',
  products: [
    {
      id: 2
      name: 'Product One'
    },
    {
      id: 3,
      name: 'Product Two'
    }
  ]
}
```

Table: Node

The value of the edge field, is the name of the edge

_For put, this relies on being able to generate a uuid outside of dynamodb, in appsync, and only writing,
if that id does not exist_

| hash (ID) | range (fieldName) | Relation | Name        |
| --------- | ----------------- | -------- | ----------- |
| 1         | node              |          | My Order    |
| 1         | ProductsOnOrder:2 | 2        |             |
| 1         | ProductsOnOrder:3 | 3        |             |
| 2         | node              |          | Product One |
| 2         | ProductsOnOrder:1 | 1        |             |
| 3         | node              |          | Product Two |
| 3         | ProductsOnOrder:1 | 1        |             |

Table: Adjancency/Tripestore

| hash (nodeId) | range (edgeName)  | edge |
| ------------- | ----------------- | ---- |
| 1             | ProductsOnOrder:2 | 2    |
| 1             | ProductsOnOrder:3 | 3    |
| 2             | OrderOnProduct:1  | 1    |
| 3             | OrderOnProduct:1  | 1    |

GSI (would work if i can extract edges with the same name each way)

| hash (edge) | range (edgeName) | nodeId |
| ----------- | ---------------- | ------ |
| 2           | ProductsOnOrder  | 1      |

query with sort key begins_with `edgeName:*` and hash key as the other vertex

creating would need the addtion of 2 items for the

Create resolver would be a BatchWriteItem

*   update node in table
*   update adjacency list: ProductsOnOrder
*   update adjacency list: OrderOnProduct

If the batch write partially fails for eg provisioned throughput, it's up to the client to retry the write

Named for the https://en.wikipedia.org/wiki/Common_linnet


Connection contains edges.


## Caveats

Linnet uses DynamoDB a serverless NoSQL database. While this provides potential cost savings and
performance over a relational database, there are some caveats.

**Nested Mutations** - Unsupported

DynamoDB offers not guarentee of atomicity, or transactions. If we try to create multiple items
there is the possibility, that one or more of them fail. It's expected the client will handle this.

Therefore we've decided not to support nested mutations. Instead we suggest you create the nodes and
link them with `connections`.
