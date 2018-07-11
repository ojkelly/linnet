import test from "ava";
import * as util from "util";
import * as AWS from "aws-sdk-mock";
import * as sinon from "sinon";
import * as AWS_SDK from "aws-sdk";
import { Context } from "aws-lambda";
import * as utils from "aws-lambda-test-utils";
import * as context from "aws-lambda-mock-context";
import * as AWSXRay from "aws-xray-sdk-core";
import * as faker from "faker";

import { HandlerEvent, CreateInput, Edge } from "linnet";

import { handler } from "../src/index";

AWS.setSDKInstance(AWS_SDK);
process.env["AWS_XRAY_CONTEXT_MISSING"] = "LOG_ERROR";
process.env["AWS_REGION"] = "ap-southeast-2";
process.env["AWS_DEFAULT_REGION"] = "ap-southeast-2";

const edgeTypes: Edge[] = [
    {
        typeName: "Customer",
        field: "orders",
        fieldType: "Order",
        principal: "TRUE",
        cardinality: "MANY",
        edgeName: "OrdersOnCustomer",
        required: false,
        counterpart: {
            type: "Order",
            field: "customer",
        },
    },
    {
        typeName: "Order",
        field: "customer",
        fieldType: "Customer",
        principal: "FALSE",
        cardinality: "ONE",
        edgeName: "OrdersOnCustomer",
        required: true,
        counterpart: {
            type: "Customer",
            field: "orders",
        },
    },
    {
        typeName: "Order",
        field: "products",
        fieldType: "Product",
        principal: "TRUE",
        cardinality: "MANY",
        edgeName: "ProductsOnOrders",
        required: true,
        counterpart: {
            type: "Product",
            field: "orders",
        },
    },
    {
        typeName: "Product",
        field: "orders",
        fieldType: "Order",
        principal: "FALSE",
        cardinality: "MANY",
        edgeName: "ProductsOnOrders",
        required: false,
        counterpart: {
            type: "Order",
            field: "products",
        },
    },
];

const linnetFields = ["linnet:dataType", "linnet:edge", "linnet:namedType"];

test.afterEach(t => {
    AWS.restore();
});

test("Can create nested items", async t => {
    try {
        // [ Test Preparation ]---------------------------------------------------------------------
        // Many assertions happen in callbacks, so we plan for the correct amount, to ensure
        // the test only passes if they are all called.
        // t.plan(3);

        // Setup a new mock segment for this test
        const segment = new AWSXRay.Segment("test");
        // Setup a namespace for this test
        const ns = AWSXRay.getNamespace();

        // Create the Mock context
        const ctx = context();

        // [ Mock Event ]---------------------------------------------------------------------------
        const dataSource = {
            tableName: `${faker.hacker.adjective()}`,
            awsRegion: "ap-southeast-2",
            useCallerCredentials: false,
        };
        const create: CreateInput = {
            create: {
                name: `${faker.name.firstName()} ${faker.name.lastName()}`,
                address: faker.address.streetAddress(),
                suburb: faker.address.city(),
                postcode: faker.address.zipCode(),
                phoneNumber: faker.phone.phoneNumber(),
                email: faker.internet.email(),
                orders: {
                    // Create Order on Customer
                    create: [
                        {
                            status: "COMPLETE",
                            products: {
                                // Create Products on Order
                                create: [
                                    {
                                        title: faker.commerce.productName(),
                                        description: faker.commerce.productAdjective(),
                                        price: faker.commerce.price(),
                                    },
                                    {
                                        title: faker.commerce.productName(),
                                        description: faker.commerce.productAdjective(),
                                        price: faker.commerce.price(),
                                    },
                                    {
                                        title: faker.commerce.productName(),
                                        description: faker.commerce.productAdjective(),
                                        price: faker.commerce.price(),
                                    },
                                    {
                                        title: faker.commerce.productName(),
                                        description: faker.commerce.productAdjective(),
                                        price: faker.commerce.price(),
                                    },
                                    {
                                        title: faker.commerce.productName(),
                                        description: faker.commerce.productAdjective(),
                                        price: faker.commerce.price(),
                                    },
                                ],
                            },
                            price: faker.commerce.price(),
                            paid: true,
                        },
                    ],
                },
            },
            connections: [],
        };

        const lambdaEvent = {
            linnetFields,
            dataSource,
            namedType: "Customer",
            edgeTypes,
            context: {
                // arguments: create,
                arguments: create,
                identity: null,
                source: null,
                result: null,
                request: {
                    headers: {
                        "x-forwarded-for": "14.200.225.149, 54.239.202.78",
                        "accept-encoding": "gzip, deflate",
                        connection: "keep-alive",
                        "cloudfront-is-tablet-viewer": "false",
                        "cloudfront-viewer-country": "AU",
                        via:
                            "2.0 8d06e892dffabc9924f753ab15381674.cloudfront.net (CloudFront)",
                        "x-api-key": "da2-vuklmyqehfaxndcshzhxqveddm",
                        "cloudfront-forwarded-proto": "https",
                        "content-type": "application/json",
                        origin: "null",
                        "x-amz-cf-id":
                            "IQZcyHT51brvRoBBogIbNI6kaWfXqMUr35-m9C0B5xifrbbQucvgHQ==",
                        "content-length": "441",
                        "x-forwarded-proto": "https",
                        host:
                            "h7qdy5kvtnfnjpckhlupn3h2fu.appsync-api.ap-southeast-2.amazonaws.com",
                        "accept-language": "en-GB",
                        "user-agent":
                            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) GraphQLPlayground/1.5.7 Chrome/59.0.3071.115 Electron/1.8.1 Safari/537.36",
                        "cloudfront-is-desktop-viewer": "true",
                        accept: "*/*",
                        "cloudfront-is-mobile-viewer": "false",
                        "x-forwarded-port": "443",
                        "cloudfront-is-smarttv-viewer": "false",
                    },
                },
                error: null,
                outErrors: [],
            },
        };

        // [ Mock AWS ]-----------------------------------------------------------------------------
        AWS.mock("DynamoDB", "batchWriteItem", (params, callback) => {
            callback(null, {
                Table: [],
            });
        });

        // [ Run the lambda ]-----------------------------------------------------------------------
        // Add the segment to this namespace
        ns.run(() => {
            // Run this namespace with our segment
            AWSXRay.setSegment(segment);
            // Setup our handler
            handler(lambdaEvent, ctx);
        });
        // Wait for the result of the lambda call
        const result = await ctx.Promise;
        // If no exception is throw, pass the test
        t.pass();
    } catch (err) {
        t.log(err.message);
        t.log(err.stack);
        //=> fail() called
        t.fail(err);
    }
});
