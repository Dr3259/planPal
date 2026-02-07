"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';

type PlanFormProps = {
  planType: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  placeholder: string;
};

const translations = {
    'Daily': {
        plan: '每日计划',
        description: '分时段规划你的一天，掌控每一刻。',
        goals: '我的每日目标'
    },
    'Weekly': {
        plan: '每周计划',
        description: '概述你本周的目标。',
        goals: '我的每周目标'
    },
    'Monthly': {
        plan: '每月计划',
        description: '概述你本月的目标。',
        goals: '我的每月目标'
    },
    'Yearly': {
        plan: '年度计划',
        description: '概述你今年的目标。',
        goals: '我的年度目标'
    }
};

const DailyPlanForm = () => {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="morning-goals" className="text-lg font-semibold">上午 (8:00 - 12:00)</Label>
                <Textarea
                  id="morning-goals"
                  placeholder="例如：完成最重要的任务，回复重要邮件..."
                  className="resize-none"
                  rows={4}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="afternoon-goals" className="text-lg font-semibold">下午 (13:00 - 18:00)</Label>
                <Textarea
                  id="afternoon-goals"
                  placeholder="例如：参加团队会议，处理次要任务，电话回访..."
                  className="resize-none"
                  rows={4}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="evening-goals" className="text-lg font-semibold">晚上 (19:00 - 22:00)</Label>
                <Textarea
                  id="evening-goals"
                  placeholder="例如：健身，阅读，学习新技能，规划第二天..."
                  className="resize-none"
                  rows={4}
                />
            </div>
        </div>
    )
}

export default function PlanForm({ planType, placeholder }: PlanFormProps) {
  const currentTranslation = translations[planType];
  const textareaId = `${planType.toLowerCase()}-goals`;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">{currentTranslation.plan}</CardTitle>
        <CardDescription>{currentTranslation.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {planType === 'Daily' ? <DailyPlanForm /> : (
            <div className="space-y-2">
                <Label htmlFor={textareaId} className="text-lg">{currentTranslation.goals}</Label>
                <Textarea
                  id={textareaId}
                  placeholder={placeholder}
                  className="resize-none"
                  rows={8}
                />
            </div>
        )}
      </CardContent>
    </Card>
  );
}
