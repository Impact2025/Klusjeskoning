'use server';
/**
 * @fileOverview Generates chore ideas based on a keyword or theme using AI.
 *
 * - generateChoreIdeas - A function that generates chore ideas.
 * - GenerateChoreIdeasInput - The input type for the generateChoreIdeas function.
 * - GenerateChoreIdeasOutput - The return type for the generateChoreIdeas function.
 */

import {z} from 'zod';

const GenerateChoreIdeasInputSchema = z.object({
  keyword: z.string().describe('Keyword or theme to generate chore ideas.'),
});
export type GenerateChoreIdeasInput = z.infer<typeof GenerateChoreIdeasInputSchema>;

const GenerateChoreIdeasOutputSchema = z.array(
  z.object({
    name: z.string().describe('Name of the chore.'),
    points: z.number().describe('Points associated with the chore.'),
  })
);
export type GenerateChoreIdeasOutput = z.infer<typeof GenerateChoreIdeasOutputSchema>;

// Function to generate chore ideas using OpenRouter API directly
async function callOpenRouterAPI(keyword: string): Promise<GenerateChoreIdeasOutput> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const prompt = `Je bent een behulpzame assistent voor ouders die een klusjes-app gebruiken voor kinderen van 8-12 jaar. Genereer een lijst van 5 tot 7 leeftijdsspecifieke klusjes gebaseerd op het volgende thema/keyword. Geef voor elk klusje een geschatte puntwaarde, waarbij 5 punten een heel makkelijke taak is en 50 punten een moeilijke. Antwoord met een JSON array van objecten, waarbij elk object een 'name' (string) en 'points' (number) veld heeft.

Keyword: ${keyword}

Geef je antwoord als een JSON array met deze structuur:
[
  {
    "name": "Naam van het klusje",
    "points": 10
  }
]`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'KlusjesKoning Chore Ideas Generator',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een behulpzame assistent voor ouders die een klusjes-app gebruiken. Geef altijd je antwoorden in het Nederlands en in JSON formaat.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content returned from OpenRouter API');
  }

  try {
    // Parse the JSON response
    const parsedContent = JSON.parse(content);
    // If the response is wrapped in an object, extract the array
    const chores = Array.isArray(parsedContent) ? parsedContent : parsedContent.chores || parsedContent.ideas || [];
    return chores;
  } catch (error) {
    console.error('Error parsing OpenRouter response:', content);
    throw new Error('Failed to parse response from OpenRouter API');
  }
}

export async function generateChoreIdeas(input: GenerateChoreIdeasInput): Promise<GenerateChoreIdeasOutput> {
  return callOpenRouterAPI(input.keyword);
}
