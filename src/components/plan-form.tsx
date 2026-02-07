"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';

type PlanFormProps = {
  mode: 'work' | 'study';
  planType: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  placeholder: string;
};

const translations = {
    work: {
        'Daily': {
            plan: '每日工作计划',
            description: '分时段规划你的一天，掌控每一刻。',
            goals: '我的每日目标',
            morning: '上午 (8:00 - 12:00)',
            morning_placeholder: '例如：完成最重要的任务，回复重要邮件...',
            afternoon: '下午 (13:00 - 18:00)',
            afternoon_placeholder: '例如：参加团队会议，处理次要任务，电话回访...',
            evening: '晚上 (19:00 - 22:00)',
            evening_placeholder: '例如：家庭时光，健身，阅读，规划第二天...',
        },
        'Weekly': {
            plan: '每周工作计划',
            description: '概述你本周的工作目标。',
            goals: '我的每周目标'
        },
        'Monthly': {
            plan: '每月工作计划',
            description: '概述你本月的工作目标。',
            goals: '我的每月目标'
        },
        'Yearly': {
            plan: '年度工作计划',
            description: '概述你今年的工作目标。',
            goals: '我的年度目标'
        }
    },
    study: {
        'Daily': {
            plan: '每日学习计划',
            description: '分时段规划你的学习时间，高效学习。',
            goals: '我的每日目标',
            morning: '上午 (8:00 - 12:00)',
            morning_placeholder: '例如：复习高数，背50个英语单词...',
            afternoon: '下午 (13:00 - 18:00)',
            afternoon_placeholder: '例如：上专业课，完成编程作业，图书馆自习...',
            evening: '晚上 (19:00 - 22:00)',
            evening_placeholder: '例如：参加线上分享，整理笔记，预习新内容...',
        },
        'Weekly': {
            plan: '每周学习计划',
            description: '概述你本周的学习目标。',
            goals: '我的每周目标'
        },
        'Monthly': {
            plan: '每月学习计划',
            description: '概述你本月的学习目标。',
            goals: '我的每月目标'
        },
        'Yearly': {
            plan: '年度学习计划',
            description: '概述你今年的学习目标。',
            goals: '我的年度目标'
        }
    }
};

const DailyPlanForm = ({ mode }: { mode: 'work' | 'study' }) => {
    const dailyTranslations = translations[mode]['Daily'];
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="morning-goals" className="text-lg font-semibold">{dailyTranslations.morning}</Label>
                <Textarea
                  id="morning-goals"
                  placeholder={dailyTranslations.morning_placeholder}
                  className="resize-none"
                  rows={4}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="afternoon-goals" className="text-lg font-semibold">{dailyTranslations.afternoon}</Label>
                <Textarea
                  id="afternoon-goals"
                  placeholder={dailyTranslations.afternoon_placeholder}
                  className="resize-none"
                  rows={4}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="evening-goals" className="text-lg font-semibold">{dailyTranslations.evening}</Label>
                <Textarea
                  id="evening-goals"
                  placeholder={dailyTranslations.evening_placeholder}
                  className="resize-none"
                  rows={4}
                />
            </div>
        </div>
    )
}

export default function PlanForm({ mode, planType, placeholder }: PlanFormProps) {
  const currentTranslation = translations[mode][planType];
  const textareaId = `${planType.toLowerCase()}-goals`;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">{currentTranslation.plan}</CardTitle>
        <CardDescription>{currentTranslation.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {planType === 'Daily' ? <DailyPlanForm mode={mode} /> : (
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