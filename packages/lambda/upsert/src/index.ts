import {
    Context,
    S3Event,
    S3EventRecord,
    SNSEvent,
    SNSEventRecord,
    SNSMessage,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk-core";

import { HandlerEvent, Edge, DataSourceDynamoDBConfig } from "linnet";

/**
 * Handle the incoming lambda event
 * @param event
 * @param context
 */
async function handler(event: HandlerEvent, context: Context) {
    const segment = AWSXRay.getSegment();
    const subsegment = segment.addNewSubsegment("handler");
    try {
        // Xray Tracing
        // subsegment.addAnnotation("Environment", process.env["ENV"]);
        subsegment.addAnnotation("NamedType", event.namedType);
        subsegment.addAnnotation("ResolverType", "create");
        AWSXRay.capturePromise();

        // console.log(JSON.stringify(event));

        // Process the event
        const result: any = await processEvent({
            segment,
            linnetFields: event.linnetFields,
            dataSource: event.dataSource,
            namedType: event.namedType,
            args: event.context.arguments,
            source: event.context.source,
        });

        // Close the subsegment and return the result
        subsegment.close();
        context.succeed(result);
    } catch (error) {
        console.error("handler", error.message);
        subsegment.addError(error.message, false);
        context.fail(error);
        subsegment.close();
    }
}

/**
 * Process the Upsert Resolver event, and return the result
 * @param options
 */
async function processEvent({
    segment,
    linnetFields,
    dataSource,
    namedType,
    args,
    source,
}: {
    segment: any;
    linnetFields: string[];
    dataSource: DataSourceDynamoDBConfig;
    namedType: string;
    args: {
        [key: string]: any;
    };
    source: any;
}): Promise<any> {
    const subsegment = segment.addNewSubsegment("processEvent");
    try {
    } catch (error) {
        console.error("processEvent", error.message);
        subsegment.addError(error.message, false);
        subsegment.close();
        throw error;
    }
}

export { handler, HandlerEvent, Edge, DataSourceDynamoDBConfig };
