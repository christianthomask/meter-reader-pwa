const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAuthToken(): Promise<string | null> {
  // TODO: Replace with Cognito token retrieval via aws-amplify
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, ...init } = options;
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, params), {
    ...init,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      errorData?.message || `Request failed: ${response.statusText}`,
      errorData
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(path, { method: "GET", params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

export { ApiError };
