'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting daily tasks based on user goals.
 *
 * - suggestDailyTasks - A function that takes daily goals as input and returns suggested tasks.
 * - SuggestDailyTasksInput - The input type for the suggestDailyTasks function.
 * - SuggestDailyTasksOutput - The return type for the suggestDailyTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDailyTasksInputSchema = z.object({
  dailyGoals: z
    .string()
    .describe('The user specified goals for the day.'),
});
export type SuggestDailyTasksInput = z.infer<typeof SuggestDailyTasksInputSchema>;

const SuggestDailyTasksOutputSchema = z.object({
  suggestedTasks: z
    .string()
    .describe('A list of tasks suggested by the AI to achieve the stated goals.'),
});
export type SuggestDailyTasksOutput = z.infer<typeof SuggestDailyTasksOutputSchema>;

export async function suggestDailyTasks(input: SuggestDailyTasksInput): Promise<SuggestDailyTasksOutput> {
  return suggestDailyTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDailyTasksPrompt',
  input: {schema: SuggestDailyTasksInputSchema},
  output: {schema: SuggestDailyTasksOutputSchema},
  prompt: `You are a personal assistant helping the user plan their day.

The user will provide their goals for the day, and you will respond with a list of suggested tasks to help them achieve those goals.

Goals: {{{dailyGoals}}}

Tasks:`,
});

const suggestDailyTasksFlow = ai.defineFlow(
  {
    name: 'suggestDailyTasksFlow',
    inputSchema: SuggestDailyTasksInputSchema,
    outputSchema: SuggestDailyTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
