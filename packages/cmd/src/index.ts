import * as program from "commander";
import { upsert } from "./commands/upsert";
import * as Ora from "ora";
import { DataSourceDynamoDBConfig } from "./tasks/schema/dataSources/dataSources";
import {
    Edge,
    EdgePrinciple,
} from "./tasks/schema/schemaProcessing/steps/generateArtifacts/extractEdges";

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

const pkg = require("../package.json");

// [ CLI Metadata ]------------------------------------------------
program
    .version(pkg.version)
    .description(pkg.description)
    .name(pkg.name)
    .option(
        "-p, --profile [profile]",
        "The name of the profile to assume in ~/.aws/credentials",
    )
    .option(
        "-r, --region [region]",
        "The region to deploy this AppSync API into.",
    )
    .option("-v, --verbose", "Verbose output", null, false);

// [ Upsert ]-------------------------------------------------------------------
program
    .command("upsert [name]")
    .option(
        "-e, --environment [environment]",
        "The enviroment key defined in your config",
    )
    .option("-c, --config-file [configFile]", "Path to your config.yml")
    .action(async (name, options) => {
        try {
            const spinner = Ora();
            const result = await upsert({
                verbose: options.parent.verbose,
                configFile: options.configFile,
                environment: options.environment,
                profile: options.parent.profile,
                region: options.region,
            });
            spinner.stop();
            return result;
        } catch (error) {
            console.error(error.stack);
        }
    });

program.parse(process.argv);

export {
    HandlerEvent,
    CreateInput,
    Edge,
    EdgePrinciple,
    DataSourceDynamoDBConfig,
};
