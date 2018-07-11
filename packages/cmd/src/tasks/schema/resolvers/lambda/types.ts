import { DataSourceDynamoDBConfig } from "../../dataSources/dataSources";
import { Edge } from "../../schemaProcessing/steps/generateArtifacts/extractEdges";

type CreateInput = {
  data?: {
    [key: string]: any;
  };
  connections?: string[];
};

type UpsertInput = {
  data?: {
    [key: string]: any;
  };
  connections?: string[];
};

type UpdateInput = {
  data?: {
    [key: string]: any;
  };
  connections?: string[];
  where: {
    ids: string[];
  };
};

type UpdateManyInput = {
  data?: {
    [key: string]: any;
  };
  connections?: string[];
  where: {
    ids: string[];
  };
};

type DeleteInput = {
  data?: {
    [key: string]: any;
  };
  connections?: string[];
  where: {
    ids: string[];
  };
};

type DeleteManyInput = {
  data?: {
    [key: string]: any;
  };
  connections?: string[];
  where: {
    ids: string[];
  };
};

type HandlerEvent = {
  linnetFields: string[];
  dataSource: DataSourceDynamoDBConfig;
  namedType: string;
  edgeTypes: Edge[];
  context: {
    arguments:
      | CreateInput
      | UpsertInput
      | UpdateInput
      | UpdateManyInput
      | DeleteInput
      | DeleteManyInput
      | any;
    result: any;
    source: any;
  };
};

export {
  CreateInput,
  UpsertInput,
  UpdateInput,
  UpdateManyInput,
  DeleteInput,
  DeleteManyInput,
  HandlerEvent,
};
