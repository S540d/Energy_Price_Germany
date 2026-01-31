import EasCommand from '../../commandUtils/EasCommand';
export declare function nonNullish<TValue>(value: TValue | null | undefined): value is NonNullable<TValue>;
export default class UpdateRevertUpdateRollout extends EasCommand {
    static description: string;
    static flags: {
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        channel: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        branch: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        group: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        message: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        'private-key-path': import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    static contextDefinition: {
        vcsClient: import("../../commandUtils/context/VcsClientContextField").default;
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        privateProjectConfig: import("../../commandUtils/context/PrivateProjectConfigContextField").PrivateProjectConfigContextField;
    };
    runAsync(): Promise<void>;
    private deleteRolloutUpdateGroupAndRepublishControlUpdatesAsync;
    private deleteRolloutUpdateGroupAndPublishRollBackToEmbeddedAsync;
    private deleteRolloutUpdateGroupAsync;
    private sanitizeFlags;
}
