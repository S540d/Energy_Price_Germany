import path from 'path';
import { createContext } from 'this-file';
import fs from 'fs-extra';
import { spawnAsync } from './shell/spawn.js';
const thisFileCtx = createContext();
export const SCRIPTS_PATH = path.join(thisFileCtx.dirname, '../../dist_commonjs/scripts');
export function serializeInputs(inputs) {
    return Object.fromEntries(Object.entries(inputs).map(([id, input]) => [
        id,
        { serializedValue: input === undefined ? undefined : JSON.stringify(input.value) },
    ]));
}
export function deserializeInputs(inputs) {
    return Object.fromEntries(Object.entries(inputs).map(([id, { serializedValue }]) => [
        id,
        { value: serializedValue === undefined ? undefined : JSON.parse(serializedValue) },
    ]));
}
export function createCustomFunctionCall(rawCustomFunctionModulePath) {
    return async (ctx, { env, inputs, outputs }) => {
        let customFunctionModulePath = rawCustomFunctionModulePath;
        if (!(await fs.exists(ctx.global.projectSourceDirectory))) {
            const relative = path.relative(path.resolve(ctx.global.projectSourceDirectory), customFunctionModulePath);
            customFunctionModulePath = path.resolve(path.join(ctx.global.projectTargetDirectory, relative));
        }
        const serializedArguments = {
            env,
            inputs: serializeInputs(inputs),
            outputs: Object.fromEntries(Object.entries(outputs).map(([id, output]) => [id, output.serialize()])),
            ctx: ctx.serialize(),
        };
        try {
            await spawnAsync('node', [
                path.join(SCRIPTS_PATH, 'runCustomFunction.cjs'),
                customFunctionModulePath,
                JSON.stringify(serializedArguments),
            ], {
                logger: ctx.logger,
                cwd: ctx.workingDirectory,
                env,
                stdio: 'pipe',
            });
        }
        catch {
            throw new Error(`Custom function exited with non-zero exit code.`);
        }
    };
}
//# sourceMappingURL=customFunction.js.map