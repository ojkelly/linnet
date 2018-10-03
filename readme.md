# Linnet

## Getting Started

Clone this repo

Run to upsert:

```
$ linnet yarn cli upsert --config-file config.yml --environment development --profile {profile} --verbose
```

This currently does not output CloudFormation stacks, though that is the end goal.

# Documentation

## Performance

Linnet's goal is to be the most performant serverless GraphQL layer for AWS.

To achieve this we use the built-in DynamoDB resolvers for all `Query` operations. This provides
the fastest, most reliable resolver for the most time sensitive situations.

Mutations require advanced logic that cannot be implemented in the DynamoDB resolvers, and Go Lambda
resolvers are used instead. These are still incredibly fast in most situations.

## DynamoDB Specific Considerations

## Datamodel

Linnet uses an item for each `Node` and `Edge`. As items in DynamoDB have a limit of 400 KB, you
need to ensure you seperate out your data into a relational structure that prevents your Node from
reaching 400 KB.

In practical terms, you'll unlikely reach the 400 KB limit. However it's useful to be aware of it
when you first design your GraphQL Schema.

There is no limit on the number of items in a DynamoDB Table.

### Scans

Currenlty Linnet does not use `scan` for anything, and theres no intention to change that. In fact,
we actively avoid `scan`. It's our opinion that there will never be a situation that requires it,
that also falls into the scope of Linnet. And that, due to the expense of using `scan` it should
be left up to the developers using Linnet as part of their application to use `scan` in a Lambda
alongside Linnet. It's because of this, that we will actively prevent `scan` from being introduced
into Linnet.on.

## Indexes

Linnet's datamodel requires the use of two [Global Secondary Indexes]() `namedType-id` and
`edge-dataType`, to faciliate the efficient quering of related `Nodes`.

## Queries

The nature of DynamoDB limits us to selecting nodes by their `id`. This is because the only primary
key, and indexed value we can search efficiently is the node's `id`.

Once you have a node's id, you can retrieve all of it's fields, and more importantly it's connected
nodes (nodes with an edge/relation). And when returning node's with a connection, you can filter on them.

Filtering happens in DynamoDB, after nodes have been selected, but before they are returned.

For example: if you needed to select all `Invoices` for a `Customer`, that are currently `UNPAID`
you would use the following:

```graphql
query getUnpaidInvoices($customerID: !ID){
  Customer(
    where: {
      id: $customerID
    }
  ) {
    id
    invoices(
      where: {
        status
      }
    ) {
      # number of nodes that match our filter
      count
      # This is how many nodes there are before filtering
      scannedCount
      # edges contain the connected nodes
      edges{
        id
        dueDate
        status
      }
      # If the result is paginated, you can pass this to get the
      # next page of results
      nextToken
    }
  }
}
```

Because we needed to start at the `Customer` in order to access the `Invoices` we wanted, we are
inherently limiting the result to only nodes
owned by the customer.

This can be a suprisingly powerful model, but it requires a different way of thinking about your
data.

## Mutations

### Upsert

Upsert's were considered, but considered impractical with DynamoDB. As the main value that can be
used to select a node is the `id`, it's not possible to provide an `upsert` function as would be
possible with a relational database.

This isn't to say `upsert` has been fully written off as a possibility, but it's very unlikely at
this stage. If you have an idea on how to implement it without consuming too much read/write
capacity, I'd love to hear it. Open an issue on Github and let's see if it can work.

### Create

#### Nested Create

For each field on a Node that is registered as an `@edge` in your schema, you can either create or
connect while creating your node.

This means you can create multiple nodes, at multiple layers of nesting.

Depending on the cardinality of the edge (ONE/MANY) you can either pass a single or multiple items
into the `data` key.

#### Connecting existing nodes

> Warning, when connecting to an existing node (as opposed to creating one inline) an additional
> call is made to validate the node exists first. These calls are batched up into batches of 25
> (NOTE, THIS PRE-CHECK IS NOT YET DONE)

### Update

A node to update needs to be selected using `where` and the `id` of the node.

#### Updating Fields

Only the fields with data that needs to be updated, and fields you marked as required need to be
passed with `data`.

#### Updating a connection

To update a field with a related Node, you either need to pass in `data` to create a new node, with
a connection to your parent node. Or you need to pass an array of `IDs` via `connection` to create
new edges.

You can pass either `data`, `connection`, both or null.

#### UpdateMany

### Delete

#### DeleteMany
