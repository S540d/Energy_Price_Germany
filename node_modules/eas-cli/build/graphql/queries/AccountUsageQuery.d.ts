import { ExpoGraphqlClient } from '../../commandUtils/context/contextUtils/createGraphqlClient';
import { AccountUsageForOverageWarningQuery } from '../generated';
export declare const AccountUsageQuery: {
    getUsageForOverageWarningAsync(graphqlClient: ExpoGraphqlClient, accountId: string, currentDate: Date): Promise<AccountUsageForOverageWarningQuery['account']['byId']>;
};
