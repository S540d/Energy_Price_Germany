import { Platform } from '@expo/eas-build-job';
import EasCommand from '../../commandUtils/EasCommand';
import { AppPlatform, BuildFragment } from '../../graphql/generated';
export default class Download extends EasCommand {
    static description: string;
    static flags: {
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        fingerprint: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        platform: import("@oclif/core/lib/interfaces").OptionFlag<Platform | undefined>;
        'dev-client': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    static contextDefinition: {
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
    };
    runAsync(): Promise<void>;
    private getBuildAsync;
    getPathToBuildArtifactAsync(build: BuildFragment, platform: AppPlatform): Promise<string>;
}
