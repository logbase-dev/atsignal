import type { Request, Response } from "express";
import * as functions from "firebase-functions";
import {
  createPendingSubscription,
  markSubscriptionFailed,
  markSubscriptionSynced,
  normalizePhone,
  parseSubscribeRequest,
} from "../services/subscriptionStore";
import {
  StibeeApiError,
  syncSubscriber,
} from "../services/stibeeClient";

export const subscribeNewsletter = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (req.method !== "POST") {
    res
      .status(405)
      .json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    const payload = parseSubscribeRequest(req.body);
    const { ref, id } =
      await createPendingSubscription(payload);

    try {
      const result = await syncSubscriber({
        email: payload.email,
        name: payload.name,
        company: payload.company,
        phoneNormalized: normalizePhone(payload.phone),
      });

      const subscriberId =
        (result.data as Record<string, any> | undefined)
          ?.data?.[0]?.subscriberId ??
        null;

      await markSubscriptionSynced(ref, {
        subscriberId,
        statusCode: result.status,
        message: "OK",
      });

      res.status(201).json({
        id,
        status: "subscribed",
      });
    } catch (error) {
      if (error instanceof StibeeApiError) {
        await markSubscriptionFailed(ref, {
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

      await markSubscriptionFailed(ref, {
        statusCode: 500,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      });
      res.status(500).json({
        error: "UNEXPECTED_ERROR",
      });
    }
  } catch (error) {
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

