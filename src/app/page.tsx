'use client';

import { useState } from 'react';
import Header from '@/components/header';
import PlanForm from '@/components/plan-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ChevronsRight, Milestone, Star, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [mode, setMode] = useState<'work' | 'study' | 'life' | 'travel'>('work');

  const plansConfig = {
    work: [
      {
        value: 'daily',
        label: '每日',
        icon: <Calendar className="w-5 h-5 mr-2" />,
        planType: 'Daily' as const,
        placeholder: '例如：完成项目提案，跑步30分钟，读一章书。',
      },
      {
        value: 'weekly',
        label: '每周',
        icon: <ChevronsRight className="w-5 h-5 mr-2" />,
        planType: 'Weekly' as const,
        placeholder: '例如：完成周报，准备一周的饭菜，参加营销会议。',
      },
      {
        value: 'monthly',
        label: '每月',
        icon: <Milestone className="w-5 h-5 mr-2" />,
        planType: 'Monthly' as const,
        placeholder: '例如：发布新功能，用户参与度提高10%，周末旅行。',
      },
      {
        value: 'yearly',
        label: '年度',
        icon: <Star className="w-5 h-5 mr-2" />,
        planType: 'Yearly' as const,
        placeholder: '例如：获得晋升，学习一门新的编程语言，去一个新的国家旅行。',
      },
    ],
    study: [
      {
        value: 'daily',
        label: '每日',
        icon: <Calendar className="w-5 h-5 mr-2" />,
        planType: 'Daily' as const,
        placeholder: '例如：复习线代第三章，完成一篇英语作文，看一节算法课。',
      },
      {
        value: 'weekly',
        label: '每周',
        icon: <ChevronsRight className="w-5 h-5 mr-2" />,
        planType: 'Weekly' as const,
        placeholder: '例如：完成一个课程模块，参加学习小组讨论，整理一周笔记。',
      },
      {
        value: 'monthly',
        label: '每月',
        icon: <Milestone className="w-5 h-5 mr-2" />,
        planType: 'Monthly' as const,
        placeholder: '例如：完成一门在线课程，准备期中考试，进行一次项目实践。',
      },
      {
        value: 'yearly',
        label: '年度',
        icon: <Star className="w-5 h-5 mr-2" />,
        planType: 'Yearly' as const,
        placeholder: '例如：通过一门重要考试，掌握一门新技能，发表一篇论文。',
      },
    ],
    life: [
      {
        value: 'daily',
        label: '每日',
        icon: <Calendar className="w-5 h-5 mr-2" />,
        planType: 'Daily' as const,
        placeholder: '例如：打扫房间，采购生活用品，给家人打电话。',
      },
      {
        value: 'weekly',
        label: '每周',
        icon: <ChevronsRight className="w-5 h-5 mr-2" />,
        planType: 'Weekly' as const,
        placeholder: '例如：进行一次大扫除，处理生活账单，和朋友聚会。',
      },
      {
        value: 'monthly',
        label: '每月',
        icon: <Milestone className="w-5 h-5 mr-2" />,
        planType: 'Monthly' as const,
        placeholder: '例如：检查家电，整理衣柜，制定下月预算。',
      },
      {
        value: 'yearly',
        label: '年度',
        icon: <Star className="w-5 h-5 mr-2" />,
        planType: 'Yearly' as const,
        placeholder: '例如：完成一次家庭装修，进行年度体检，培养一个新的生活习惯。',
      },
    ],
    travel: [
      {
        value: 'itinerary',
        label: '行程规划',
        icon: <Map className="w-5 h-5 mr-2" />,
        planType: 'Itinerary' as const,
        placeholder: '规划您的假期行程，例如：第一天：抵达目的地，入住酒店...',
      },
    ],
  };

  const plans = plansConfig[mode];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header mode={mode} setMode={setMode} />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        <Tabs defaultValue={plans[0].value} className="w-full max-w-6xl mx-auto" key={mode}>
          <TabsList className={cn(
            "grid w-full h-auto",
            plans.length > 1 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 max-w-xs mx-auto"
          )}>
            {plans.map((plan) => (
              <TabsTrigger key={plan.value} value={plan.value} className="py-3 text-base">
                {plan.icon} {plan.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {plans.map((plan) => (
            <TabsContent key={plan.value} value={plan.value} className="mt-6">
              <PlanForm
                mode={mode}
                planType={plan.planType}
                placeholder={plan.placeholder}
              />
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
