'use server';
/**
 * @fileOverview AI 驱动的每周计划任务建议。
 *
 * - suggestWeeklyTasks - 一个函数，接收每周目标作为输入并返回 AI 生成的任务建议。
 * - SuggestWeeklyTasksInput - suggestWeeklyTasks 函数的输入类型。
 * - SuggestWeeklyTasksOutput - suggestWeeklyTasks 函数的返回类型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWeeklyTasksInputSchema = z.object({
  weeklyGoals: z
    .string()
    .describe('用户定义的本周目标。'),
});
export type SuggestWeeklyTasksInput = z.infer<typeof SuggestWeeklyTasksInputSchema>;

const SuggestWeeklyTasksOutputSchema = z.object({
  suggestedTasks: z
    .array(z.string())
    .describe('AI 生成的用于实现每周目标的任务建议列表。'),
});
export type SuggestWeeklyTasksOutput = z.infer<typeof SuggestWeeklyTasksOutputSchema>;

export async function suggestWeeklyTasks(input: SuggestWeeklyTasksInput): Promise<SuggestWeeklyTasksOutput> {
  return suggestWeeklyTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWeeklyTasksPrompt',
  input: {schema: SuggestWeeklyTasksInputSchema},
  output: {schema: SuggestWeeklyTasksOutputSchema},
  prompt: `你是一个个人规划助理。用户将提供他们本周的目标，你将以中文回应一系列建议任务，以帮助他们实现这些目标。

  目标: {{{weeklyGoals}}}

  任务:`,
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
