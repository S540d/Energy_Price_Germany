import EasCommand from '../../commandUtils/EasCommand';
export default class BranchDelete extends EasCommand {
    static description: string;
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    static args: {
        name: string;
        required: boolean;
        description: string;
    }[];
    static flags: {
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    runAsync(): Promise<void>;
}
