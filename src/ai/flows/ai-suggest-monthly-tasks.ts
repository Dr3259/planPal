'use server';

/**
 * @fileOverview AI-powered task suggestion for monthly plans.
 *
 * This file defines a Genkit flow that takes monthly goals as input and suggests tasks
 * to help achieve those goals. It exports the `suggestMonthlyTasks` function, the
 * `SuggestMonthlyTasksInput` type, and the `SuggestMonthlyTasksOutput` type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMonthlyTasksInputSchema = z.object({
  monthlyGoals: z
    .string()
    .describe('The user-defined goals for the month.'),
});
export type SuggestMonthlyTasksInput = z.infer<typeof SuggestMonthlyTasksInputSchema>;

const SuggestMonthlyTasksOutputSchema = z.object({
  suggestedTasks: z
    .string()
    .describe('A list of tasks suggested by the AI to achieve the monthly goals.'),
});
export type SuggestMonthlyTasksOutput = z.infer<typeof SuggestMonthlyTasksOutputSchema>;

export async function suggestMonthlyTasks(
  input: SuggestMonthlyTasksInput
): Promise<SuggestMonthlyTasksOutput> {
  return suggestMonthlyTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMonthlyTasksPrompt',
  input: {schema: SuggestMonthlyTasksInputSchema},
  output: {schema: SuggestMonthlyTasksOutputSchema},
  prompt: `You are a personal planning assistant. Given the user's goals for the month, suggest a list of tasks that will help them achieve those goals.  Return the tasks as a numbered list.

Monthly Goals: {{{monthlyGoals}}}`,
});

const suggestMonthlyTasksFlow = ai.defineFlow(
  {
    name: 'suggestMonthlyTasksFlow',
    inputSchema: SuggestMonthlyTasksInputSchema,
    outputSchema: SuggestMonthlyTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
