import * as process from "process";
import { Observable, Subscriber } from "rxjs";
import { TaskContext, Config } from "../common/types";
import { ListrTaskWrapper } from "listr";
import * as AWS from "aws-sdk";
import * as ini from "ini";
import * as path from "path";
import * as fs from "fs";

import * as readlineSync from "readline-sync";

const pkg = require("../../../package.json");

/**
 * @param options
 */
function assumeRoleTask({
    profile,
    context,
    task,
}: {
    profile: string;
    context: TaskContext;
    task: ListrTaskWrapper;
}): Observable<any> {
    return new Observable(observer => {
        async function run() {
            const { credentials, role } = await assumeRole({
                profile,
                observer,
            });
            AWS.config.credentials = credentials;
            context.role = role;
        }

        run().then(() => observer.complete(), e => observer.error(e));
    });
}

async function assumeRole({
    profile,
    observer,
}: {
    profile: string;
    observer: Subscriber<any>;
}): Promise<{
    credentials: AWS.Credentials;
    role: string;
}> {
    try {
        if (typeof profile === "string") {
            let config = AWS.config;
            let credentials;
            let region;

            const credentialsFilePath = path.join(
                process.env["HOME"],
                ".aws/credentials",
            );

            const credentialsFile = fs.readFileSync(
                credentialsFilePath,
                "utf-8",
            );

            const sharedCredentialsIni = ini.parse(credentialsFile);
            if (sharedCredentialsIni[profile] === "undefined") {
                throw new Error(
                    `No profile named: ${profile} found in ~/.aws/credentials`,
                );
            }

            // Load the profile and optionally source_profile
            const credentialsProfile = sharedCredentialsIni[profile];
            if (credentialsProfile.source_profile) {
                if (
                    sharedCredentialsIni[credentialsProfile.source_profile] ===
                    "undefined"
                ) {
                    throw new Error(
                        `Cannot find source_profile: ${
                            credentialsProfile.source_profile
                        } for profile: ${profile} in ~/.aws/credentials`,
                    );
                }
                const sourceProfile =
                    sharedCredentialsIni[credentialsProfile.source_profile];
                region = credentialsProfile.region;

                credentials = new AWS.Credentials(
                    sourceProfile.aws_access_key_id,
                    sourceProfile.aws_secret_access_key,
                );
            } else if (
                credentialsProfile.aws_access_key &&
                credentialsProfile.aws_secret_access_key
            ) {
                region = credentialsProfile.region;
                credentials = new AWS.Credentials(
                    credentialsProfile.aws_access_key,
                    credentialsProfile.aws_secret_access_key,
                );
            }

            let tokenCode;
            // Read the token from the user
            if (credentialsProfile.mfa_serial) {
                tokenCode = readlineSync.question(
                    `Enter MFA token for ${credentialsProfile.mfa_serial}: `,
                    {
                        hideEchoBack: true,
                        mask: "",
                        limitMessage: "Please enter 6 digits.",
                        history: false,
                        min: 6,
                        max: 6,
                        keepWhitespace: false,
                    },
                );
            }

            observer.next(`Assuming role: ${credentialsProfile.role_arn}`);

            const assumeRoleParams: AWS.STS.AssumeRoleRequest = {
                RoleArn: credentialsProfile.role_arn,
                RoleSessionName: pkg.name,
                TokenCode: tokenCode,
                DurationSeconds: 2000,
                SerialNumber: credentialsProfile.mfa_serial
                    ? credentialsProfile.mfa_serial
                    : null,
            };

            const temporaryCredentials = new AWS.TemporaryCredentials(
                assumeRoleParams,
                credentials,
            );
            await temporaryCredentials.getPromise();
            AWS.config.update({
                ...temporaryCredentials,
                ...region,
            });
            return {
                credentials: temporaryCredentials,
                role: credentialsProfile.role_arn,
            };
        }
    } catch (error) {
        throw error;
    }
}

export { assumeRoleTask };
