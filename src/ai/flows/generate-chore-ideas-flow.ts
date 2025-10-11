'use server';
/**
 * @fileOverview Generates chore ideas based on a keyword or theme using AI.
 *
 * - generateChoreIdeas - A function that generates chore ideas.
 * - GenerateChoreIdeasInput - The input type for the generateChoreIdeas function.
 * - GenerateChoreIdeasOutput - The return type for the generateChoreIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

export async function generateChoreIdeas(input: GenerateChoreIdeasInput): Promise<GenerateChoreIdeasOutput> {
  return generateChoreIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChoreIdeasPrompt',
  input: {schema: GenerateChoreIdeasInputSchema},
  output: {schema: GenerateChoreIdeasOutputSchema},
  prompt: `You are a helpful assistant for parents using a chore app for kids aged 8-12. Generate a list of 5 to 7 age-specific chores based on the following theme/keyword. For each chore, provide an estimated point value, where 5 points is a very easy task and 50 points is a difficult one. Answer with a JSON array of objects, where each object has a 'name' (string) and 'points' (number) key.

Keyword: {{{keyword}}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const generateChoreIdeasFlow = ai.defineFlow(
  {
    name: 'generateChoreIdeasFlow',
    inputSchema: GenerateChoreIdeasInputSchema,
    outputSchema: GenerateChoreIdeasOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
