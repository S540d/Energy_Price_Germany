import { ExpoGraphqlClient } from '../../commandUtils/context/contextUtils/createGraphqlClient';
import { FingerprintFilterInput, FingerprintFragment, FingerprintsByAppIdQuery } from '../generated';
export declare const FingerprintQuery: {
    byHashAsync(graphqlClient: ExpoGraphqlClient, { appId, hash, }: {
        appId: string;
        hash: string;
    }): Promise<FingerprintFragment | null>;
    getFingerprintsAsync(graphqlClient: ExpoGraphqlClient, { appId, first, after, last, before, fingerprintFilter, }: {
        appId: string;
        first?: number | undefined;
        after?: string | undefined;
        last?: number | undefined;
        before?: string | undefined;
        fingerprintFilter?: FingerprintFilterInput | undefined;
    }): Promise<FingerprintsByAppIdQuery['app']['byId']['fingerprintsPaginated']>;
};
