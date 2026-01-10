import EasCommand from '../../commandUtils/EasCommand';
import { ExpoGraphqlClient } from '../../commandUtils/context/contextUtils/createGraphqlClient';
import { ResumeUpdateChannelMutationVariables, UpdateChannelBasicInfoFragment } from '../../graphql/generated';
export declare function resumeUpdateChannelAsync(graphqlClient: ExpoGraphqlClient, { channelId }: ResumeUpdateChannelMutationVariables): Promise<UpdateChannelBasicInfoFragment>;
export default class ChannelResume extends EasCommand {
    static description: string;
    static args: {
        name: string;
        required: boolean;
        description: string;
    }[];
    static flags: {
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'non-interactive': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        branch: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    runAsync(): Promise<void>;
}
