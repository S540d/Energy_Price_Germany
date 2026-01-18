"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildWorkflow = void 0;
class BuildWorkflow {
    constructor(ctx, { buildSteps, buildFunctions }) {
        this.ctx = ctx;
        this.buildSteps = buildSteps;
        this.buildFunctions = buildFunctions;
    }
    async executeAsync() {
        let maybeError = null;
        for (const step of this.buildSteps) {
            let shouldExecuteStep = false;
            try {
                shouldExecuteStep = step.shouldExecuteStep();
            }
            catch (err) {
                step.ctx.logger.error({ err });
                step.ctx.logger.error(`Runner failed to evaluate if it should execute step "${step.displayName}", using step's if condition "${step.ifCondition}". This can be caused by trying to access non-existing object property. If you think this is a bug report it here: https://github.com/expo/eas-cli/issues.`);
                maybeError = maybeError !== null && maybeError !== void 0 ? maybeError : err;
                this.ctx.markAsFailed();
            }
            if (shouldExecuteStep) {
                try {
                    await step.executeAsync();
                }
                catch (err) {
                    maybeError = maybeError !== null && maybeError !== void 0 ? maybeError : err;
                    this.ctx.markAsFailed();
                }
            }
            else {
                step.skip();
            }
        }
        if (maybeError) {
            throw maybeError;
        }
    }
}
exports.BuildWorkflow = BuildWorkflow;
//# sourceMappingURL=BuildWorkflow.js.map