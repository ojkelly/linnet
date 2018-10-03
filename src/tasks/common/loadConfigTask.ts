import * as path from "path";
import { ListrTaskWrapper } from "listr";
import * as yaml from "js-yaml";
import * as fs from "fs";

import { Config, TaskContext } from "./types";

function loadConfigTask({
    context,
    task,
    configFile,
    environment,
    verbose,
}: {
    context: TaskContext;
    task: ListrTaskWrapper;
    configFile: string;
    environment: string;
    verbose: boolean;
}): Promise<any> {
    try {
        const configPath = path.resolve(configFile);
        const configPathParsed = path.parse(configPath);

        // Load config file
        const configYaml = yaml.safeLoad(fs.readFileSync(configPath, "utf8"));
        const config: Config = configYaml[environment];
        config.environment = environment;

        if (typeof config.verbose === "undefined") config.verbose = verbose;

        context.configPath = configPath;
        context.config = config;
        context.environment = environment;
        context.schema = {};
        return;
    } catch (error) {
        throw error;
    }
}

export { loadConfigTask };
