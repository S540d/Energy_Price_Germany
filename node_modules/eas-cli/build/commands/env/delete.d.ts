import EasCommand from '../../commandUtils/EasCommand';
import { EASEnvironmentVariableScopeFlagValue } from '../../commandUtils/flags';
export default class EnvDelete extends EasCommand {
    static description: string;
    static flags: {
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        scope: import("@oclif/core/lib/interfaces").OptionFlag<EASEnvironmentVariableScopeFlagValue>;
        'variable-name': import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        'variable-environment': import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    runAsync(): Promise<void>;
    private sanitizeInputs;
}
