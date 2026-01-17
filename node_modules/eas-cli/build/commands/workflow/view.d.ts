import EasCommand from '../../commandUtils/EasCommand';
export default class WorkflowView extends EasCommand {
    static description: string;
    static flags: {
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    static args: {
        name: string;
        description: string;
    }[];
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    runAsync(): Promise<void>;
}
