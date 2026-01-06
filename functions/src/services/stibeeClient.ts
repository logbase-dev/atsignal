import { stibeeConfig, requireStibeeConfig } from "../config/stibee";

export interface StibeeSyncResult<T = unknown> {
  status: number;
  data?: T;
  rawBody: string;
}

export class StibeeApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string
  ) {
    super(`Stibee API Error (${status})`);
  }
}

interface InternalSubscriberPayload {
  email: string;
  name: string;
  company: string;
  phoneNormalized: string;
}

export const syncSubscriber = async (
  payload: InternalSubscriberPayload
): Promise<StibeeSyncResult> => {
  requireStibeeConfig();

  const url = `${stibeeConfig.apiBaseUrl}/lists/${stibeeConfig.listId}/subscribers`;

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
      AccessToken: stibeeConfig.apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  const rawBody = await response.text();
  let parsedBody: unknown;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
  } catch {
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

