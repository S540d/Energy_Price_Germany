"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountUsageQuery = void 0;
const tslib_1 = require("tslib");
const graphql_tag_1 = tslib_1.__importDefault(require("graphql-tag"));
const client_1 = require("../client");
exports.AccountUsageQuery = {
    async getUsageForOverageWarningAsync(graphqlClient, accountId, currentDate) {
        const data = await (0, client_1.withErrorHandlingAsync)(graphqlClient
            .query((0, graphql_tag_1.default) `
            query AccountUsageForOverageWarning($accountId: String!, $currentDate: DateTime!) {
              account {
                byId(accountId: $accountId) {
                  id
                  name
                  subscription {
                    id
                    name
                  }
                  usageMetrics {
                    EAS_BUILD: byBillingPeriod(date: $currentDate, service: BUILDS) {
                      id
                      planMetrics {
                        id
                        serviceMetric
                        value
                        limit
                      }
                    }
                  }
                }
              }
            }
          `, { accountId, currentDate: currentDate.toISOString() }, {
            additionalTypenames: ['Account', 'AccountUsageMetrics', 'UsageMetricTotal'],
        })
            .toPromise());
        return data.account.byId;
    },
};
