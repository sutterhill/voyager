import { z } from "zod";
import { EngineScrapeResult } from "..";
import { Meta } from "../..";
import { TimeoutError } from "../../error";
import { robustFetch } from "../../lib/fetch";

export async function scrapeURLWithPlaywright(meta: Meta): Promise<EngineScrapeResult> {
    const timeout = 20000 + meta.options.waitFor;
    const response = await Promise.race([
        await robustFetch({
            url: process.env.PLAYWRIGHT_MICROSERVICE_URL!,
            headers: {
                "Content-Type": "application/json",
            },
            body: {
                url: meta.url,
                wait_after_load: meta.options.waitFor,
                timeout,
                headers: meta.options.headers,
            },
            method: "POST",
            logger: meta.logger.child("scrapeURLWithPlaywright/robustFetch"),
            schema: z.object({
                content: z.string(),
                pageStatusCode: z.number(),
                pageError: z.union([z.string(), z.boolean()]).optional(),
            }).passthrough(),
        }),
        (async () => {
            await new Promise((resolve) => setTimeout(() => resolve(null), 20000));
            throw new TimeoutError("Playwright was unable to scrape the page before timing out", { cause: { timeout } });
        })(),
    ]);

    // Convert pageError to the correct type required by EngineScrapeResult
    let pageError: string | undefined;
    if (typeof response.pageError === 'string') {
        pageError = response.pageError;
    } else if (response.pageError === true) {
        pageError = 'Unknown page error occurred';
    } else {
        pageError = undefined;
    }

    return {
        url: meta.url, // TODO: impove redirect following
        html: response.content,
        statusCode: response.pageStatusCode,
        error: pageError,
    }
}