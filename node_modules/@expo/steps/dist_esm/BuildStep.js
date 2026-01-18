import assert from 'assert';
import fs from 'fs/promises';
import path from 'path';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import { makeBuildStepInputByIdMap } from './BuildStepInput.js';
import { BuildStepOutput, makeBuildStepOutputByIdMap, } from './BuildStepOutput.js';
import { BIN_PATH } from './utils/shell/bin.js';
import { getDefaultShell, getShellCommandAndArgs } from './utils/shell/command.js';
import { cleanUpStepTemporaryDirectoriesAsync, getTemporaryEnvsDirPath, getTemporaryOutputsDirPath, saveScriptToTemporaryFileAsync, } from './BuildTemporaryFiles.js';
import { spawnAsync } from './utils/shell/spawn.js';
import { interpolateWithInputs, interpolateWithOutputs } from './utils/template.js';
import { BuildStepRuntimeError } from './errors.js';
import { jsepEval } from './utils/jsepEval.js';
import { interpolateJobContext } from './interpolation.js';
export var BuildStepStatus;
(function (BuildStepStatus) {
    BuildStepStatus["NEW"] = "new";
    BuildStepStatus["IN_PROGRESS"] = "in-progress";
    BuildStepStatus["SKIPPED"] = "skipped";
    BuildStepStatus["FAIL"] = "fail";
    BuildStepStatus["WARNING"] = "warning";
    BuildStepStatus["SUCCESS"] = "success";
})(BuildStepStatus || (BuildStepStatus = {}));
export var BuildStepLogMarker;
(function (BuildStepLogMarker) {
    BuildStepLogMarker["START_STEP"] = "start-step";
    BuildStepLogMarker["END_STEP"] = "end-step";
})(BuildStepLogMarker || (BuildStepLogMarker = {}));
// TODO: move to a place common with tests
const UUID_REGEX = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
export class BuildStepOutputAccessor {
    constructor(id, displayName, executed, outputById) {
        this.id = id;
        this.displayName = displayName;
        this.executed = executed;
        this.outputById = outputById;
    }
    get outputs() {
        return Object.values(this.outputById);
    }
    getOutputValueByName(name) {
        if (!this.executed) {
            throw new BuildStepRuntimeError(`Failed getting output "${name}" from step "${this.displayName}". The step has not been executed yet.`);
        }
        if (!this.hasOutputParameter(name)) {
            throw new BuildStepRuntimeError(`Step "${this.displayName}" does not have output "${name}".`);
        }
        return this.outputById[name].value;
    }
    hasOutputParameter(name) {
        return name in this.outputById;
    }
    serialize() {
        return {
            id: this.id,
            executed: this.executed,
            outputById: Object.fromEntries(Object.entries(this.outputById).map(([key, value]) => [key, value.serialize()])),
            displayName: this.displayName,
        };
    }
    static deserialize(serialized) {
        const outputById = Object.fromEntries(Object.entries(serialized.outputById).map(([key, value]) => [
            key,
            BuildStepOutput.deserialize(value),
        ]));
        return new BuildStepOutputAccessor(serialized.id, serialized.displayName, serialized.executed, outputById);
    }
}
export class BuildStep extends BuildStepOutputAccessor {
    static getNewId(userDefinedId) {
        return userDefinedId !== null && userDefinedId !== void 0 ? userDefinedId : uuidv4();
    }
    static getDisplayName({ id, name, command, }) {
        if (name) {
            return name;
        }
        if (!id.match(UUID_REGEX)) {
            return id;
        }
        if (command) {
            const splits = command.trim().split('\n');
            for (const split of splits) {
                const trimmed = split.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    return trimmed;
                }
            }
        }
        return id;
    }
    constructor(ctx, { id, name, displayName, inputs, outputs, command, fn, workingDirectory: maybeWorkingDirectory, shell, supportedRuntimePlatforms: maybeSupportedRuntimePlatforms, env, ifCondition, }) {
        assert(command !== undefined || fn !== undefined, 'Either command or fn must be defined.');
        assert(!(command !== undefined && fn !== undefined), 'Command and fn cannot be both set.');
        const outputById = makeBuildStepOutputByIdMap(outputs);
        super(id, displayName, false, outputById);
        this.executed = false;
        this.id = id;
        this.name = name;
        this.displayName = displayName;
        this.supportedRuntimePlatforms = maybeSupportedRuntimePlatforms;
        this.inputs = inputs;
        this.inputById = makeBuildStepInputByIdMap(inputs);
        this.outputById = outputById;
        this.fn = fn;
        this.command = command;
        this.shell = shell !== null && shell !== void 0 ? shell : getDefaultShell();
        this.ifCondition = ifCondition;
        this.status = BuildStepStatus.NEW;
        this.internalId = uuidv4();
        const logger = ctx.baseLogger.child({
            buildStepInternalId: this.internalId,
            buildStepId: this.id,
            buildStepDisplayName: this.displayName,
        });
        this.ctx = ctx.stepCtx({ logger, relativeWorkingDirectory: maybeWorkingDirectory });
        this.stepEnvOverrides = env !== null && env !== void 0 ? env : {};
        this.outputsDir = getTemporaryOutputsDirPath(ctx, this.id);
        this.envsDir = getTemporaryEnvsDirPath(ctx, this.id);
        ctx.registerStep(this);
    }
    async executeAsync() {
        try {
            this.ctx.logger.info({ marker: BuildStepLogMarker.START_STEP }, `Executing build step "${this.displayName}"`);
            this.status = BuildStepStatus.IN_PROGRESS;
            await fs.mkdir(this.outputsDir, { recursive: true });
            this.ctx.logger.debug(`Created temporary directory for step outputs: ${this.outputsDir}`);
            await fs.mkdir(this.envsDir, { recursive: true });
            this.ctx.logger.debug(`Created temporary directory for step environment variables: ${this.envsDir}`);
            if (this.command !== undefined) {
                await this.executeCommandAsync();
            }
            else {
                await this.executeFnAsync();
            }
            this.ctx.logger.info({ marker: BuildStepLogMarker.END_STEP, result: BuildStepStatus.SUCCESS }, `Finished build step "${this.displayName}" successfully`);
            this.status = BuildStepStatus.SUCCESS;
        }
        catch (err) {
            this.ctx.logger.error({ err });
            this.ctx.logger.error({ marker: BuildStepLogMarker.END_STEP, result: BuildStepStatus.FAIL }, `Build step "${this.displayName}" failed`);
            this.status = BuildStepStatus.FAIL;
            throw err;
        }
        finally {
            this.executed = true;
            try {
                await this.collectAndValidateOutputsAsync(this.outputsDir);
                await this.collectAndUpdateEnvsAsync(this.envsDir);
                this.ctx.logger.debug('Finished collecting output parameters');
            }
            catch (error) {
                // If the step succeeded, we expect the outputs to be collected successfully.
                if (this.status === BuildStepStatus.SUCCESS) {
                    throw error;
                }
                this.ctx.logger.debug({ err: error }, 'Failed to collect output parameters');
            }
            await cleanUpStepTemporaryDirectoriesAsync(this.ctx.global, this.id);
        }
    }
    canBeRunOnRuntimePlatform() {
        return (!this.supportedRuntimePlatforms ||
            this.supportedRuntimePlatforms.includes(this.ctx.global.runtimePlatform));
    }
    shouldExecuteStep() {
        var _a, _b;
        const hasAnyPreviousStepFailed = this.ctx.global.hasAnyPreviousStepFailed;
        if (!this.ifCondition) {
            return !hasAnyPreviousStepFailed;
        }
        let ifCondition = this.ifCondition;
        if (ifCondition.startsWith('${{') && ifCondition.endsWith('}}')) {
            ifCondition = ifCondition.slice(3, -2);
        }
        else if (ifCondition.startsWith('${') && ifCondition.endsWith('}')) {
            ifCondition = ifCondition.slice(2, -1);
        }
        return Boolean(jsepEval(ifCondition, {
            inputs: (_b = (_a = this.inputs) === null || _a === void 0 ? void 0 : _a.reduce((acc, input) => {
                acc[input.id] = input.getValue({
                    interpolationContext: this.getInterpolationContext(),
                });
                return acc;
            }, {})) !== null && _b !== void 0 ? _b : {},
            eas: {
                runtimePlatform: this.ctx.global.runtimePlatform,
                ...this.ctx.global.staticContext,
                env: this.getScriptEnv(),
            },
            ...this.getInterpolationContext(),
        }));
    }
    skip() {
        this.status = BuildStepStatus.SKIPPED;
        this.ctx.logger.info({ marker: BuildStepLogMarker.START_STEP }, 'Executing build step "${this.displayName}"');
        this.ctx.logger.info(`Skipped build step "${this.displayName}"`);
        this.ctx.logger.info({ marker: BuildStepLogMarker.END_STEP, result: BuildStepStatus.SKIPPED }, `Skipped build step "${this.displayName}"`);
    }
    getInterpolationContext() {
        return {
            ...this.ctx.global.getInterpolationContext(),
            env: this.getScriptEnv(),
        };
    }
    async executeCommandAsync() {
        assert(this.command, 'Command must be defined.');
        const interpolatedCommand = interpolateJobContext({
            target: this.command,
            context: this.getInterpolationContext(),
        });
        const command = this.interpolateInputsOutputsAndGlobalContextInTemplate(`${interpolatedCommand}`, this.inputs);
        this.ctx.logger.debug(`Interpolated inputs in the command template`);
        const scriptPath = await saveScriptToTemporaryFileAsync(this.ctx.global, this.id, command);
        this.ctx.logger.debug(`Saved script to ${scriptPath}`);
        const { command: shellCommand, args } = getShellCommandAndArgs(this.shell, scriptPath);
        this.ctx.logger.debug(`Executing script: ${shellCommand}${args !== undefined ? ` ${args.join(' ')}` : ''}`);
        await spawnAsync(shellCommand, args !== null && args !== void 0 ? args : [], {
            cwd: this.ctx.workingDirectory,
            logger: this.ctx.logger,
            env: this.getScriptEnv(),
            // stdin is /dev/null, std{out,err} are piped into logger.
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        this.ctx.logger.debug(`Script completed successfully`);
    }
    async executeFnAsync() {
        assert(this.fn, 'Function (fn) must be defined');
        await this.fn(this.ctx, {
            inputs: Object.fromEntries(Object.entries(this.inputById).map(([key, input]) => [
                key,
                { value: input.getValue({ interpolationContext: this.getInterpolationContext() }) },
            ])),
            outputs: this.outputById,
            env: this.getScriptEnv(),
        });
        this.ctx.logger.debug(`Script completed successfully`);
    }
    interpolateInputsOutputsAndGlobalContextInTemplate(template, inputs) {
        if (!inputs) {
            return interpolateWithOutputs(this.ctx.global.interpolate(template), (path) => { var _a; return (_a = this.ctx.global.getStepOutputValue(path)) !== null && _a !== void 0 ? _a : ''; });
        }
        const vars = inputs.reduce((acc, input) => {
            var _a;
            const value = input.getValue({ interpolationContext: this.getInterpolationContext() });
            acc[input.id] = typeof value === 'object' ? JSON.stringify(value) : (_a = value === null || value === void 0 ? void 0 : value.toString()) !== null && _a !== void 0 ? _a : '';
            return acc;
        }, {});
        return interpolateWithOutputs(interpolateWithInputs(this.ctx.global.interpolate(template), vars), (path) => { var _a; return (_a = this.ctx.global.getStepOutputValue(path)) !== null && _a !== void 0 ? _a : ''; });
    }
    async collectAndValidateOutputsAsync(outputsDir) {
        const files = await fs.readdir(outputsDir);
        for (const outputId of files) {
            if (!(outputId in this.outputById)) {
                const newOutput = new BuildStepOutput(this.ctx.global, {
                    id: outputId,
                    stepDisplayName: this.displayName,
                    required: false,
                });
                this.outputById[outputId] = newOutput;
            }
            const file = path.join(outputsDir, outputId);
            const rawContents = await fs.readFile(file, 'utf-8');
            const decodedContents = Buffer.from(rawContents, 'base64').toString('utf-8');
            this.outputById[outputId].set(decodedContents);
        }
        const nonSetRequiredOutputIds = [];
        for (const output of Object.values(this.outputById)) {
            try {
                const value = output.value;
                this.ctx.logger.debug(`Output parameter "${output.id}" is set to "${value}"`);
            }
            catch (err) {
                this.ctx.logger.debug({ err }, `Getting value for output parameter "${output.id}" failed.`);
                nonSetRequiredOutputIds.push(output.id);
            }
        }
        if (nonSetRequiredOutputIds.length > 0) {
            const idsString = nonSetRequiredOutputIds.map((i) => `"${i}"`).join(', ');
            throw new BuildStepRuntimeError(`Some required outputs have not been set: ${idsString}`, {
                metadata: { ids: nonSetRequiredOutputIds },
            });
        }
    }
    async collectAndUpdateEnvsAsync(envsDir) {
        const filenames = await fs.readdir(envsDir);
        const entries = await Promise.all(filenames.map(async (basename) => {
            const rawContents = await fs.readFile(path.join(envsDir, basename), 'utf-8');
            const decodedContents = Buffer.from(rawContents, 'base64').toString('utf-8');
            return [basename, decodedContents];
        }));
        this.ctx.global.updateEnv({
            ...this.ctx.global.env,
            ...Object.fromEntries(entries),
        });
    }
    getScriptEnv() {
        var _a;
        const effectiveEnv = { ...this.ctx.global.env, ...this.stepEnvOverrides };
        const currentPath = (_a = effectiveEnv.PATH) !== null && _a !== void 0 ? _a : process.env.PATH;
        const newPath = currentPath ? `${BIN_PATH}:${currentPath}` : BIN_PATH;
        return {
            ...effectiveEnv,
            __EXPO_STEPS_OUTPUTS_DIR: this.outputsDir,
            __EXPO_STEPS_ENVS_DIR: this.envsDir,
            __EXPO_STEPS_WORKING_DIRECTORY: this.ctx.workingDirectory,
            PATH: newPath,
        };
    }
}
//# sourceMappingURL=BuildStep.js.map