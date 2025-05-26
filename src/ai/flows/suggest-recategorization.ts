'use server';

/**
 * @fileOverview This file defines a Genkit flow that analyzes action items and suggests recategorization.
 *
 * - suggestRecategorization - A function that analyzes action items and suggests a bucket recategorization.
 * - SuggestRecategorizationInput - The input type for the suggestRecategorization function.
 * - SuggestRecategorizationOutput - The return type for the suggestRecategorization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRecategorizationInputSchema = z.object({
  actionItem: z.string().describe('The text content of the action item to analyze.'),
  currentBucket: z.enum(['control', 'influence', 'acceptance']).describe('The current bucket the action item is in.'),
});
export type SuggestRecategorizationInput = z.infer<typeof SuggestRecategorizationInputSchema>;

const SuggestRecategorizationOutputSchema = z.object({
  suggestedBucket: z
    .enum(['control', 'influence', 'acceptance'])
    .optional()
    .describe('The suggested bucket for the action item, if a clear mismatch is detected.'),
  reasoning: z.string().optional().describe('The reasoning behind the suggested recategorization.'),
});
export type SuggestRecategorizationOutput = z.infer<typeof SuggestRecategorizationOutputSchema>;

export async function suggestRecategorization(input: SuggestRecategorizationInput): Promise<SuggestRecategorizationOutput> {
  return suggestRecategorizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRecategorizationPrompt',
  input: {schema: SuggestRecategorizationInputSchema},
  output: {schema: SuggestRecategorizationOutputSchema},
  prompt: `You are an AI assistant that helps users categorize action items into one of three buckets: control, influence, or acceptance.

  - Control: Action items that you have direct control over.
  - Influence: Action items that you can influence, but not directly control.
  - Acceptance: Action items that you must accept, as you have little to no control or influence over them.

You are given an action item and its current bucket. Analyze the action item and determine if it is miscategorized.
If the action item clearly belongs in a different bucket, suggest the correct bucket and explain your reasoning. Only suggest recategorization when there is clear evidence. If the categorization is correct, return empty suggestedBucket.

Action Item: {{{actionItem}}}
Current Bucket: {{{currentBucket}}}

{
  "suggestedBucket": "", // "control", "influence", or "acceptance", or empty string if no change is suggested
  "reasoning": ""
}
`,
});

const suggestRecategorizationFlow = ai.defineFlow(
  {
    name: 'suggestRecategorizationFlow',
    inputSchema: SuggestRecategorizationInputSchema,
    outputSchema: SuggestRecategorizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
