import EasCommand from '../../commandUtils/EasCommand';
import { EASEnvironmentVariableScopeFlagValue } from '../../commandUtils/flags';
export default class EnvUpdate extends EasCommand {
    static description: string;
    static flags: {
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        environment: import("@oclif/core/lib/interfaces").OptionFlag<string[] | undefined>;
        scope: import("@oclif/core/lib/interfaces").OptionFlag<EASEnvironmentVariableScopeFlagValue>;
        visibility: import("@oclif/core/lib/interfaces").OptionFlag<"plaintext" | "sensitive" | "secret" | undefined>;
        'variable-name': import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        'variable-environment': import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        name: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        value: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        type: import("@oclif/core/lib/interfaces").OptionFlag<"string" | "file" | undefined>;
    };
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        analytics: import("../../commandUtils/context/AnalyticsContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    runAsync(): Promise<void>;
    private sanitizeInputs;
    private promptForMissingFlagsAsync;
}
