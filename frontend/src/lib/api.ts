/**
 * Tiny client for the Prelegal backend API.
 *
 * The frontend is served by the same FastAPI process as the API, so requests
 * are same-origin and the session cookie rides along automatically.
 */

export type User = {
  id: number;
  email: string;
  created_at: string;
};

/** Error carrying the HTTP status and the backend's `detail` message. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }
  // 204/empty bodies (e.g. signout) parse to an empty object.
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

/** Pull FastAPI's `detail` string out of an error response, with a fallback. */
async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) return body.detail[0]?.msg ?? "Request failed";
  } catch {
    // fall through
  }
  return "Request failed";
}

export const api = {
  signup: (email: string, password: string) =>
    request<User>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signin: (email: string, password: string) =>
    request<User>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signout: () => request<Record<string, never>>("/auth/signout", { method: "POST" }),

  me: () => request<User>("/auth/me"),
};
