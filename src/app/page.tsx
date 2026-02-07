import Header from '@/components/header';
import PlanForm from '@/components/plan-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { suggestDailyTasks } from '@/ai/flows/ai-suggest-daily-tasks';
import { suggestWeeklyTasks } from '@/ai/flows/ai-suggest-weekly-tasks';
import { suggestMonthlyTasks } from '@/ai/flows/ai-suggest-monthly-tasks';
import { suggestYearlyTasks } from '@/ai/flows/ai-suggest-yearly-tasks';
import { Calendar, ChevronsRight, Milestone, Star } from 'lucide-react';

export default function Home() {
  const plans = [
    {
      value: 'daily',
      label: '每日',
      icon: <Calendar className="w-5 h-5 mr-2" />,
      planType: 'Daily' as const,
      suggestionAction: suggestDailyTasks,
      placeholder: '例如：完成项目提案，跑步30分钟，读一章书。',
    },
    {
      value: 'weekly',
      label: '每周',
      icon: <ChevronsRight className="w-5 h-5 mr-2" />,
      planType: 'Weekly' as const,
      suggestionAction: suggestWeeklyTasks,
      placeholder: '例如：完成周报，准备一周的饭菜，参加营销会议。',
    },
    {
      value: 'monthly',
      label: '每月',
      icon: <Milestone className="w-5 h-5 mr-2" />,
      planType: 'Monthly' as const,
      suggestionAction: suggestMonthlyTasks,
      placeholder: '例如：发布新功能，用户参与度提高10%，周末旅行。',
    },
    {
      value: 'yearly',
      label: '年度',
      icon: <Star className="w-5 h-5 mr-2" />,
      planType: 'Yearly' as const,
      suggestionAction: suggestYearlyTasks,
      placeholder: '例如：获得晋升，学习一门新的编程语言，去一个新的国家旅行。',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        <Tabs defaultValue="daily" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            {plans.map((plan) => (
              <TabsTrigger key={plan.value} value={plan.value} className="py-3 text-base">
                {plan.icon} {plan.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {plans.map((plan) => (
            <TabsContent key={plan.value} value={plan.value} className="mt-6">
              <PlanForm
                planType={plan.planType}
                suggestionAction={plan.suggestionAction}
                placeholder={plan.placeholder}
              />
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
