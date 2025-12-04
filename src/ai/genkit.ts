import { genkit } from 'genkit';

// Configure for OpenRouter directly
const openRouterKey = process.env.OPENROUTER_API_KEY;

export const ai = genkit({
  plugins: [],
  model: 'openai/gpt-4o-mini',
});

// OpenRouter API key is loaded from environment
// Configuration is handled silently - no console output in production