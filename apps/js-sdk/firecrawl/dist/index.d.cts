import { AxiosRequestHeaders, AxiosResponse } from 'axios';
import * as zt from 'zod';
import { TypedEventTarget } from 'typescript-event-target';

/**
 * Configuration interface for FirecrawlApp.
 * @param apiKey - Optional API key for authentication.
 * @param apiUrl - Optional base URL of the API; defaults to 'https://api.firecrawl.dev'.
 */
interface FirecrawlAppConfig {
    apiKey?: string | null;
    apiUrl?: string | null;
    anthropicApiKey?: string;
}
/**
 * Metadata for a Firecrawl document.
 * Includes various optional properties for document metadata.
 */
interface FirecrawlDocumentMetadata {
    title?: string;
    description?: string;
    language?: string;
    keywords?: string;
    robots?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogUrl?: string;
    ogImage?: string;
    ogAudio?: string;
    ogDeterminer?: string;
    ogLocale?: string;
    ogLocaleAlternate?: string[];
    ogSiteName?: string;
    ogVideo?: string;
    dctermsCreated?: string;
    dcDateCreated?: string;
    dcDate?: string;
    dctermsType?: string;
    dcType?: string;
    dctermsAudience?: string;
    dctermsSubject?: string;
    dcSubject?: string;
    dcDescription?: string;
    dctermsKeywords?: string;
    modifiedTime?: string;
    publishedTime?: string;
    articleTag?: string;
    articleSection?: string;
    sourceURL?: string;
    statusCode?: number;
    error?: string;
    [key: string]: any;
}
/**
 * Document interface for Firecrawl.
 * Represents a document retrieved or processed by Firecrawl.
 */
interface FirecrawlDocument<T = any, ActionsSchema extends (ActionsResult | never) = never> {
    url?: string;
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    extract?: T;
    screenshot?: string;
    metadata?: FirecrawlDocumentMetadata;
    actions: ActionsSchema;
}
/**
 * Parameters for scraping operations.
 * Defines the options and configurations available for scraping web content.
 */
interface CrawlScrapeOptions {
    formats: ("markdown" | "html" | "rawHtml" | "content" | "links" | "screenshot" | "screenshot@fullPage" | "extract")[];
    headers?: Record<string, string>;
    includeTags?: string[];
    excludeTags?: string[];
    onlyMainContent?: boolean;
    waitFor?: number;
    timeout?: number;
    location?: {
        country?: string;
        languages?: string[];
    };
    mobile?: boolean;
    skipTlsVerification?: boolean;
    removeBase64Images?: boolean;
}
type Action = {
    type: "wait";
    milliseconds?: number;
    selector?: string;
} | {
    type: "click";
    selector: string;
} | {
    type: "screenshot";
    fullPage?: boolean;
} | {
    type: "write";
    text: string;
} | {
    type: "press";
    key: string;
} | {
    type: "scroll";
    direction?: "up" | "down";
    selector?: string;
} | {
    type: "scrape";
} | {
    type: "executeJavascript";
    script: string;
};
interface ScrapeParams<LLMSchema extends zt.ZodSchema = any, ActionsSchema extends (Action[] | undefined) = undefined> extends CrawlScrapeOptions {
    extract?: {
        prompt?: string;
        schema?: LLMSchema;
        systemPrompt?: string;
    };
    actions?: ActionsSchema;
}
interface ActionsResult {
    screenshots: string[];
}
/**
 * Response interface for scraping operations.
 * Defines the structure of the response received after a scraping operation.
 */
interface ScrapeResponse<LLMResult = any, ActionsSchema extends (ActionsResult | never) = never> extends FirecrawlDocument<LLMResult, ActionsSchema> {
    success: true;
    warning?: string;
    error?: string;
}
/**
 * Parameters for crawling operations.
 * Includes options for both scraping and mapping during a crawl.
 */
interface CrawlParams {
    includePaths?: string[];
    excludePaths?: string[];
    maxDepth?: number;
    limit?: number;
    allowBackwardLinks?: boolean;
    allowExternalLinks?: boolean;
    ignoreSitemap?: boolean;
    scrapeOptions?: CrawlScrapeOptions;
    webhook?: string | {
        url: string;
        headers?: Record<string, string>;
    };
    deduplicateSimilarURLs?: boolean;
    ignoreQueryParameters?: boolean;
}
/**
 * Response interface for crawling operations.
 * Defines the structure of the response received after initiating a crawl.
 */
interface CrawlResponse {
    id?: string;
    url?: string;
    success: true;
    error?: string;
}
/**
 * Response interface for batch scrape operations.
 * Defines the structure of the response received after initiating a crawl.
 */
interface BatchScrapeResponse {
    id?: string;
    url?: string;
    success: true;
    error?: string;
}
/**
 * Response interface for job status checks.
 * Provides detailed status of a crawl job including progress and results.
 */
interface CrawlStatusResponse {
    success: true;
    status: "scraping" | "completed" | "failed" | "cancelled";
    completed: number;
    total: number;
    creditsUsed: number;
    expiresAt: Date;
    next?: string;
    data: FirecrawlDocument<undefined>[];
}
/**
 * Response interface for batch scrape job status checks.
 * Provides detailed status of a batch scrape job including progress and results.
 */
interface BatchScrapeStatusResponse {
    success: true;
    status: "scraping" | "completed" | "failed" | "cancelled";
    completed: number;
    total: number;
    creditsUsed: number;
    expiresAt: Date;
    next?: string;
    data: FirecrawlDocument<undefined>[];
}
/**
 * Parameters for mapping operations.
 * Defines options for mapping URLs during a crawl.
 */
interface MapParams {
    search?: string;
    ignoreSitemap?: boolean;
    includeSubdomains?: boolean;
    sitemapOnly?: boolean;
    limit?: number;
}
/**
 * Response interface for mapping operations.
 * Defines the structure of the response received after a mapping operation.
 */
interface MapResponse {
    success: true;
    links?: string[];
    error?: string;
}
interface SmartCrawlResponse {
    success: boolean;
    relevantUrls: string[];
    data: Array<{
        url: string;
        content: string;
    }>;
    stats: {
        totalScrapes: number;
        foundResults: number;
    };
}
interface SmartCrawlParams {
    limit?: number;
}
/**
 * Parameters for extracting information from URLs.
 * Defines options for extracting information from URLs.
 */
interface ExtractParams<LLMSchema extends zt.ZodSchema = any> {
    prompt: string;
    schema?: LLMSchema;
    systemPrompt?: string;
    allowExternalLinks?: boolean;
}
/**
 * Response interface for extracting information from URLs.
 * Defines the structure of the response received after extracting information from URLs.
 */
interface ExtractResponse<LLMSchema extends zt.ZodSchema = any> {
    success: boolean;
    data: LLMSchema;
    error?: string;
    warning?: string;
}
/**
 * Error response interface.
 * Defines the structure of the response received when an error occurs.
 */
interface ErrorResponse {
    success: false;
    error: string;
}
/**
 * Custom error class for Firecrawl.
 * Extends the built-in Error class to include a status code.
 */
declare class FirecrawlError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
/**
 * Main class for interacting with the Firecrawl API.
 * Provides methods for scraping, searching, crawling, and mapping web content.
 */
declare class FirecrawlApp {
    apiKey: string;
    apiUrl: string;
    private _anthropicApiKey;
    /**
     * Initializes a new instance of the FirecrawlApp class.
     * @param config - Configuration options for the FirecrawlApp instance.
     */
    constructor({ apiKey, apiUrl, anthropicApiKey }: FirecrawlAppConfig);
    get anthropicApiKey(): string;
    /**
     * Scrapes a URL using the Firecrawl API.
     * @param url - The URL to scrape.
     * @param params - Additional parameters for the scrape request.
     * @returns The response from the scrape operation.
     */
    scrapeUrl<T extends zt.ZodSchema, ActionsSchema extends (Action[] | undefined) = undefined>(url: string, params?: ScrapeParams<T, ActionsSchema>): Promise<ScrapeResponse<zt.infer<T>, ActionsSchema extends Action[] ? ActionsResult : never> | ErrorResponse>;
    /**
     * This method is intended to search for a query using the Firecrawl API. However, it is not supported in version 1 of the API.
     * @param query - The search query string.
     * @param params - Additional parameters for the search.
     * @returns Throws an error advising to use version 0 of the API.
     */
    search(query: string, params?: any): Promise<any>;
    /**
     * Initiates a crawl job for a URL using the Firecrawl API.
     * @param url - The URL to crawl.
     * @param params - Additional parameters for the crawl request.
     * @param pollInterval - Time in seconds for job status checks.
     * @param idempotencyKey - Optional idempotency key for the request.
     * @returns The response from the crawl operation.
     */
    crawlUrl(url: string, params?: CrawlParams, pollInterval?: number, idempotencyKey?: string): Promise<CrawlStatusResponse | ErrorResponse>;
    asyncCrawlUrl(url: string, params?: CrawlParams, idempotencyKey?: string): Promise<CrawlResponse | ErrorResponse>;
    /**
     * Checks the status of a crawl job using the Firecrawl API.
     * @param id - The ID of the crawl operation.
     * @param getAllData - Paginate through all the pages of documents, returning the full list of all documents. (default: `false`)
     * @returns The response containing the job status.
     */
    checkCrawlStatus(id?: string, getAllData?: boolean): Promise<CrawlStatusResponse | ErrorResponse>;
    /**
     * Cancels a crawl job using the Firecrawl API.
     * @param id - The ID of the crawl operation.
     * @returns The response from the cancel crawl operation.
     */
    cancelCrawl(id: string): Promise<ErrorResponse>;
    /**
     * Initiates a crawl job and returns a CrawlWatcher to monitor the job via WebSocket.
     * @param url - The URL to crawl.
     * @param params - Additional parameters for the crawl request.
     * @param idempotencyKey - Optional idempotency key for the request.
     * @returns A CrawlWatcher instance to monitor the crawl job.
     */
    crawlUrlAndWatch(url: string, params?: CrawlParams, idempotencyKey?: string): Promise<CrawlWatcher>;
    /**
     * Maps a URL using the Firecrawl API.
     * @param url - The URL to map.
     * @param params - Additional parameters for the map request.
     * @returns The response from the map operation.
     */
    mapUrl(url: string, params?: MapParams): Promise<MapResponse | ErrorResponse>;
    /**
     * Initiates a batch scrape job for multiple URLs using the Firecrawl API.
     * @param url - The URLs to scrape.
     * @param params - Additional parameters for the scrape request.
     * @param pollInterval - Time in seconds for job status checks.
     * @param idempotencyKey - Optional idempotency key for the request.
     * @param webhook - Optional webhook for the batch scrape.
     * @returns The response from the crawl operation.
     */
    batchScrapeUrls(urls: string[], params?: ScrapeParams, pollInterval?: number, idempotencyKey?: string, webhook?: CrawlParams["webhook"]): Promise<BatchScrapeStatusResponse | ErrorResponse>;
    asyncBatchScrapeUrls(urls: string[], params?: ScrapeParams, idempotencyKey?: string): Promise<BatchScrapeResponse | ErrorResponse>;
    /**
     * Initiates a batch scrape job and returns a CrawlWatcher to monitor the job via WebSocket.
     * @param urls - The URL to scrape.
     * @param params - Additional parameters for the scrape request.
     * @param idempotencyKey - Optional idempotency key for the request.
     * @returns A CrawlWatcher instance to monitor the crawl job.
     */
    batchScrapeUrlsAndWatch(urls: string[], params?: ScrapeParams, idempotencyKey?: string): Promise<CrawlWatcher>;
    /**
     * Checks the status of a batch scrape job using the Firecrawl API.
     * @param id - The ID of the batch scrape operation.
     * @param getAllData - Paginate through all the pages of documents, returning the full list of all documents. (default: `false`)
     * @returns The response containing the job status.
     */
    checkBatchScrapeStatus(id?: string, getAllData?: boolean): Promise<BatchScrapeStatusResponse | ErrorResponse>;
    /**
     * Intelligently crawls a website to find specific information based on a prompt.
     * @param url - The base URL to crawl
     * @param query - The information we're looking for
     * @param params - Optional parameters to control the smartCrawl
     * @returns SmartCrawlResponse containing relevant URLs and their data
     */
    smartCrawl(url: string, query: string, params?: SmartCrawlParams): Promise<SmartCrawlResponse | ErrorResponse>;
    /**
     * Extracts information from URLs using the Firecrawl API.
     * Currently in Beta. Expect breaking changes on future minor versions.
     * @param url - The URL to extract information from.
     * @param params - Additional parameters for the extract request.
     * @returns The response from the extract operation.
     */
    extract<T extends zt.ZodSchema = any>(urls: string[], params?: ExtractParams<T>): Promise<ExtractResponse<zt.infer<T>> | ErrorResponse>;
    /**
     * Prepares the headers for an API request.
     * @param idempotencyKey - Optional key to ensure idempotency.
     * @returns The prepared headers.
     */
    prepareHeaders(idempotencyKey?: string): AxiosRequestHeaders;
    /**
     * Sends a POST request to the specified URL.
     * @param url - The URL to send the request to.
     * @param data - The data to send in the request.
     * @param headers - The headers for the request.
     * @returns The response from the POST request.
     */
    postRequest(url: string, data: any, headers: AxiosRequestHeaders): Promise<AxiosResponse>;
    /**
     * Sends a GET request to the specified URL.
     * @param url - The URL to send the request to.
     * @param headers - The headers for the request.
     * @returns The response from the GET request.
     */
    getRequest(url: string, headers: AxiosRequestHeaders): Promise<AxiosResponse>;
    /**
     * Sends a DELETE request to the specified URL.
     * @param url - The URL to send the request to.
     * @param headers - The headers for the request.
     * @returns The response from the DELETE request.
     */
    deleteRequest(url: string, headers: AxiosRequestHeaders): Promise<AxiosResponse>;
    /**
     * Monitors the status of a crawl job until completion or failure.
     * @param id - The ID of the crawl operation.
     * @param headers - The headers for the request.
     * @param checkInterval - Interval in seconds for job status checks.
     * @param checkUrl - Optional URL to check the status (used for v1 API)
     * @returns The final job status or data.
     */
    monitorJobStatus(id: string, headers: AxiosRequestHeaders, checkInterval: number): Promise<CrawlStatusResponse | ErrorResponse>;
    /**
     * Handles errors from API responses.
     * @param {AxiosResponse} response - The response from the API.
     * @param {string} action - The action being performed when the error occurred.
     */
    handleError(response: AxiosResponse, action: string): void;
}
interface CrawlWatcherEvents {
    document: CustomEvent<FirecrawlDocument<undefined>>;
    done: CustomEvent<{
        status: CrawlStatusResponse["status"];
        data: FirecrawlDocument<undefined>[];
    }>;
    error: CustomEvent<{
        status: CrawlStatusResponse["status"];
        data: FirecrawlDocument<undefined>[];
        error: string;
    }>;
}
declare class CrawlWatcher extends TypedEventTarget<CrawlWatcherEvents> {
    private ws;
    data: FirecrawlDocument<undefined>[];
    status: CrawlStatusResponse["status"];
    constructor(id: string, app: FirecrawlApp);
    close(): void;
}

export { type Action, type ActionsResult, type BatchScrapeResponse, type BatchScrapeStatusResponse, type CrawlParams, type CrawlResponse, type CrawlScrapeOptions, type CrawlStatusResponse, CrawlWatcher, type ErrorResponse, type ExtractParams, type ExtractResponse, type FirecrawlAppConfig, type FirecrawlDocument, type FirecrawlDocumentMetadata, FirecrawlError, type MapParams, type MapResponse, type ScrapeParams, type ScrapeResponse, FirecrawlApp as default };
