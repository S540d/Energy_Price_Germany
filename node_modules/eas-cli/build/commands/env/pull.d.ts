import EasCommand from '../../commandUtils/EasCommand';
export default class EnvPull extends EasCommand {
    static description: string;
    static contextDefinition: {
        projectDir: import("../../commandUtils/context/ProjectDirContextField").default;
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    static flags: {
        path: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        environment: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    runAsync(): Promise<void>;
}
