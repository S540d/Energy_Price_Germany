import EasCommand from '../../commandUtils/EasCommand';
import { EASEnvironmentVariableScopeFlagValue } from '../../commandUtils/flags';
export default class EnvList extends EasCommand {
    static description: string;
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    static flags: {
        scope: import("@oclif/core/lib/interfaces").OptionFlag<EASEnvironmentVariableScopeFlagValue>;
        format: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        environment: import("@oclif/core/lib/interfaces").OptionFlag<string[] | undefined>;
        'include-sensitive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'include-file-content': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    runAsync(): Promise<void>;
    private sanitizeInputs;
}
