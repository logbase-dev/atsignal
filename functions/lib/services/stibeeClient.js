"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncSubscriber = exports.StibeeApiError = void 0;
const stibee_1 = require("../config/stibee");
class StibeeApiError extends Error {
    constructor(status, body) {
        super(`Stibee API Error (${status})`);
        this.status = status;
        this.body = body;
    }
}
exports.StibeeApiError = StibeeApiError;
const syncSubscriber = async (payload) => {
    (0, stibee_1.requireStibeeConfig)();
    const url = `${stibee_1.stibeeConfig.apiBaseUrl}/lists/${stibee_1.stibeeConfig.listId}/subscribers`;
    const requestBody = {
        subscribers: [
            {
                email: payload.email,
                name: payload.name,
                memo: payload.company,
                mobile: payload.phoneNormalized,
                fields: [
                    {
                        label: "company",
                        value: payload.company,
                    },
                    {
                        label: "phone",
                        value: payload.phoneNormalized,
                    },
                ],
            },
        ],
    };
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            AccessToken: stibee_1.stibeeConfig.apiKey,
        },
        body: JSON.stringify(requestBody),
    });
    const rawBody = await response.text();
    let parsedBody;
    try {
        parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
    }
    catch {
        parsedBody = undefined;
    }
    if (!response.ok) {
        throw new StibeeApiError(response.status, rawBody);
    }
    return {
        status: response.status,
        data: parsedBody,
        rawBody,
    };
};
exports.syncSubscriber = syncSubscriber;
//# sourceMappingURL=stibeeClient.js.map