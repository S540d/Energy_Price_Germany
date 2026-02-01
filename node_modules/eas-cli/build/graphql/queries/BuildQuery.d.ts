import { ExpoGraphqlClient } from '../../commandUtils/context/contextUtils/createGraphqlClient';
import { BuildFragment, BuildWithFingerprintFragment, BuildWithSubmissionsFragment, ViewBuildsOnAppQueryVariables } from '../generated';
export declare const BuildQuery: {
    byIdAsync(graphqlClient: ExpoGraphqlClient, buildId: string, { useCache }?: {
        useCache?: boolean | undefined;
    }): Promise<BuildFragment>;
    withSubmissionsByIdAsync(graphqlClient: ExpoGraphqlClient, buildId: string, { useCache }?: {
        useCache?: boolean | undefined;
    }): Promise<BuildWithSubmissionsFragment>;
    withFingerprintByIdAsync(graphqlClient: ExpoGraphqlClient, buildId: string, { useCache }?: {
        useCache?: boolean | undefined;
    }): Promise<BuildWithFingerprintFragment>;
    viewBuildsOnAppAsync(graphqlClient: ExpoGraphqlClient, { appId, limit, offset, filter }: ViewBuildsOnAppQueryVariables): Promise<BuildFragment[]>;
};
