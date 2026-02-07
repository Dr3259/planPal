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
        description: '概述你今天的目标。',
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
        <div className="space-y-2">
            <Label htmlFor={textareaId} className="text-lg">{currentTranslation.goals}</Label>
            <Textarea
              id={textareaId}
              placeholder={placeholder}
              className="resize-none"
              rows={8}
            />
        </div>
      </CardContent>
    </Card>
  );
}
