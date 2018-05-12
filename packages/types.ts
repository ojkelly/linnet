import { DataSourceDynamoDBConfig } from "./cmd/src/tasks/schema/dataSources/dataSources";
import {
    Edge,
    EdgePrinciple,
} from "./cmd/src/tasks/schema/schemaProcessing/steps/generateArtifacts/extractEdges";

type CreateInput = {
    create?: {
        [key: string]: any;
    };
    connections?: string[];
};

type HandlerEvent = {
    linnetFields: string[];
    dataSource: DataSourceDynamoDBConfig;
    namedType: string;
    edgeTypes: Edge[];
    context: {
        arguments: CreateInput | any;
        result: any;
        source: any;
    };
};

export {
    HandlerEvent,
    CreateInput,
    Edge,
    EdgePrinciple,
    DataSourceDynamoDBConfig,
};
