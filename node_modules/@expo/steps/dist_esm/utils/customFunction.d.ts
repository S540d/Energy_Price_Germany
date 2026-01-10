import { BuildStepFunction } from '../BuildStep.js';
import { BuildStepEnv } from '../BuildStepEnv.js';
import { SerializedBuildStepOutput } from '../BuildStepOutput.js';
import { SerializedBuildStepContext } from '../BuildStepContext.js';
export declare const SCRIPTS_PATH: string;
type SerializedBuildStepInput = {
    serializedValue: string | undefined;
};
export interface SerializedCustomBuildFunctionArguments {
    env: BuildStepEnv;
    inputs: Record<string, SerializedBuildStepInput>;
    outputs: Record<string, SerializedBuildStepOutput>;
    ctx: SerializedBuildStepContext;
}
export declare function serializeInputs(inputs: Parameters<BuildStepFunction>[1]['inputs']): SerializedCustomBuildFunctionArguments['inputs'];
export declare function deserializeInputs(inputs: SerializedCustomBuildFunctionArguments['inputs']): Parameters<BuildStepFunction>[1]['inputs'];
export declare function createCustomFunctionCall(rawCustomFunctionModulePath: string): BuildStepFunction;
export {};
