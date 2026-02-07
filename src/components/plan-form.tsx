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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        <div className="bg-muted/40 rounded-lg p-4 h-full">
            <div className="mb-4">
                <h3 className="font-semibold text-lg">{dailyTranslations.suggestionsTitle}</h3>
                <p className="text-sm text-muted-foreground">{dailyTranslations.suggestionsDescription}</p>
            </div>
            
            <div className="flex gap-2 mb-4">
                <Input
                    value={newSuggestion}
                    onChange={(e) => setNewSuggestion(e.target.value)}
                    placeholder="添加新的常用计划..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSuggestion()}
                    className="bg-background"
                />
                <Button onClick={handleAddSuggestion} size="sm">{dailyTranslations.addSuggestion}</Button>
            </div>
            <ScrollArea className="h-80">
                <div className="space-y-2 pr-4">
                    {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 rounded-md bg-background shadow-sm">
                            <span className="flex-1 break-words mr-2 text-sm">{suggestion}</span>
                            <div className="flex items-center gap-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => addGoal('morning', suggestion)}>添加到上午</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => addGoal('afternoon', suggestion)}>添加到下午</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => addGoal('evening', suggestion)}>添加到晚上</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemoveSuggestion(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive/80" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};


const DailyPlanForm = ({ mode }: { mode: 'work' | 'study' }) => {
    const dailyTranslations = translations[mode]['Daily'];
    const goalsStorageKey = `plan-app-data-${mode}-Daily-goals`;
    const suggestionsStorageKey = `plan-app-data-${mode}-Daily-suggestions`;
    
    const [goals, setGoals] = useState<{ morning: string[], afternoon: string[], evening: string[] }>({ morning: [], afternoon: [], evening: [] });
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

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
        setIsLoaded(true);
    }, [mode, goalsStorageKey, suggestionsStorageKey]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(goalsStorageKey, JSON.stringify(goals));
    }, [goals, goalsStorageKey, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(suggestionsStorageKey, JSON.stringify(suggestions));
    }, [suggestions, suggestionsStorageKey, isLoaded]);
    
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
        <div key={period}>
            <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <Badge variant="secondary">{goals[period].length}</Badge>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 min-h-[6rem] space-y-2">
                {goals[period].length > 0 ? (
                    goals[period].map((item, index) => (
                        <div key={index} className="group flex items-center justify-between p-3 rounded-md bg-background shadow-sm">
                            <span className="text-card-foreground flex-1 break-words">{item}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeGoal(period, index)}>
                                <Trash2 className="h-4 w-4 text-destructive/80" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full pt-4">
                        <p className="text-sm text-muted-foreground">{dailyTranslations.noPlans}</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
                {renderPeriodPlans('morning', dailyTranslations.morning)}
                {renderPeriodPlans('afternoon', dailyTranslations.afternoon)}
                {renderPeriodPlans('evening', dailyTranslations.evening)}
            </div>
            <div className="h-full">
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
    <Card className="w-full shadow-lg max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">{currentTranslation.plan}</CardTitle>
        <CardDescription>{currentTranslation.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
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
