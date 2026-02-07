'use server';
/**
 * @fileOverview AI-powered task suggestions for weekly plans.
 *
 * - suggestWeeklyTasks - A function that takes weekly goals as input and returns AI-generated task suggestions.
 * - SuggestWeeklyTasksInput - The input type for the suggestWeeklyTasks function.
 * - SuggestWeeklyTasksOutput - The return type for the suggestWeeklyTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWeeklyTasksInputSchema = z.object({
  weeklyGoals: z
    .string()
    .describe('The user-defined goals for the week.'),
});
export type SuggestWeeklyTasksInput = z.infer<typeof SuggestWeeklyTasksInputSchema>;

const SuggestWeeklyTasksOutputSchema = z.object({
  suggestedTasks: z
    .array(z.string())
    .describe('A list of AI-generated task suggestions to achieve the weekly goals.'),
});
export type SuggestWeeklyTasksOutput = z.infer<typeof SuggestWeeklyTasksOutputSchema>;

export async function suggestWeeklyTasks(input: SuggestWeeklyTasksInput): Promise<SuggestWeeklyTasksOutput> {
  return suggestWeeklyTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWeeklyTasksPrompt',
  input: {schema: SuggestWeeklyTasksInputSchema},
  output: {schema: SuggestWeeklyTasksOutputSchema},
  prompt: `You are a personal planning assistant. The user will provide their goals for the week, and you will respond with a list of suggested tasks to help them achieve those goals.

  Goals: {{{weeklyGoals}}}

  Tasks:`,
});

const suggestWeeklyTasksFlow = ai.defineFlow(
  {
    name: 'suggestWeeklyTasksFlow',
    inputSchema: SuggestWeeklyTasksInputSchema,
    outputSchema: SuggestWeeklyTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
