'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting yearly tasks based on user-provided goals.
 *
 * - `suggestYearlyTasks`:  The function that takes yearly goals as input and returns AI-powered task suggestions.
 * - `SuggestYearlyTasksInput`: The input type for the `suggestYearlyTasks` function.
 * - `SuggestYearlyTasksOutput`: The output type for the `suggestYearlyTasks` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestYearlyTasksInputSchema = z.object({
  yearlyGoals: z
    .string()
    .describe('The user-defined goals for the year. Be as specific as possible.'),
});
export type SuggestYearlyTasksInput = z.infer<typeof SuggestYearlyTasksInputSchema>;

const SuggestYearlyTasksOutputSchema = z.object({
  suggestedTasks: z
    .string()
    .describe('A list of suggested tasks to help achieve the yearly goals.'),
});
export type SuggestYearlyTasksOutput = z.infer<typeof SuggestYearlyTasksOutputSchema>;

export async function suggestYearlyTasks(input: SuggestYearlyTasksInput): Promise<SuggestYearlyTasksOutput> {
  return suggestYearlyTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestYearlyTasksPrompt',
  input: {schema: SuggestYearlyTasksInputSchema},
  output: {schema: SuggestYearlyTasksOutputSchema},
  prompt: `You are an AI task suggestion assistant.  A user will provide their yearly goals, and you will suggest specific tasks that they can add to their yearly plan to help them achieve those goals.

Yearly Goals: {{{yearlyGoals}}}

Suggested Tasks:`,
});

const suggestYearlyTasksFlow = ai.defineFlow(
  {
    name: 'suggestYearlyTasksFlow',
    inputSchema: SuggestYearlyTasksInputSchema,
    outputSchema: SuggestYearlyTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
