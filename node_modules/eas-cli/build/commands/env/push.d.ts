import EasCommand from '../../commandUtils/EasCommand';
export default class EnvPush extends EasCommand {
    static description: string;
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    static flags: {
        path: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        force: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        environment: import("@oclif/core/lib/interfaces").OptionFlag<string[] | undefined>;
    };
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    runAsync(): Promise<void>;
    parseFlagsAndArgs(flags: {
        path: string;
        environment: string[] | undefined;
        force: boolean;
    }, { environment }: Record<string, string>): {
        environment?: string[];
        path: string;
        force: boolean;
    };
    private parseEnvFileAsync;
}
