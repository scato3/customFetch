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
declare class Api {
    private config;
    constructor(config: Partial<ApiConfig>);
    isTokenExpired(token: string): boolean;
    private fetchInternal;
    get: (options: FetchOptions) => Promise<any>;
    post: (options: FetchOptions) => Promise<any>;
    put: (options: FetchOptions) => Promise<any>;
    patch: (options: FetchOptions) => Promise<any>;
    delete: (options: FetchOptions) => Promise<any>;
    getConfig(): ApiConfig;
    updateConfig(config: Partial<ApiConfig>): void;
}
export default Api;
