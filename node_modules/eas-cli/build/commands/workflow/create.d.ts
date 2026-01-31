import EasCommand from '../../commandUtils/EasCommand';
export declare class WorkflowCreate extends EasCommand {
    static description: string;
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    static flags: {
        'skip-validation': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectDir: import("../../commandUtils/context/ProjectDirContextField").default;
        getDynamicPublicProjectConfigAsync: import("../../commandUtils/context/DynamicProjectConfigContextField").DynamicPublicProjectConfigContextField;
        getDynamicPrivateProjectConfigAsync: import("../../commandUtils/context/DynamicProjectConfigContextField").DynamicPrivateProjectConfigContextField;
    };
    runAsync(): Promise<void>;
}
