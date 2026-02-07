"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type PlanFormProps = {
  mode: 'work' | 'study';
  planType: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  placeholder: string;
};

const translations = {
    work: {
        'Daily': {
            plan: '每日工作计划',
            description: '从右侧选择或添加你的计划项，规划高效的一天。',
            goals: '我的每日目标',
            morning: '上午 (8:00 - 12:00)',
            afternoon: '下午 (13:00 - 18:00)',
            evening: '晚上 (19:00 - 22:00)',
            suggestionsTitle: '可能的计划项',
            suggestionsDescription: '点击“+”添加到计划中，或编辑你的常用项目。',
            addSuggestion: '添加',
            noPlans: '暂无计划',
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
            description: '从右侧选择或添加你的计划项，规划高效的一天。',
            goals: '我的每日目标',
            morning: '上午 (8:00 - 12:00)',
            afternoon: '下午 (13:00 - 18:00)',
            evening: '晚上 (19:00 - 22:00)',
            suggestionsTitle: '可能的计划项',
            suggestionsDescription: '点击“+”添加到计划中，或编辑你的常用项目。',
            addSuggestion: '添加',
            noPlans: '暂无计划',
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

const defaultSuggestions = {
    work: ['完成最重要的任务', '回复重要邮件', '参加团队会议', '项目进度跟进', '准备报告'],
    study: ['复习高数', '背50个单词', '完成编程作业', '预习新章节', '整理课堂笔记']
};

const SuggestedItems = ({ mode, suggestions, setSuggestions, addGoal }: { mode: 'work' | 'study', suggestions: string[], setSuggestions: (suggestions: string[]) => void, addGoal: (period: 'morning' | 'afternoon' | 'evening', item: string) => void }) => {
    const [newSuggestion, setNewSuggestion] = useState('');
    const dailyTranslations = translations[mode]['Daily'];

    const handleAddSuggestion = () => {
        if (newSuggestion.trim() && !suggestions.includes(newSuggestion.trim())) {
            setSuggestions([...suggestions, newSuggestion.trim()]);
            setNewSuggestion('');
        }
    };

    const handleRemoveSuggestion = (indexToRemove: number) => {
        setSuggestions(suggestions.filter((_, index) => index !== indexToRemove));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{dailyTranslations.suggestionsTitle}</CardTitle>
                <CardDescription>{dailyTranslations.suggestionsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        value={newSuggestion}
                        onChange={(e) => setNewSuggestion(e.target.value)}
                        placeholder="添加新的常用计划..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSuggestion()}
                    />
                    <Button onClick={handleAddSuggestion}>{dailyTranslations.addSuggestion}</Button>
                </div>
                <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                            <span className="flex-1 break-words">{suggestion}</span>
                            <div className="flex items-center gap-1 pl-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => addGoal('morning', suggestion)}>添加到上午</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => addGoal('afternoon', suggestion)}>添加到下午</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => addGoal('evening', suggestion)}>添加到晚上</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveSuggestion(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};


const DailyPlanForm = ({ mode }: { mode: 'work' | 'study' }) => {
    const dailyTranslations = translations[mode]['Daily'];
    const goalsStorageKey = `plan-app-data-${mode}-Daily-goals`;
    const suggestionsStorageKey = `plan-app-data-${mode}-Daily-suggestions`;
    
    const [goals, setGoals] = useState<{ morning: string[], afternoon: string[], evening: string[] }>({ morning: [], afternoon: [], evening: [] });
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        const savedGoals = localStorage.getItem(goalsStorageKey);
        if (savedGoals) {
            try {
                const parsedGoals = JSON.parse(savedGoals);
                if (parsedGoals && Array.isArray(parsedGoals.morning) && Array.isArray(parsedGoals.afternoon) && Array.isArray(parsedGoals.evening)) {
                    setGoals(parsedGoals);
                }
            } catch (e) {
                console.error("Failed to parse daily goals from localStorage", e);
            }
        }

        const savedSuggestions = localStorage.getItem(suggestionsStorageKey);
        if (savedSuggestions) {
            try {
                const parsedSuggestions = JSON.parse(savedSuggestions);
                if (Array.isArray(parsedSuggestions)) {
                    setSuggestions(parsedSuggestions);
                }
            } catch (e) {
                console.error("Failed to parse suggestions from localStorage", e);
            }
        } else {
            setSuggestions(defaultSuggestions[mode]);
        }
    }, [mode, goalsStorageKey, suggestionsStorageKey]);

    useEffect(() => {
        localStorage.setItem(goalsStorageKey, JSON.stringify(goals));
    }, [goals, goalsStorageKey]);

    useEffect(() => {
        localStorage.setItem(suggestionsStorageKey, JSON.stringify(suggestions));
    }, [suggestions, suggestionsStorageKey]);
    
    const addGoal = (period: 'morning' | 'afternoon' | 'evening', item: string) => {
        setGoals(prev => {
            if (prev[period].includes(item)) {
                return prev;
            }
            return { ...prev, [period]: [...prev[period], item] };
        });
    };

    const removeGoal = (period: 'morning' | 'afternoon' | 'evening', indexToRemove: number) => {
        setGoals(prev => ({
            ...prev,
            [period]: prev[period].filter((_, index) => index !== indexToRemove)
        }));
    };

    const renderPeriodPlans = (period: 'morning' | 'afternoon' | 'evening', title: string) => (
        <div className="space-y-2">
            <Label className="text-lg font-semibold">{title}</Label>
            <div className="space-y-2 rounded-lg border p-4 min-h-[120px]">
                {goals[period].length > 0 ? goals[period].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted">
                        <span>{item}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeGoal(period, index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )) : <p className="text-muted-foreground text-sm">{dailyTranslations.noPlans}</p>}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                {renderPeriodPlans('morning', dailyTranslations.morning)}
                {renderPeriodPlans('afternoon', dailyTranslations.afternoon)}
                {renderPeriodPlans('evening', dailyTranslations.evening)}
            </div>
            <div>
                <SuggestedItems
                    mode={mode}
                    suggestions={suggestions}
                    setSuggestions={setSuggestions}
                    addGoal={addGoal}
                />
            </div>
        </div>
    )
}

export default function PlanForm({ mode, planType, placeholder }: PlanFormProps) {
  const currentTranslation = translations[mode][planType];
  const textareaId = `${planType.toLowerCase()}-goals`;
  const storageKey = `plan-app-data-${mode}-${planType}`;

  const [goals, setGoals] = useState('');

  useEffect(() => {
      if (planType === 'Daily') return;
      const savedGoals = localStorage.getItem(storageKey);
      if (savedGoals) {
          try {
              const parsedGoals = JSON.parse(savedGoals);
              if (typeof parsedGoals === 'string') {
                setGoals(parsedGoals);
              }
          } catch(e) {
              setGoals(savedGoals); // Assume it was a raw string
          }
      } else {
        setGoals('');
      }
  }, [storageKey, planType]);

  useEffect(() => {
    if (planType === 'Daily') return;
    localStorage.setItem(storageKey, JSON.stringify(goals));
  }, [goals, storageKey, planType]);


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
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                />
            </div>
        )}
      </CardContent>
    </Card>
  );
}
