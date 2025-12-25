"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeNewsletter = void 0;
const functions = __importStar(require("firebase-functions"));
const subscriptionStore_1 = require("../services/subscriptionStore");
const stibeeClient_1 = require("../services/stibeeClient");
const subscribeNewsletter = async (req, res) => {
    if (req.method !== "POST") {
        res
            .status(405)
            .json({ error: "METHOD_NOT_ALLOWED" });
        return;
    }
    try {
        const payload = (0, subscriptionStore_1.parseSubscribeRequest)(req.body);
        const { ref, id } = await (0, subscriptionStore_1.createPendingSubscription)(payload);
        try {
            const result = await (0, stibeeClient_1.syncSubscriber)({
                email: payload.email,
                name: payload.name,
                company: payload.company,
                phoneNormalized: (0, subscriptionStore_1.normalizePhone)(payload.phone),
            });
            const subscriberId = result.data
                ?.data?.[0]?.subscriberId ??
                null;
            await (0, subscriptionStore_1.markSubscriptionSynced)(ref, {
                subscriberId,
                statusCode: result.status,
                message: "OK",
            });
            res.status(201).json({
                id,
                status: "subscribed",
            });
        }
        catch (error) {
            if (error instanceof stibeeClient_1.StibeeApiError) {
                await (0, subscriptionStore_1.markSubscriptionFailed)(ref, {
                    statusCode: error.status,
                    message: error.body,
                });
                res.status(502).json({
                    error: "STIBEE_SYNC_FAILED",
                    statusCode: error.status,
                    detail: error.body,
                });
                return;
            }
            await (0, subscriptionStore_1.markSubscriptionFailed)(ref, {
                statusCode: 500,
                message: error instanceof Error
                    ? error.message
                    : "Unknown error",
            });
            res.status(500).json({
                error: "UNEXPECTED_ERROR",
            });
        }
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError) {
            res.status(400).json({
                error: error.code,
                message: error.message,
            });
            return;
        }
        functions.logger.error("subscribeNewsletter", error);
        res.status(500).json({
            error: "INTERNAL_ERROR",
        });
    }
};
exports.subscribeNewsletter = subscribeNewsletter;
//# sourceMappingURL=subscribeNewsletter.js.map