/**
 * Feedback submission. POSTs to Formspree (or any endpoint set via
 * EXPO_PUBLIC_FEEDBACK_ENDPOINT) and mirrors the payload to localStorage so
 * nothing is lost if the network fails.
 *
 * Formspree's JSON API:
 *   POST https://formspree.io/f/<formId>
 *   Headers: Content-Type: application/json, Accept: application/json
 *   Body:    arbitrary JSON; fields show up in the dashboard + email
 */

const DEFAULT_ENDPOINT = "https://formspree.io/f/xgorblpg";

const ENDPOINT =
  (typeof process !== "undefined" &&
    (process.env?.EXPO_PUBLIC_FEEDBACK_ENDPOINT as string | undefined)) ||
  DEFAULT_ENDPOINT;

const LOCAL_KEY = "shadonis.focus.feedback.v1";

export interface FeedbackPayload {
  name: string | null;
  feelsAccurate: boolean | null;
  comment: string | null;
  birthCity?: string | null;
  birthDate?: string | null;
  submittedAt: string;
  userAgent?: string;
  page?: string;
}

export interface FeedbackResult {
  ok: boolean;
  delivered: boolean;     // true if POST succeeded
  storedLocally: boolean; // true if localStorage write succeeded
  error?: string;
}

export async function submitFeedback(
  payload: Omit<FeedbackPayload, "submittedAt" | "userAgent" | "page">
): Promise<FeedbackResult> {
  const fullPayload: FeedbackPayload = {
    ...payload,
    submittedAt: new Date().toISOString(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    page:
      typeof window !== "undefined" ? window.location?.href : undefined,
  };

  // Always store locally as a backup.
  let storedLocally = false;
  try {
    if (typeof window !== "undefined") {
      const existing = JSON.parse(
        window.localStorage.getItem(LOCAL_KEY) ?? "[]"
      );
      existing.push(fullPayload);
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(existing));
      storedLocally = true;
    }
  } catch {
    // ignore quota / privacy mode
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(fullPayload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: storedLocally,
        delivered: false,
        storedLocally,
        error: `Formspree ${res.status}: ${text || "submit failed"}`,
      };
    }
    return { ok: true, delivered: true, storedLocally };
  } catch (err) {
    return {
      ok: storedLocally,
      delivered: false,
      storedLocally,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
