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
      label: 'Daily',
      icon: <Calendar className="w-5 h-5 mr-2" />,
      planType: 'Daily' as const,
      suggestionAction: suggestDailyTasks,
      placeholder: 'e.g., Finish the project proposal, go for a 30-min run, and read a chapter of a book.',
    },
    {
      value: 'weekly',
      label: 'Weekly',
      icon: <ChevronsRight className="w-5 h-5 mr-2" />,
      planType: 'Weekly' as const,
      suggestionAction: suggestWeeklyTasks,
      placeholder: 'e.g., Complete the weekly report, meal prep for the week, and attend the marketing meeting.',
    },
    {
      value: 'monthly',
      label: 'Monthly',
      icon: <Milestone className="w-5 h-5 mr-2" />,
      planType: 'Monthly' as const,
      suggestionAction: suggestMonthlyTasks,
      placeholder: 'e.g., Launch the new feature, achieve a 10% increase in user engagement, and take a weekend trip.',
    },
    {
      value: 'yearly',
      label: 'Yearly',
      icon: <Star className="w-5 h-5 mr-2" />,
      planType: 'Yearly' as const,
      suggestionAction: suggestYearlyTasks,
      placeholder: 'e.g., Get a promotion, learn a new programming language, and travel to a new country.',
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
