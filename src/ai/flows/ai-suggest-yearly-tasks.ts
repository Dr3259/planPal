'use server';

/**
 * @fileOverview 此文件定义了一个 Genkit 流程，用于根据用户提供的目标建议年度任务。
 *
 * - `suggestYearlyTasks`: 一个函数，接收年度目标作为输入并返回 AI 驱动的任务建议。
 * - `SuggestYearlyTasksInput`: `suggestYearlyTasks` 函数的输入类型。
 * - `SuggestYearlyTasksOutput`: `suggestYearlyTasks` 函数的输出类型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestYearlyTasksInputSchema = z.object({
  yearlyGoals: z
    .string()
    .describe('用户定义的年度目标。请尽可能具体。'),
});
export type SuggestYearlyTasksInput = z.infer<typeof SuggestYearlyTasksInputSchema>;

const SuggestYearlyTasksOutputSchema = z.object({
  suggestedTasks: z
    .string()
    .describe('为帮助实现年度目标而建议的任务列表。'),
});
export type SuggestYearlyTasksOutput = z.infer<typeof SuggestYearlyTasksOutputSchema>;

export async function suggestYearlyTasks(input: SuggestYearlyTasksInput): Promise<SuggestYearlyTasksOutput> {
  return suggestYearlyTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestYearlyTasksPrompt',
  input: {schema: SuggestYearlyTasksInputSchema},
  output: {schema: SuggestYearlyTasksOutputSchema},
  prompt: `你是一个 AI 任务建议助理。用户将提供他们的年度目标，你将建议具体的任务，他们可以添加到他们的年度计划中，以帮助他们实现这些目标。请用中文回应。

年度目标: {{{yearlyGoals}}}

建议任务:`,
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
