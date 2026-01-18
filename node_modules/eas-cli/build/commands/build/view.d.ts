import EasCommand from '../../commandUtils/EasCommand';
export default class BuildView extends EasCommand {
    static description: string;
    static args: {
        name: string;
    }[];
    static flags: {
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    static contextDefinition: {
        vcsClient: import("../../commandUtils/context/VcsClientContextField").default;
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    runAsync(): Promise<void>;
}
