/* hs-fetch ver 1.07 */

import queryString from "query-string";
import jwt from "jsonwebtoken";

interface DecodedToken {
  exp: number;
}

interface NextFetchOptions {
  revalidate?: number;
  tags?: string[];
}

interface FetchOptions<T = unknown> {
  method?: string;
  body?: T;
  query?: Record<string, unknown>;
  url: string;
  headers?: Record<string, string>;
  revalidate?: number;
  tags?: string[];
}

interface ApiConfig {
  baseUrl: string;
  getToken?: () => string | null;
  onRefreshToken?: () => Promise<void>;
  authorizationType?: "Bearer" | "Basic" | string | null;
}

class Api {
  private config: ApiConfig;
  private isRefreshingToken = false; // Tracks if token is being refreshed
  private tokenRefreshQueue: {
    resolve: () => void;
    reject: (reason?: any) => void;
  }[] = []; // Queue to handle pending requests during token refresh

  constructor(config: Partial<ApiConfig>) {
    // Merging default configuration with provided configuration
    this.config = {
      baseUrl: "",
      getToken: () => null,
      onRefreshToken: async () => {},
      authorizationType: "Bearer",
      ...config,
    };
  }

  // Check if the provided token is expired
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as DecodedToken | null;
      return decoded ? decoded.exp < Date.now() / 1000 : true;
    } catch {
      return true;
    }
  }

  // Token refresh logic with queue handling
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
      // If refreshing fails, reject all pending promises
      while (this.tokenRefreshQueue.length) {
        const { reject } = this.tokenRefreshQueue.shift()!;
        reject?.(error);
      }
      throw error; // Rethrow the error if needed
    } finally {
      this.isRefreshingToken = false;
      // Resolve all pending promises if token refresh succeeded
      while (this.tokenRefreshQueue.length) {
        const { resolve } = this.tokenRefreshQueue.shift()!;
        resolve?.();
      }
    }
  }

  // Internal fetch method to handle API requests
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
    } = options;

    // Build the full URL, combining baseUrl with the given endpoint
    const fullUrl = url.startsWith("http")
      ? url
      : `${this.config.baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;

    // Retrieve the token using getToken function
    let token = this.config.getToken ? this.config.getToken() : null;

    // If the token is expired, refresh it using onRefreshToken
    if (token && this.isTokenExpired(token)) {
      await this.handleTokenRefresh(); // Wait for token refresh
      token = this.config.getToken ? this.config.getToken() : null;
    }

    // Set the authorization header if the token exists
    const authorizationHeader: Record<string, string> = token
      ? {
          Authorization: this.config.authorizationType
            ? `${this.config.authorizationType} ${token}`
            : token,
        }
      : {};

    // Merge default headers with provided headers
    const requestHeaders: HeadersInit = {
      "Content-Type": "application/json",
      ...authorizationHeader,
      ...headers,
    };

    // Handle Next.js-specific fetch options (revalidation, tags)
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

    // Build the request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined, // Remove body if it is undefined
      ...nextFetchOptions, // Add Next.js fetch options
    };

    // Append query parameters to the URL if provided
    const finalUrl = query
      ? `${fullUrl}?${queryString.stringify(query, {
          skipNull: true, // Skip null values
          skipEmptyString: true, // Skip empty string values
        })}`
      : fullUrl;

    // Perform the fetch request
    const res = await fetch(
      finalUrl,
      requestOptions as RequestInit & { next?: NextFetchOptions }
    );

    // Handle non-OK responses
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Request failed");
    }

    // Return the response, parsed as JSON if applicable, otherwise as text
    return res.headers.get("Content-Type")?.includes("application/json")
      ? res.json()
      : res.text();
  }

  // Shorthand methods for different HTTP verbs
  get = <T = unknown>(options: FetchOptions<T>) =>
    this.fetchInternal({ method: "GET", ...options });
  post = <T = unknown>(options: FetchOptions<T>) =>
    this.fetchInternal({ method: "POST", ...options });
  put = <T = unknown>(options: FetchOptions<T>) =>
    this.fetchInternal({ method: "PUT", ...options });
  patch = <T = unknown>(options: FetchOptions<T>) =>
    this.fetchInternal({ method: "PATCH", ...options });
  delete = <T = unknown>(options: FetchOptions<T>) =>
    this.fetchInternal({ method: "DELETE", ...options });

  // Retrieve the current configuration
  getConfig() {
    return this.config;
  }

  // Update the configuration if necessary
  updateConfig(config: Partial<ApiConfig>) {
    this.config = { ...this.config, ...config };
  }
}

export default Api;
