"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  CrawlWatcher: () => CrawlWatcher,
  FirecrawlError: () => FirecrawlError,
  default: () => FirecrawlApp
});
module.exports = __toCommonJS(src_exports);
var import_axios = __toESM(require("axios"), 1);
var import_zod_to_json_schema = require("zod-to-json-schema");
var import_isows = require("isows");
var import_typescript_event_target = require("typescript-event-target");

// src/anthropic.ts
var import_sdk = require("@anthropic-ai/sdk");
async function findRelevantUrls(query, urls, anthropic) {
  try {
    const prompt = `Here are the inputs for your analysis:

<url_list>
${urls}
</url_list>

<query>
${query}
</query>

Please follow these steps to complete the task:

1. Analyze the query to understand its key components and intent.
2. Review each URL in the provided list.
3. Determine if each URL is relevant to the query based on its structure, domain, and any visible content in the URL itself.
4. Compile a list of at least 10 relevant URLs. If url_list contains fewer than 10 URLs, it is acceptable to return fewer than 10 URLs.
5. If fewer than 10 relevant URLs are found, include the most potentially relevant URLs to reach a minimum of 10.


Provide the list of relevant URLs in the following format:

<relevant_urls>
- URL1
- URL2
- URL3
...
</relevant_urls>

Remember:
- Return only the list of relevant URLs, with no additional text or explanation outside the tags.
- Ensure that you provide at least 10 URLs in your final list, unless url_list contains fewer than 10 URLs.
`;
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 4096,
      system: "You are an expert system designed to analyze URLs and determine their relevance to specific queries. Your task is to filter a list of URLs and return only those that are likely to contain information related to a given query.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    console.log("Response from Claude:", message.content);
    const textContent = message.content.find((block) => "type" in block && block.type === "text");
    if (!textContent || !("text" in textContent)) {
      return {
        urls: [],
        error: "Invalid response from Claude"
      };
    }
    const match = textContent.text.match(/<relevant_urls>([\s\S]*?)<\/relevant_urls>/);
    if (!match || !match[1]) {
      return {
        urls: [],
        error: "Could not find relevant_urls tags in response"
      };
    }
    const relevantUrls = match[1].split("\n").map((line) => line.trim()).filter(Boolean).map((line) => line.startsWith("- ") ? line.slice(2) : line).filter((url) => url !== "...");
    return {
      urls: relevantUrls
    };
  } catch (error) {
    console.error("Error making request to Claude:", error);
    return {
      urls: [],
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// src/index.ts
var import_zod = require("zod");
var import_sdk2 = __toESM(require("@anthropic-ai/sdk"), 1);
var FirecrawlError = class extends Error {
  statusCode;
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
};
var FirecrawlApp = class {
  apiKey;
  apiUrl;
  _anthropicApiKey;
  /**
   * Initializes a new instance of the FirecrawlApp class.
   * @param config - Configuration options for the FirecrawlApp instance.
   */
  constructor({ apiKey = null, apiUrl = null, anthropicApiKey = "" }) {
    if (typeof apiKey !== "string") {
      throw new FirecrawlError("No API key provided", 401);
    }
    this.apiKey = apiKey;
    this.apiUrl = apiUrl || "https://api.firecrawl.dev";
    this._anthropicApiKey = anthropicApiKey;
  }
  get anthropicApiKey() {
    return this._anthropicApiKey;
  }
  /**
   * Scrapes a URL using the Firecrawl API.
   * @param url - The URL to scrape.
   * @param params - Additional parameters for the scrape request.
   * @returns The response from the scrape operation.
   */
  async scrapeUrl(url, params) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`
    };
    let jsonData = { url, ...params };
    if (jsonData?.extract?.schema) {
      let schema = jsonData.extract.schema;
      try {
        schema = (0, import_zod_to_json_schema.zodToJsonSchema)(schema);
      } catch (error) {
      }
      jsonData = {
        ...jsonData,
        extract: {
          ...jsonData.extract,
          schema
        }
      };
    }
    try {
      const response = await import_axios.default.post(
        this.apiUrl + `/v1/scrape`,
        jsonData,
        { headers }
      );
      if (response.status === 200) {
        const responseData = response.data;
        if (responseData.success) {
          return {
            success: true,
            warning: responseData.warning,
            error: responseData.error,
            ...responseData.data
          };
        } else {
          throw new FirecrawlError(`Failed to scrape URL. Error: ${responseData.error}`, response.status);
        }
      } else {
        this.handleError(response, "scrape URL");
      }
    } catch (error) {
      this.handleError(error.response, "scrape URL");
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * This method is intended to search for a query using the Firecrawl API. However, it is not supported in version 1 of the API.
   * @param query - The search query string.
   * @param params - Additional parameters for the search.
   * @returns Throws an error advising to use version 0 of the API.
   */
  async search(query, params) {
    throw new FirecrawlError("Search is not supported in v1, please downgrade Firecrawl to 0.0.36.", 400);
  }
  /**
   * Initiates a crawl job for a URL using the Firecrawl API.
   * @param url - The URL to crawl.
   * @param params - Additional parameters for the crawl request.
   * @param pollInterval - Time in seconds for job status checks.
   * @param idempotencyKey - Optional idempotency key for the request.
   * @returns The response from the crawl operation.
   */
  async crawlUrl(url, params, pollInterval = 2, idempotencyKey) {
    const headers = this.prepareHeaders(idempotencyKey);
    let jsonData = { url, ...params };
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/crawl`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        const id = response.data.id;
        return this.monitorJobStatus(id, headers, pollInterval);
      } else {
        this.handleError(response, "start crawl job");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  async asyncCrawlUrl(url, params, idempotencyKey) {
    const headers = this.prepareHeaders(idempotencyKey);
    let jsonData = { url, ...params };
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/crawl`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "start crawl job");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Checks the status of a crawl job using the Firecrawl API.
   * @param id - The ID of the crawl operation.
   * @param getAllData - Paginate through all the pages of documents, returning the full list of all documents. (default: `false`)
   * @returns The response containing the job status.
   */
  async checkCrawlStatus(id, getAllData = false) {
    if (!id) {
      throw new FirecrawlError("No crawl ID provided", 400);
    }
    const headers = this.prepareHeaders();
    try {
      const response = await this.getRequest(
        `${this.apiUrl}/v1/crawl/${id}`,
        headers
      );
      if (response.status === 200) {
        let allData = response.data.data;
        if (getAllData && response.data.status === "completed") {
          let statusData = response.data;
          if ("data" in statusData) {
            let data = statusData.data;
            while ("next" in statusData) {
              statusData = (await this.getRequest(statusData.next, headers)).data;
              data = data.concat(statusData.data);
            }
            allData = data;
          }
        }
        return {
          success: response.data.success,
          status: response.data.status,
          total: response.data.total,
          completed: response.data.completed,
          creditsUsed: response.data.creditsUsed,
          expiresAt: new Date(response.data.expiresAt),
          next: response.data.next,
          data: allData,
          error: response.data.error
        };
      } else {
        this.handleError(response, "check crawl status");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Cancels a crawl job using the Firecrawl API.
   * @param id - The ID of the crawl operation.
   * @returns The response from the cancel crawl operation.
   */
  async cancelCrawl(id) {
    const headers = this.prepareHeaders();
    try {
      const response = await this.deleteRequest(
        `${this.apiUrl}/v1/crawl/${id}`,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "cancel crawl job");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Initiates a crawl job and returns a CrawlWatcher to monitor the job via WebSocket.
   * @param url - The URL to crawl.
   * @param params - Additional parameters for the crawl request.
   * @param idempotencyKey - Optional idempotency key for the request.
   * @returns A CrawlWatcher instance to monitor the crawl job.
   */
  async crawlUrlAndWatch(url, params, idempotencyKey) {
    const crawl = await this.asyncCrawlUrl(url, params, idempotencyKey);
    if (crawl.success && crawl.id) {
      const id = crawl.id;
      return new CrawlWatcher(id, this);
    }
    throw new FirecrawlError("Crawl job failed to start", 400);
  }
  /**
   * Maps a URL using the Firecrawl API.
   * @param url - The URL to map.
   * @param params - Additional parameters for the map request.
   * @returns The response from the map operation.
   */
  async mapUrl(url, params) {
    const headers = this.prepareHeaders();
    let jsonData = { url, ...params };
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/map`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "map");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Initiates a batch scrape job for multiple URLs using the Firecrawl API.
   * @param url - The URLs to scrape.
   * @param params - Additional parameters for the scrape request.
   * @param pollInterval - Time in seconds for job status checks.
   * @param idempotencyKey - Optional idempotency key for the request.
   * @param webhook - Optional webhook for the batch scrape.
   * @returns The response from the crawl operation.
   */
  async batchScrapeUrls(urls, params, pollInterval = 2, idempotencyKey, webhook) {
    const headers = this.prepareHeaders(idempotencyKey);
    let jsonData = { urls, ...params ?? {}, webhook };
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/batch/scrape`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        const id = response.data.id;
        return this.monitorJobStatus(id, headers, pollInterval);
      } else {
        this.handleError(response, "start batch scrape job");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  async asyncBatchScrapeUrls(urls, params, idempotencyKey) {
    const headers = this.prepareHeaders(idempotencyKey);
    let jsonData = { urls, ...params ?? {} };
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/batch/scrape`,
        jsonData,
        headers
      );
      if (response.status === 200) {
        return response.data;
      } else {
        this.handleError(response, "start batch scrape job");
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new FirecrawlError(`Request failed with status code ${error.response.status}. Error: ${error.response.data.error} ${error.response.data.details ? ` - ${JSON.stringify(error.response.data.details)}` : ""}`, error.response.status);
      } else {
        throw new FirecrawlError(error.message, 500);
      }
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Initiates a batch scrape job and returns a CrawlWatcher to monitor the job via WebSocket.
   * @param urls - The URL to scrape.
   * @param params - Additional parameters for the scrape request.
   * @param idempotencyKey - Optional idempotency key for the request.
   * @returns A CrawlWatcher instance to monitor the crawl job.
   */
  async batchScrapeUrlsAndWatch(urls, params, idempotencyKey) {
    const crawl = await this.asyncBatchScrapeUrls(urls, params, idempotencyKey);
    if (crawl.success && crawl.id) {
      const id = crawl.id;
      return new CrawlWatcher(id, this);
    }
    throw new FirecrawlError("Batch scrape job failed to start", 400);
  }
  /**
   * Checks the status of a batch scrape job using the Firecrawl API.
   * @param id - The ID of the batch scrape operation.
   * @param getAllData - Paginate through all the pages of documents, returning the full list of all documents. (default: `false`)
   * @returns The response containing the job status.
   */
  async checkBatchScrapeStatus(id, getAllData = false) {
    if (!id) {
      throw new FirecrawlError("No batch scrape ID provided", 400);
    }
    const headers = this.prepareHeaders();
    try {
      const response = await this.getRequest(
        `${this.apiUrl}/v1/batch/scrape/${id}`,
        headers
      );
      if (response.status === 200) {
        let allData = response.data.data;
        if (getAllData && response.data.status === "completed") {
          let statusData = response.data;
          if ("data" in statusData) {
            let data = statusData.data;
            while ("next" in statusData) {
              statusData = (await this.getRequest(statusData.next, headers)).data;
              data = data.concat(statusData.data);
            }
            allData = data;
          }
        }
        return {
          success: response.data.success,
          status: response.data.status,
          total: response.data.total,
          completed: response.data.completed,
          creditsUsed: response.data.creditsUsed,
          expiresAt: new Date(response.data.expiresAt),
          next: response.data.next,
          data: allData,
          error: response.data.error
        };
      } else {
        this.handleError(response, "check batch scrape status");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Intelligently crawls a website to find specific information based on a prompt.
   * @param url - The base URL to crawl
   * @param query - The information we're looking for
   * @param params - Optional parameters to control the smartCrawl
   * @returns SmartCrawlResponse containing relevant URLs and their data
   */
  async smartCrawl(url, query, params) {
    const anthropic = new import_sdk2.default({
      apiKey: this.anthropicApiKey
    });
    const scrapeLimit = params?.limit ?? 20;
    const MIN_FOUND_RESULTS = 1;
    let totalScrapes = 0;
    const foundData = [];
    const scrapedUrls = /* @__PURE__ */ new Set();
    try {
      const mapResult = await this.mapUrl(url);
      if (!mapResult.success || !mapResult.links) {
        return {
          success: false,
          error: "No links found to scrape."
        };
      }
      const extractSchema = import_zod.z.object({
        data: import_zod.z.string(),
        found: import_zod.z.boolean()
      });
      const scrapeUrlBatch = async (urlsToScrape) => {
        const scrapePromises = urlsToScrape.map(async (urlToScrape) => {
          if (scrapedUrls.has(urlToScrape)) return null;
          scrapedUrls.add(urlToScrape);
          totalScrapes++;
          try {
            const result = await this.scrapeUrl(urlToScrape, {
              formats: ["extract", "links"],
              onlyMainContent: true,
              extract: {
                prompt: query,
                systemPrompt: "You are a helpful assistant that extracts data from websites. Make sure to only return the data that is relevant to the query. Set found to false if the data is not found.",
                schema: extractSchema
              }
            });
            if (!result.success) {
              console.warn(`Failed to scrape URL ${urlToScrape}:`, result.error);
              return null;
            }
            console.log(`Scraped ${urlToScrape} - ${result.extract?.found ? "found" : "not found"}`);
            return {
              url: urlToScrape,
              success: result.success,
              found: result.extract?.found || false,
              content: result.extract?.data || ""
            };
          } catch (error) {
            console.error(`Failed to scrape URL ${urlToScrape}:`, error);
            return null;
          }
        });
        const results = await Promise.all(scrapePromises);
        return results.filter((r) => r !== null);
      };
      let remainingUrls = [...mapResult.links];
      while (foundData.length < MIN_FOUND_RESULTS && totalScrapes < scrapeLimit && remainingUrls.length > 0) {
        const relevantUrlsRes = await findRelevantUrls(query, remainingUrls, anthropic);
        if (relevantUrlsRes.error || !relevantUrlsRes.urls.length) {
          break;
        }
        const nextBatch = relevantUrlsRes.urls.slice(0, 5);
        const scrapeResults = await scrapeUrlBatch(nextBatch);
        const successfulFinds = scrapeResults.filter((r) => r.success && r.found);
        const failedFinds = scrapeResults.filter((r) => r.success && !r.found).map((r) => r.url);
        successfulFinds.forEach((result) => {
          foundData.push({
            url: result.url,
            content: result.content
          });
        });
        remainingUrls = remainingUrls.filter(
          (url2) => !nextBatch.includes(url2) && !scrapedUrls.has(url2)
        );
      }
      return {
        success: true,
        relevantUrls: Array.from(scrapedUrls),
        // TODO(ishaan): testing out just returning the first found
        data: foundData.length > 0 ? [foundData[0]] : [],
        stats: {
          totalScrapes,
          foundResults: foundData.length
        }
      };
    } catch (error) {
      return {
        success: false,
        relevantUrls: Array.from(scrapedUrls),
        data: foundData,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        stats: {
          totalScrapes,
          foundResults: foundData.length
        }
      };
    }
  }
  /**
   * Extracts information from URLs using the Firecrawl API.
   * Currently in Beta. Expect breaking changes on future minor versions.
   * @param url - The URL to extract information from.
   * @param params - Additional parameters for the extract request.
   * @returns The response from the extract operation.
   */
  async extract(urls, params) {
    const headers = this.prepareHeaders();
    if (!params?.prompt) {
      throw new FirecrawlError("Prompt is required", 400);
    }
    let jsonData = { urls, ...params };
    let jsonSchema;
    try {
      jsonSchema = params?.schema ? (0, import_zod_to_json_schema.zodToJsonSchema)(params.schema) : void 0;
    } catch (error) {
      throw new FirecrawlError("Invalid schema. Use a valid Zod schema.", 400);
    }
    try {
      const response = await this.postRequest(
        this.apiUrl + `/v1/extract`,
        { ...jsonData, schema: jsonSchema },
        headers
      );
      if (response.status === 200) {
        const responseData = response.data;
        if (responseData.success) {
          return {
            success: true,
            data: responseData.data,
            warning: responseData.warning,
            error: responseData.error
          };
        } else {
          throw new FirecrawlError(`Failed to scrape URL. Error: ${responseData.error}`, response.status);
        }
      } else {
        this.handleError(response, "extract");
      }
    } catch (error) {
      throw new FirecrawlError(error.message, 500);
    }
    return { success: false, error: "Internal server error." };
  }
  /**
   * Prepares the headers for an API request.
   * @param idempotencyKey - Optional key to ensure idempotency.
   * @returns The prepared headers.
   */
  prepareHeaders(idempotencyKey) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      ...idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}
    };
  }
  /**
   * Sends a POST request to the specified URL.
   * @param url - The URL to send the request to.
   * @param data - The data to send in the request.
   * @param headers - The headers for the request.
   * @returns The response from the POST request.
   */
  postRequest(url, data, headers) {
    return import_axios.default.post(url, data, { headers });
  }
  /**
   * Sends a GET request to the specified URL.
   * @param url - The URL to send the request to.
   * @param headers - The headers for the request.
   * @returns The response from the GET request.
   */
  async getRequest(url, headers) {
    try {
      return await import_axios.default.get(url, { headers });
    } catch (error) {
      if (error instanceof import_axios.AxiosError && error.response) {
        return error.response;
      } else {
        throw error;
      }
    }
  }
  /**
   * Sends a DELETE request to the specified URL.
   * @param url - The URL to send the request to.
   * @param headers - The headers for the request.
   * @returns The response from the DELETE request.
   */
  async deleteRequest(url, headers) {
    try {
      return await import_axios.default.delete(url, { headers });
    } catch (error) {
      if (error instanceof import_axios.AxiosError && error.response) {
        return error.response;
      } else {
        throw error;
      }
    }
  }
  /**
   * Monitors the status of a crawl job until completion or failure.
   * @param id - The ID of the crawl operation.
   * @param headers - The headers for the request.
   * @param checkInterval - Interval in seconds for job status checks.
   * @param checkUrl - Optional URL to check the status (used for v1 API)
   * @returns The final job status or data.
   */
  async monitorJobStatus(id, headers, checkInterval) {
    while (true) {
      let statusResponse = await this.getRequest(
        `${this.apiUrl}/v1/crawl/${id}`,
        headers
      );
      if (statusResponse.status === 200) {
        let statusData = statusResponse.data;
        if (statusData.status === "completed") {
          if ("data" in statusData) {
            let data = statusData.data;
            while ("next" in statusData) {
              statusResponse = await this.getRequest(statusData.next, headers);
              statusData = statusResponse.data;
              data = data.concat(statusData.data);
            }
            statusData.data = data;
            return statusData;
          } else {
            throw new FirecrawlError("Crawl job completed but no data was returned", 500);
          }
        } else if (["active", "paused", "pending", "queued", "waiting", "scraping"].includes(statusData.status)) {
          checkInterval = Math.max(checkInterval, 2);
          await new Promise(
            (resolve) => setTimeout(resolve, checkInterval * 1e3)
          );
        } else {
          throw new FirecrawlError(
            `Crawl job failed or was stopped. Status: ${statusData.status}`,
            500
          );
        }
      } else {
        this.handleError(statusResponse, "check crawl status");
      }
    }
  }
  /**
   * Handles errors from API responses.
   * @param {AxiosResponse} response - The response from the API.
   * @param {string} action - The action being performed when the error occurred.
   */
  handleError(response, action) {
    if ([402, 408, 409, 500].includes(response.status)) {
      const errorMessage = response.data.error || "Unknown error occurred";
      throw new FirecrawlError(
        `Failed to ${action}. Status code: ${response.status}. Error: ${errorMessage}`,
        response.status
      );
    } else {
      throw new FirecrawlError(
        `Unexpected error occurred while trying to ${action}. Status code: ${response.status}`,
        response.status
      );
    }
  }
};
var CrawlWatcher = class extends import_typescript_event_target.TypedEventTarget {
  ws;
  data;
  status;
  constructor(id, app) {
    super();
    this.ws = new import_isows.WebSocket(`${app.apiUrl}/v1/crawl/${id}`, app.apiKey);
    this.status = "scraping";
    this.data = [];
    const messageHandler = (msg) => {
      if (msg.type === "done") {
        this.status = "completed";
        this.dispatchTypedEvent("done", new CustomEvent("done", {
          detail: {
            status: this.status,
            data: this.data
          }
        }));
      } else if (msg.type === "error") {
        this.status = "failed";
        this.dispatchTypedEvent("error", new CustomEvent("error", {
          detail: {
            status: this.status,
            data: this.data,
            error: msg.error
          }
        }));
      } else if (msg.type === "catchup") {
        this.status = msg.data.status;
        this.data.push(...msg.data.data ?? []);
        for (const doc of this.data) {
          this.dispatchTypedEvent("document", new CustomEvent("document", {
            detail: doc
          }));
        }
      } else if (msg.type === "document") {
        this.dispatchTypedEvent("document", new CustomEvent("document", {
          detail: msg.data
        }));
      }
    };
    this.ws.onmessage = ((ev) => {
      if (typeof ev.data !== "string") {
        this.ws.close();
        return;
      }
      const msg = JSON.parse(ev.data);
      messageHandler(msg);
    }).bind(this);
    this.ws.onclose = ((ev) => {
      const msg = JSON.parse(ev.reason);
      messageHandler(msg);
    }).bind(this);
    this.ws.onerror = ((_) => {
      this.status = "failed";
      this.dispatchTypedEvent("error", new CustomEvent("error", {
        detail: {
          status: this.status,
          data: this.data,
          error: "WebSocket error"
        }
      }));
    }).bind(this);
  }
  close() {
    this.ws.close();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CrawlWatcher,
  FirecrawlError
});
