"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultShell = getDefaultShell;
exports.getShellCommandAndArgs = getShellCommandAndArgs;
const os_1 = __importDefault(require("os"));
// stolen from https://circleci.com/docs/configuration-reference/
const DEFAULT_SHELL = '/bin/bash -eo pipefail';
const SHELL_BY_PLATFORM = {
    darwin: '/bin/bash --login -eo pipefail',
};
function getDefaultShell(platform = os_1.default.platform()) {
    const platformSpecificShell = SHELL_BY_PLATFORM[platform];
    if (platformSpecificShell) {
        return platformSpecificShell;
    }
    else {
        return DEFAULT_SHELL;
    }
}
function getShellCommandAndArgs(shell, script) {
    const splits = shell.split(' ');
    const command = splits[0];
    const args = [...splits.slice(1)];
    if (script) {
        args.push(script);
    }
    return {
        command,
        args,
    };
}
//# sourceMappingURL=command.js.map