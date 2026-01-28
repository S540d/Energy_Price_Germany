import EasCommand from '../../../commandUtils/EasCommand';
export default class WorkerAliasDelete extends EasCommand {
    static description: string;
    static aliases: string[];
    static state: string;
    static args: {
        name: string;
    }[];
    static flags: {
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    static contextDefinition: {
        loggedIn: import("../../../commandUtils/context/LoggedInContextField").default;
        projectDir: import("../../../commandUtils/context/ProjectDirContextField").default;
        getDynamicPublicProjectConfigAsync: import("../../../commandUtils/context/DynamicProjectConfigContextField").DynamicPublicProjectConfigContextField;
        getDynamicPrivateProjectConfigAsync: import("../../../commandUtils/context/DynamicProjectConfigContextField").DynamicPrivateProjectConfigContextField;
    };
    runAsync(): Promise<void>;
    private sanitizeFlags;
}
