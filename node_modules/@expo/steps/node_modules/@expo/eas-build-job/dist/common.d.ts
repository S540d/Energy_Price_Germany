import Joi from 'joi';
import { z } from 'zod';
import { BuildPhase, BuildPhaseResult } from './logs';
export declare enum BuildMode {
    BUILD = "build",
    RESIGN = "resign",
    CUSTOM = "custom",
    REPACK = "repack"
}
export declare enum Workflow {
    GENERIC = "generic",
    MANAGED = "managed",
    UNKNOWN = "unknown"
}
export declare enum Platform {
    ANDROID = "android",
    IOS = "ios"
}
export declare enum ArchiveSourceType {
    NONE = "NONE",
    URL = "URL",
    PATH = "PATH",
    GCS = "GCS",
    GIT = "GIT",
    R2 = "R2"
}
export declare enum BuildTrigger {
    EAS_CLI = "EAS_CLI",
    GIT_BASED_INTEGRATION = "GIT_BASED_INTEGRATION"
}
export type ArchiveSource = {
    type: ArchiveSourceType.NONE;
} | {
    type: ArchiveSourceType.GCS;
    bucketKey: string;
    metadataLocation?: string;
} | {
    type: ArchiveSourceType.R2;
    bucketKey: string;
} | {
    type: ArchiveSourceType.URL;
    url: string;
} | {
    type: ArchiveSourceType.PATH;
    path: string;
} | {
    type: ArchiveSourceType.GIT;
    /**
     * Url that can be used to clone repository.
     * It should contain embedded credentials for private registries.
     */
    repositoryUrl: string;
    /** A Git ref - points to a branch head, tag head or a branch name. */
    gitRef: string | null;
    /**
     * Git commit hash.
     */
    gitCommitHash: string;
};
export declare const ArchiveSourceSchema: Joi.ObjectSchema<ArchiveSource>;
export declare const ArchiveSourceSchemaZ: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<ArchiveSourceType.GIT>;
    repositoryUrl: z.ZodString;
    gitRef: z.ZodNullable<z.ZodString>;
    gitCommitHash: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<ArchiveSourceType.PATH>;
    path: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<ArchiveSourceType.URL>;
    url: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<ArchiveSourceType.GCS>;
    bucketKey: z.ZodString;
    metadataLocation: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "type">;
export type Env = Record<string, string>;
export declare const EnvSchema: Joi.ObjectSchema<any>;
export type EnvironmentSecret = {
    name: string;
    type: EnvironmentSecretType;
    value: string;
};
export declare enum EnvironmentSecretType {
    STRING = "string",
    FILE = "file"
}
export declare const EnvironmentSecretsSchema: Joi.ArraySchema<any[]>;
export declare const EnvironmentSecretZ: z.ZodObject<{
    name: z.ZodString;
    value: z.ZodString;
    type: z.ZodEnum<typeof EnvironmentSecretType>;
}, z.core.$strip>;
export interface Cache {
    disabled: boolean;
    clear: boolean;
    key?: string;
    /**
     * @deprecated We don't cache anything by default anymore.
     */
    cacheDefaultPaths?: boolean;
    /**
     * @deprecated We use paths now since there is no default caching anymore.
     */
    customPaths?: string[];
    paths: string[];
}
export declare const CacheSchema: Joi.ObjectSchema<any>;
export interface BuildPhaseStats {
    buildPhase: BuildPhase;
    result: BuildPhaseResult;
    durationMs: number;
}
export declare const StaticWorkflowInterpolationContextZ: z.ZodObject<{
    after: z.ZodRecord<z.ZodString, z.ZodObject<{
        status: z.ZodString;
        outputs: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    needs: z.ZodRecord<z.ZodString, z.ZodObject<{
        status: z.ZodString;
        outputs: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    inputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    github: z.ZodOptional<z.ZodObject<{
        triggering_actor: z.ZodOptional<z.ZodString>;
        event_name: z.ZodEnum<{
            push: "push";
            pull_request: "pull_request";
            workflow_dispatch: "workflow_dispatch";
            schedule: "schedule";
        }>;
        sha: z.ZodString;
        ref: z.ZodString;
        ref_name: z.ZodString;
        ref_type: z.ZodString;
        commit_message: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        repository: z.ZodOptional<z.ZodString>;
        repository_owner: z.ZodOptional<z.ZodString>;
        event: z.ZodOptional<z.ZodObject<{
            label: z.ZodOptional<z.ZodObject<{
                name: z.ZodString;
            }, z.core.$strip>>;
            head_commit: z.ZodOptional<z.ZodObject<{
                message: z.ZodString;
                id: z.ZodString;
            }, z.core.$strip>>;
            pull_request: z.ZodOptional<z.ZodObject<{
                number: z.ZodNumber;
            }, z.core.$strip>>;
            number: z.ZodOptional<z.ZodNumber>;
            schedule: z.ZodOptional<z.ZodString>;
            inputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    workflow: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        filename: z.ZodString;
        url: z.ZodString;
    }, z.core.$loose>;
}, z.core.$strip>;
export type StaticWorkflowInterpolationContext = z.infer<typeof StaticWorkflowInterpolationContextZ>;
export type DynamicInterpolationContext = {
    env: Record<string, string | undefined>;
    success: () => boolean;
    failure: () => boolean;
    always: () => boolean;
    never: () => boolean;
    fromJSON: (value: string) => unknown;
    toJSON: (value: unknown) => string;
    contains: (value: string, substring: string) => boolean;
    startsWith: (value: string, prefix: string) => boolean;
    endsWith: (value: string, suffix: string) => boolean;
};
export type WorkflowInterpolationContext = StaticWorkflowInterpolationContext & DynamicInterpolationContext;
export declare const CustomBuildConfigSchema: Joi.ObjectSchema<any>;
