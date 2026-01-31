import EasCommand from '../../commandUtils/EasCommand';
import { EASEnvironmentVariableScopeFlagValue } from '../../commandUtils/flags';
export default class EnvCreate extends EasCommand {
    static description: string;
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    static flags: {
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        environment: import("@oclif/core/lib/interfaces").OptionFlag<string[] | undefined>;
        scope: import("@oclif/core/lib/interfaces").OptionFlag<EASEnvironmentVariableScopeFlagValue>;
        visibility: import("@oclif/core/lib/interfaces").OptionFlag<"plaintext" | "sensitive" | "secret" | undefined>;
        name: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        value: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        force: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        type: import("@oclif/core/lib/interfaces").OptionFlag<"string" | "file" | undefined>;
    };
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        analytics: import("../../commandUtils/context/AnalyticsContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    runAsync(): Promise<void>;
    private promptForOverwriteAsync;
    private promptForMissingFlagsAsync;
    private sanitizeFlags;
}
