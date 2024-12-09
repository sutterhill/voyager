import { Anthropic } from '@anthropic-ai/sdk';

interface FindUrlsResponse {
  urls: string[];
  error?: string;
}

export async function findRelevantUrls(query: string, urls: string[]): Promise<FindUrlsResponse> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    // Construct the prompt
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
`



    // Make request to Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 4096,
      system: 'You are an expert system designed to analyze URLs and determine their relevance to specific queries. Your task is to filter a list of URLs and return only those that are likely to contain information related to a given query.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log('Response from Claude:', message.content);
    
    // Check if we have a valid text response
    const textContent = message.content.find(block => 'type' in block && block.type === 'text');
    if (!textContent || !('text' in textContent)) {
      return {
        urls: [],
        error: 'Invalid response from Claude'
      };
    }

    // Extract content between <relevant_urls> tags
    const match = textContent.text.match(/<relevant_urls>([\s\S]*?)<\/relevant_urls>/);
    if (!match || !match[1]) {
      return {
        urls: [],
        error: 'Could not find relevant_urls tags in response'
      };
    }

    const relevantUrls = match[1]
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean) // Remove empty lines
      .map(line => line.startsWith('- ') ? line.slice(2) : line) // Remove dash prefix
      .filter(url => url !== '...'); // Remove placeholder entries

    return {
      urls: relevantUrls,
    };

  } catch (error) {
    console.error('Error making request to Claude:', error);
    return {
      urls: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
