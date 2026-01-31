import EasCommand from '../../commandUtils/EasCommand';
export default class UpdateEdit extends EasCommand {
    static description: string;
    static args: {
        name: string;
        description: string;
    }[];
    static flags: {
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'rollout-percentage': import("@oclif/core/lib/interfaces").OptionFlag<number | undefined>;
        branch: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    runAsync(): Promise<void>;
}
