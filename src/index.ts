/* hs-fetch ver 1.03 */

import queryString from "query-string";
import jwt from "jsonwebtoken";

interface DecodedToken {
  exp: number;
}

interface NextFetchOptions {
  revalidate?: number;
  tags?: string[];
}

interface FetchOptions {
  method?: string;
  body?: unknown;
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

  // Internal fetch method to handle API requests
  private async fetchInternal(options: FetchOptions) {
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
    if (token && this.isTokenExpired(token) && this.config.onRefreshToken) {
      await this.config.onRefreshToken();
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
      ? `${fullUrl}?${queryString.stringify(query)}`
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
  get = (options: FetchOptions) =>
    this.fetchInternal({ method: "GET", ...options });
  post = (options: FetchOptions) =>
    this.fetchInternal({ method: "POST", ...options });
  put = (options: FetchOptions) =>
    this.fetchInternal({ method: "PUT", ...options });
  patch = (options: FetchOptions) =>
    this.fetchInternal({ method: "PATCH", ...options });
  delete = (options: FetchOptions) =>
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
