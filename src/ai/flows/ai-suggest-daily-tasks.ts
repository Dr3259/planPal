'use server';
/**
 * @fileOverview 此文件定义了一个 Genkit 流程，用于根据用户目标建议每日任务。
 *
 * - suggestDailyTasks - 一个函数，接收每日目标作为输入并返回建议的任务。
 * - SuggestDailyTasksInput - suggestDailyTasks 函数的输入类型。
 * - SuggestDailyTasksOutput - suggestDailyTasks 函数的返回类型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDailyTasksInputSchema = z.object({
  dailyGoals: z
    .string()
    .describe('用户指定的当天目标。'),
});
export type SuggestDailyTasksInput = z.infer<typeof SuggestDailyTasksInputSchema>;

const SuggestDailyTasksOutputSchema = z.object({
  suggestedTasks: z
    .string()
    .describe('AI 建议的用于实现所述目标的任务列表。'),
});
export type SuggestDailyTasksOutput = z.infer<typeof SuggestDailyTasksOutputSchema>;

export async function suggestDailyTasks(input: SuggestDailyTasksInput): Promise<SuggestDailyTasksOutput> {
  return suggestDailyTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDailyTasksPrompt',
  input: {schema: SuggestDailyTasksInputSchema},
  output: {schema: SuggestDailyTasksOutputSchema},
  prompt: `你是一个个人助理，正在帮助用户规划他们的一天。

用户将提供他们当天的目标，你将以中文回应一系列建议任务，以帮助他们实现这些目标。

目标: {{{dailyGoals}}}

任务:`,
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
