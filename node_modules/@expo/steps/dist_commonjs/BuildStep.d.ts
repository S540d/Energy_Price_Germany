import { BuildStepContext, BuildStepGlobalContext } from './BuildStepContext.js';
import { BuildStepInput } from './BuildStepInput.js';
import { BuildStepOutput, BuildStepOutputById, SerializedBuildStepOutput } from './BuildStepOutput.js';
import { BuildStepEnv } from './BuildStepEnv.js';
import { BuildRuntimePlatform } from './BuildRuntimePlatform.js';
export declare enum BuildStepStatus {
    NEW = "new",
    IN_PROGRESS = "in-progress",
    SKIPPED = "skipped",
    FAIL = "fail",
    WARNING = "warning",
    SUCCESS = "success"
}
export declare enum BuildStepLogMarker {
    START_STEP = "start-step",
    END_STEP = "end-step"
}
export type BuildStepFunction = (ctx: BuildStepContext, { inputs, outputs, env, }: {
    inputs: {
        [key: string]: {
            value: unknown;
        };
    };
    outputs: BuildStepOutputById;
    env: BuildStepEnv;
}) => unknown;
export interface SerializedBuildStepOutputAccessor {
    id: string;
    executed: boolean;
    outputById: Record<string, SerializedBuildStepOutput>;
    displayName: string;
}
export declare class BuildStepOutputAccessor {
    readonly id: string;
    readonly displayName: string;
    protected readonly executed: boolean;
    protected readonly outputById: BuildStepOutputById;
    constructor(id: string, displayName: string, executed: boolean, outputById: BuildStepOutputById);
    get outputs(): BuildStepOutput[];
    getOutputValueByName(name: string): string | undefined;
    hasOutputParameter(name: string): boolean;
    serialize(): SerializedBuildStepOutputAccessor;
    static deserialize(serialized: SerializedBuildStepOutputAccessor): BuildStepOutputAccessor;
}
export declare class BuildStep extends BuildStepOutputAccessor {
    readonly id: string;
    readonly name?: string;
    readonly displayName: string;
    readonly supportedRuntimePlatforms?: BuildRuntimePlatform[];
    readonly inputs?: BuildStepInput[];
    readonly outputById: BuildStepOutputById;
    readonly command?: string;
    readonly fn?: BuildStepFunction;
    readonly shell: string;
    readonly ctx: BuildStepContext;
    readonly stepEnvOverrides: BuildStepEnv;
    readonly ifCondition?: string;
    status: BuildStepStatus;
    private readonly outputsDir;
    private readonly envsDir;
    private readonly internalId;
    private readonly inputById;
    protected executed: boolean;
    static getNewId(userDefinedId?: string): string;
    static getDisplayName({ id, name, command, }: {
        id: string;
        name?: string;
        command?: string;
    }): string;
    constructor(ctx: BuildStepGlobalContext, { id, name, displayName, inputs, outputs, command, fn, workingDirectory: maybeWorkingDirectory, shell, supportedRuntimePlatforms: maybeSupportedRuntimePlatforms, env, ifCondition, }: {
        id: string;
        name?: string;
        displayName: string;
        inputs?: BuildStepInput[];
        outputs?: BuildStepOutput[];
        command?: string;
        fn?: BuildStepFunction;
        workingDirectory?: string;
        shell?: string;
        supportedRuntimePlatforms?: BuildRuntimePlatform[];
        env?: BuildStepEnv;
        ifCondition?: string;
    });
    executeAsync(): Promise<void>;
    canBeRunOnRuntimePlatform(): boolean;
    shouldExecuteStep(): boolean;
    skip(): void;
    private getInterpolationContext;
    private executeCommandAsync;
    private executeFnAsync;
    private interpolateInputsOutputsAndGlobalContextInTemplate;
    private collectAndValidateOutputsAsync;
    private collectAndUpdateEnvsAsync;
    private getScriptEnv;
}
