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
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    timeout?: number;
    beforeRequest?: (url: string, options: RequestInit) => void;
    afterResponse?: (response: Response) => void;
}
interface ApiConfig {
    baseUrl: string;
    getToken?: () => string | null;
    onRefreshToken?: () => Promise<void>;
    onRefreshTokenFailed?: () => void;
    authorizationType?: "Bearer" | "Basic" | string | null;
}
interface InternalApiConfig {
    baseUrl: string;
    getToken: () => string | null;
    onRefreshToken: () => Promise<void>;
    onRefreshTokenFailed: () => void;
    authorizationType: "Bearer" | "Basic" | string | null;
}
declare class Api {
    private config;
    private isRefreshingToken;
    private tokenRefreshQueue;
    constructor(config: Partial<ApiConfig>);
    isTokenExpired(token: string): boolean;
    private handleTokenRefresh;
    private fetchInternal;
    get: <T = unknown>(options: FetchOptions<T>) => Promise<any>;
    post: <T = unknown>(options: FetchOptions<T>) => Promise<any>;
    put: <T = unknown>(options: FetchOptions<T>) => Promise<any>;
    patch: <T = unknown>(options: FetchOptions<T>) => Promise<any>;
    delete: <T = unknown>(options: FetchOptions<T>) => Promise<any>;
    getConfig(): InternalApiConfig;
    updateConfig(config: Partial<ApiConfig>): void;
}
export default Api;
