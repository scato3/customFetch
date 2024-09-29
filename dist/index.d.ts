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
    getConfig(): ApiConfig;
    updateConfig(config: Partial<ApiConfig>): void;
}
export default Api;
