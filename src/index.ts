/* hs-fetch ver 1.08 */

import queryString from "query-string";
import jwt from "jsonwebtoken";

// Interface for decoding token
interface DecodedToken {
  exp: number;
}

// Interface for Next.js-specific fetch options
interface NextFetchOptions {
  revalidate?: number;
  tags?: string[];
}

// Main fetch options interface
interface FetchOptions<T = unknown> {
  method?: string;
  body?: T;
  query?: Record<string, unknown>;
  url: string;
  headers?: Record<string, string>;
  revalidate?: number;
  tags?: string[];
  retryCount?: number; // Retry count; default is 3 times
  retryDelay?: number; // Delay between retries in milliseconds
  timeout?: number; // Request timeout in milliseconds
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  beforeRequest?: (url: string, options: RequestInit) => void; // Hook before request
  afterResponse?: (response: Response) => void; // Hook after response
  useToken?: boolean; // Whether to use token (default true)
}

// Interface for API configuration
interface ApiConfig {
  baseUrl: string;
  getToken?: () => string | null;
  onRefreshToken?: () => Promise<void>;
  onRefreshTokenFailed?: () => void;
  authorizationType?: "Bearer" | "Basic" | string | null;
}

// API class for handling requests and token management
class Api {
  private config: ApiConfig;
  private isRefreshingToken = false; // Tracks if token is being refreshed
  private tokenRefreshQueue: {
    resolve: () => void;
    reject: (reason?: any) => void;
  }[] = []; // Queue to handle pending requests during token refresh

  constructor(config: Partial<ApiConfig>) {
    this.config = {
      baseUrl: "",
      getToken: () => null,
      onRefreshToken: async () => {},
      onRefreshTokenFailed: () => {},
      authorizationType: "Bearer",
      ...config,
    };
  }

  // Method to check if the token is expired
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as DecodedToken | null;
      return decoded ? decoded.exp < Date.now() / 1000 : true;
    } catch {
      return true;
    }
  }

  // Method for handling token refresh with a queue system
  private async handleTokenRefresh(): Promise<void> {
    if (this.isRefreshingToken) {
      return new Promise<void>((resolve, reject) => {
        this.tokenRefreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshingToken = true;

    try {
      await this.config.onRefreshToken?.();
    } catch (error) {
      while (this.tokenRefreshQueue.length) {
        const { reject } = this.tokenRefreshQueue.shift()!;
        reject?.(error);
      }
      throw error;
    } finally {
      this.isRefreshingToken = false;
      while (this.tokenRefreshQueue.length) {
        const { resolve } = this.tokenRefreshQueue.shift()!;
        resolve?.();
      }
    }
  }

  // Internal method to create request headers
  private createHeaders(
    token: string | null,
    headers: Record<string, string>,
    useToken: boolean
  ): HeadersInit {
    const authorizationHeader: Record<string, string> =
      useToken && token
        ? {
            Authorization: this.config.authorizationType
              ? `${this.config.authorizationType} ${token}`
              : token,
          }
        : {};

    return {
      "Content-Type": "application/json",
      ...authorizationHeader,
      ...headers,
    };
  }

  // Internal method to handle fetch requests with retry and timeout logic
  private async fetchInternal<T = unknown>(
    options: FetchOptions<T>
  ): Promise<any> {
    const {
      body,
      method = "GET",
      query,
      url,
      headers = {},
      revalidate,
      tags,
      retryCount = 3,
      retryDelay = 1000,
      timeout = 5000,
      onSuccess,
      onError,
      beforeRequest,
      afterResponse,
      useToken = true, // Default to using token
    } = options;

    const fullUrl = url.startsWith("http")
      ? url
      : `${this.config.baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;

    let token = null;
    if (useToken && this.config.getToken) {
      token = this.config.getToken();

      if (token && this.isTokenExpired(token)) {
        try {
          await this.handleTokenRefresh();
          token = this.config.getToken();
        } catch (refreshError) {
          if (onError && refreshError instanceof Error) {
            onError(refreshError);
          }
          throw refreshError;
        }
      }
    }

    const requestHeaders = this.createHeaders(token, headers, useToken);

    const nextFetchOptions: Partial<{ next: NextFetchOptions }> = {};
    if (revalidate || tags) {
      nextFetchOptions.next = {};
      if (revalidate !== undefined) {
        nextFetchOptions.next.revalidate = revalidate;
      }
      if (tags) {
        nextFetchOptions.next.tags = tags;
      }
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      ...nextFetchOptions,
    };

    const finalUrl = query
      ? `${fullUrl}?${queryString.stringify(query, {
          skipNull: true,
          skipEmptyString: true,
        })}`
      : fullUrl;

    if (beforeRequest) {
      beforeRequest(finalUrl, requestOptions);
    }

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const response = (await Promise.race([
          fetch(
            finalUrl,
            requestOptions as RequestInit & { next?: NextFetchOptions }
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), timeout)
          ),
        ])) as Response;

        if (!response.ok) {
          const errorData = await response.json();
          const error = new Error(errorData.message || "Request failed");
          if (onError) {
            onError(error);
          }
          throw error;
        }

        const contentType = response.headers.get("Content-Type");
        const data = contentType?.includes("application/json")
          ? await response.json()
          : await response.text();

        if (afterResponse) {
          afterResponse(response);
        }
        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      } catch (error) {
        if (attempt >= retryCount) {
          if (onError && error instanceof Error) {
            onError(error);
          }
          throw error;
        }
        await new Promise((res) => setTimeout(res, retryDelay));
      }
    }
  }

  // Public API methods for HTTP verbs
  private createRequestMethod(method: string) {
    return <T = unknown>(options: FetchOptions<T>) =>
      this.fetchInternal({ method, ...options });
  }

  get = this.createRequestMethod("GET");
  post = this.createRequestMethod("POST");
  put = this.createRequestMethod("PUT");
  patch = this.createRequestMethod("PATCH");
  delete = this.createRequestMethod("DELETE");

  // Method to retrieve current configuration
  getConfig() {
    return this.config;
  }

  // Method to update configuration
  updateConfig(config: Partial<ApiConfig>) {
    this.config = { ...this.config, ...config };
  }
}

export default Api;
