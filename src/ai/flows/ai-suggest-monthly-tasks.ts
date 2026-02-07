'use server';

/**
 * @fileOverview AI 驱动的每月计划任务建议。
 *
 * 此文件定义了一个 Genkit 流程，该流程将月度目标作为输入并建议实现这些目标的任务。
 * 它导出了 `suggestMonthlyTasks` 函数、`SuggestMonthlyTasksInput` 类型和 `SuggestMonthlyTasksOutput` 类型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMonthlyTasksInputSchema = z.object({
  monthlyGoals: z
    .string()
    .describe('用户定义的本月目标。'),
});
export type SuggestMonthlyTasksInput = z.infer<typeof SuggestMonthlyTasksInputSchema>;

const SuggestMonthlyTasksOutputSchema = z.object({
  suggestedTasks: z
    .string()
    .describe('AI 建议的用于实现月度目标的任务列表。'),
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
  prompt: `你是一个个人规划助理。根据用户本月的目标，建议一个任务列表，帮助他们实现这些目标。以编号列表的形式用中文返回任务。

月度目标: {{{monthlyGoals}}}`,
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
