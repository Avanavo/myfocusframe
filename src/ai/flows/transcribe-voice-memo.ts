'use server';

/**
 * @fileOverview Transcribes a voice memo into text.
 *
 * - transcribeVoiceMemo - A function that transcribes the voice memo.
 * - TranscribeVoiceMemoInput - The input type for the transcribeVoiceMemo function.
 * - TranscribeVoiceMemoOutput - The return type for the transcribeVoiceMemo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeVoiceMemoInputSchema = z.object({
  voiceMemoDataUri: z
    .string()
    .describe(
      "A voice memo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeVoiceMemoInput = z.infer<typeof TranscribeVoiceMemoInputSchema>;

const TranscribeVoiceMemoOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the voice memo.'),
});
export type TranscribeVoiceMemoOutput = z.infer<typeof TranscribeVoiceMemoOutputSchema>;

export async function transcribeVoiceMemo(input: TranscribeVoiceMemoInput): Promise<TranscribeVoiceMemoOutput> {
  return transcribeVoiceMemoFlow(input);
}

const transcribeVoiceMemoPrompt = ai.definePrompt({
  name: 'transcribeVoiceMemoPrompt',
  input: {schema: TranscribeVoiceMemoInputSchema},
  output: {schema: TranscribeVoiceMemoOutputSchema},
  prompt: `Transcribe the following voice memo to text:

Voice Memo: {{media url=voiceMemoDataUri}}`,
});

const transcribeVoiceMemoFlow = ai.defineFlow(
  {
    name: 'transcribeVoiceMemoFlow',
    inputSchema: TranscribeVoiceMemoInputSchema,
    outputSchema: TranscribeVoiceMemoOutputSchema,
  },
  async input => {
    const {output} = await transcribeVoiceMemoPrompt(input);
    return output!;
  }
);
