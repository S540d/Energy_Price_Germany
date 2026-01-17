import EasCommand from '../../commandUtils/EasCommand';
import { EASEnvironmentVariableScopeFlagValue } from '../../commandUtils/flags';
export default class EnvGet extends EasCommand {
    static description: string;
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    static flags: {
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        scope: import("@oclif/core/lib/interfaces").OptionFlag<EASEnvironmentVariableScopeFlagValue>;
        format: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        'variable-name': import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        'variable-environment': import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    runAsync(): Promise<void>;
    private sanitizeInputs;
}
