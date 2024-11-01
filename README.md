# hs-fetch

**hs-fetch** is a TypeScript-based HTTP client library offering features like token management, retry logic, and timeout settings. It is designed to integrate seamlessly with frameworks like Next.js 14, supporting modern server and client-side rendering use cases.

**Note**: Comprehensive E2E testing has been conducted using **Cypress** to ensure reliability and stability across various scenarios.

## Key Features

- **Token Management**: Automatically checks for token expiration and refreshes tokens as needed.
- **Retry Logic**: Retries requests on failure for a specified number of times, with configurable delay intervals.
- **Timeout Handling**: Allows setting timeouts for requests, canceling them if the response takes too long.
- **Hooks Support**: Provides hooks for custom logic before and after requests.
- **Next.js Integration**: Options like `revalidate` and `tags` for compatibility with Next.js ISR (Incremental Static Regeneration).

## Installation

```bash
npm install hs-fetch
```

## Usage Example

```ts
import Api from "hs-fetch";

// Create an API instance
const api = new Api({
  baseUrl: "https://api.example.com",
  getToken: () => localStorage.getItem("token"),
  onRefreshToken: async () => {
    // Implement token refresh logic
  },
  onRefreshTokenFailed: () => {
    // Handle token refresh failure
  },
  authorizationType: "Bearer",
});

// Example GET request
const fetchData = async () => {
  try {
    const data = await api.get({
      url: "/data",
      query: { page: 1 },
      revalidate: 60, // ISR revalidation
      tags: ["data"], // ISR tags
    });
    console.log(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// Example POST request
const postData = async () => {
  try {
    const response = await api.post({
      url: "/data",
      body: { name: "John Doe" },
      onSuccess: (data) => {
        console.log("Data posted successfully:", data);
      },
      onError: (error) => {
        console.error("Error posting data:", error);
      },
    });
  } catch (error) {
    console.error("Error posting data:", error);
  }
};
```

## API Reference

### `Api` Class

The `Api` class manages HTTP requests, handles token refresh, and implements retry logic.

#### Constructor

```ts
constructor(config: Partial<ApiConfig>)
```

## Methods

```ts
get<T>(options: FetchOptions<T>): Promise<T>
post<T>(options: FetchOptions<T>): Promise<T>
put<T>(options: FetchOptions<T>): Promise<T>
patch<T>(options: FetchOptions<T>): Promise<T>
delete<T>(options: FetchOptions<T>): Promise<T>
```

These methods perform HTTP requests for their respective verbs, using FetchOptions for configuration.

`FetchOptions` Interface

`FetchOptions` allows you to customize your requests with various options.

```ts
interface FetchOptions<T = unknown> {
  method?: string;
  body?: T;
  query?: Record<string, unknown>;
  url: string;
  headers?: Record<string, string>;
  revalidate?: number;
  tags?: string[];
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  beforeRequest?: (url: string, options: RequestInit) => void;
  afterResponse?: (response: Response) => void;
  useToken?: boolean;
}
```
