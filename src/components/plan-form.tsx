"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Check, X, PanelRightClose, PanelLeftOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import React from 'react';


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
            suggestionsDescription: '双击编辑，或添加到计划中。',
            addSuggestion: '添加',
            noPlans: '暂无计划，从右侧添加或直接创建',
        },
        'Weekly': {
            plan: '每周工作计划',
            description: '以终为始，概述你本周的核心目标与任务。',
            goals: '本周核心目标'
        },
        'Monthly': {
            plan: '每月工作计划',
            description: '着眼于更大的图景，设定本月要达成的关键里程碑。',
            goals: '本月关键目标'
        },
        'Yearly': {
            plan: '年度工作计划',
            description: '设定你的年度愿景，将梦想分解为可实现的目标。',
            goals: '年度愿景与目标'
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
            suggestionsDescription: '双击编辑，或添加到计划中。',
            addSuggestion: '添加',
            noPlans: '暂无计划，从右侧添加或直接创建',
        },
        'Weekly': {
            plan: '每周学习计划',
            description: '总结本周学习重点，明确需要攻克的难题。',
            goals: '本周学习重点'
        },
        'Monthly': {
            plan: '每月学习计划',
            description: '规划本月的学习蓝图，挑战一个新领域或完成一门课程。',
            goals: '本月学习蓝图'
        },
        'Yearly': {
            plan: '年度学习计划',
            description: '设定年度学习目标，无论是掌握新技能还是达成重要考试。',
            goals: '年度学习目标'
        }
    }
};

const defaultSuggestions = {
    work: ['完成最重要的任务', '回复重要邮件', '参加团队会议', '项目进度跟进', '准备报告'],
    study: ['复习高数', '背50个单词', '完成编程作业', '预习新章节', '整理课堂笔记']
};

const noteColors = [
    { bg: 'bg-amber-100/60', text: 'text-amber-800' },
    { bg: 'bg-emerald-100/60', text: 'text-emerald-800' },
    { bg: 'bg-sky-100/60', text: 'text-sky-800' },
    { bg: 'bg-rose-100/60', text: 'text-rose-800' },
    { bg: 'bg-violet-100/60', text: 'text-violet-800' },
    { bg: 'bg-teal-100/60', text: 'text-teal-800' },
    { bg: 'bg-fuchsia-100/60', text: 'text-fuchsia-800' },
];

const SuggestedItems = ({ mode, suggestions, setSuggestions, addGoal }: { mode: 'work' | 'study', suggestions: string[], setSuggestions: (suggestions: string[]) => void, addGoal: (period: 'morning' | 'afternoon' | 'evening', item: string) => void }) => {
    const [newSuggestion, setNewSuggestion] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');
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

    const handleStartEdit = (index: number, text: string) => {
        setEditingIndex(index);
        setEditingText(text);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditingText('');
    };

    const handleSaveEdit = (index: number) => {
        if (editingText.trim()) {
            const updatedSuggestions = [...suggestions];
            updatedSuggestions[index] = editingText.trim();
            setSuggestions(updatedSuggestions);
        }
        handleCancelEdit();
    };

    return (
        <div className="h-full">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-lg">{dailyTranslations.suggestionsTitle}</h3>
                    <p className="text-sm text-muted-foreground">{dailyTranslations.suggestionsDescription}</p>
                </div>
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
                        <Card key={index} className="flex items-center justify-between p-2.5 bg-background shadow-sm min-h-[46px]">
                           {editingIndex === index ? (
                                <>
                                    <Input
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        className="flex-1 mr-2 h-7 text-sm"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit(index);
                                            if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                    />
                                    <div className="flex items-center gap-0">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleSaveEdit(index)}>
                                            <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCancelEdit}>
                                            <X className="h-4 w-4 text-destructive/80" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span
                                        onDoubleClick={() => handleStartEdit(index, suggestion)}
                                        title="双击编辑"
                                        className="flex-1 break-words mr-2 text-sm cursor-pointer"
                                    >
                                        {suggestion}
                                    </span>
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
                                </>
                            )}
                        </Card>
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const stringToHash = (str: string) => {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };

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
        <div>
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                <Badge variant="secondary">{goals[period].length}</Badge>
            </div>
            <div className="min-h-[10rem] py-2">
                {goals[period].length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                        {goals[period].map((item, index) => {
                             const hash = stringToHash(item);
                             const color = noteColors[Math.abs(hash) % noteColors.length];
                             return (
                                 <div key={index} className={cn(
                                     "group relative p-4 shadow-sm w-36 h-36 flex items-center justify-center text-center transition-all duration-200 hover:shadow-md hover:-rotate-3 hover:scale-105 border-0",
                                     color.bg, color.text
                                 )}>
                                <p className="text-sm font-medium break-words">{item}</p>
                                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-current/70 hover:text-current" onClick={() => removeGoal(period, index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )})}
                    </div>
                ) : (
                    <div className="flex items-center justify-center border-2 border-dashed w-full min-h-[10rem]">
                        <p className="text-sm text-muted-foreground">{dailyTranslations.noPlans}</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="relative">
             <div className="absolute top-0 right-0 hidden lg:block">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            >
                                {isSidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isSidebarOpen ? '隐藏建议项' : '显示建议项'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className={`${isSidebarOpen ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6 transition-all duration-300 ease-in-out`}>
                    {renderPeriodPlans('morning', dailyTranslations.morning)}
                    {renderPeriodPlans('afternoon', dailyTranslations.afternoon)}
                    {renderPeriodPlans('evening', dailyTranslations.evening)}
                </div>
                <div className={`h-full ${isSidebarOpen ? 'block' : 'lg:hidden'}`}>
                    <SuggestedItems
                        mode={mode}
                        suggestions={suggestions}
                        setSuggestions={setSuggestions}
                        addGoal={addGoal}
                    />
                </div>
            </div>
        </div>
    );
}

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const WeeklyPlanView = ({ mode }: { mode: 'work' | 'study' }) => {
    const weeklyTranslations = {
      work: {
        days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        periods: {
          morning: '上午',
          afternoon: '下午',
          evening: '晚上',
        },
        addPrompt: '添加新计划...'
      },
      study: {
        days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        periods: {
          morning: '上午',
          afternoon: '下午',
          evening: '晚上',
        },
        addPrompt: '添加新计划...'
      }
    };
  
    const t = weeklyTranslations[mode];
    const timePeriods = ['morning', 'afternoon', 'evening'];
  
    type WeeklyGoals = Record<string, Record<string, string[]>>;
    const weeklyStorageKey = `plan-app-data-${mode}-Weekly-goals`;
    const dailyStorageKey = `plan-app-data-${mode}-Daily-goals`;
    
    const [goals, setGoals] = useState<WeeklyGoals>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [addingInfo, setAddingInfo] = useState<{day: string, period: string} | null>(null);
    const [newItem, setNewItem] = useState('');
  
    const stringToHash = (str: string) => {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return hash;
    };
  
    useEffect(() => {
      const savedWeeklyGoals = localStorage.getItem(weeklyStorageKey);
      if (savedWeeklyGoals) {
        try {
          setGoals(JSON.parse(savedWeeklyGoals));
        } catch (e) { console.error("Failed to parse weekly goals", e); }
      } else {
        const savedDailyGoals = localStorage.getItem(dailyStorageKey);
        if (savedDailyGoals) {
          try {
            const dailyGoals = JSON.parse(savedDailyGoals);
            const newWeeklyGoals: WeeklyGoals = {};
            daysOfWeek.forEach(day => {
              newWeeklyGoals[day] = {
                morning: [...(dailyGoals.morning || [])],
                afternoon: [...(dailyGoals.afternoon || [])],
                evening: [...(dailyGoals.evening || [])],
              };
            });
            setGoals(newWeeklyGoals);
          } catch (e) { console.error("Failed to parse daily goals for weekly seeding", e); }
        }
      }
      setIsLoaded(true);
    }, [weeklyStorageKey, dailyStorageKey]);
  
    useEffect(() => {
      if (!isLoaded) return;
      localStorage.setItem(weeklyStorageKey, JSON.stringify(goals));
    }, [goals, weeklyStorageKey, isLoaded]);
    
    const addGoal = (day: string, period: string, item: string) => {
      if (!item.trim()) return;
      setGoals(prev => {
        const dayGoals = prev[day] || {};
        const periodGoals = dayGoals[period] || [];
        if (periodGoals.includes(item.trim())) return prev;
  
        const newGoals = {
          ...prev,
          [day]: {
            ...dayGoals,
            [period]: [...periodGoals, item.trim()]
          }
        };
        return newGoals;
      });
      setNewItem('');
      setAddingInfo(null);
    };
  
    const removeGoal = (day: string, period: string, indexToRemove: number) => {
      setGoals(prev => {
        const newGoals = { ...prev };
        if (newGoals[day] && newGoals[day][period]) {
            newGoals[day][period] = newGoals[day][period].filter((_, index) => index !== indexToRemove);
        }
        return newGoals;
      });
    };
  
    const handleAddClick = (day: string, period: string) => {
      setAddingInfo({ day, period });
      setNewItem('');
    };
    
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && addingInfo) {
        addGoal(addingInfo.day, addingInfo.period, newItem);
      }
      if (e.key === 'Escape') {
        setAddingInfo(null);
        setNewItem('');
      }
    };
  
    return (
      <div className="w-full overflow-x-auto">
        <div className="grid grid-cols-[auto_repeat(7,minmax(120px,1fr))] border-t border-l bg-card">
          <div className="p-2 border-b border-r font-semibold bg-muted/50 sticky left-0 z-10"></div>
          {t.days.map(day => (
            <div key={day} className="p-2 border-b border-r text-center font-semibold bg-muted/50">
              {day}
            </div>
          ))}
          
          {timePeriods.map(period => (
            <React.Fragment key={period}>
              <div className="p-2 border-b border-r font-semibold bg-muted/50 flex items-center justify-center sticky left-0 z-10">
                <span>{t.periods[period as keyof typeof t.periods]}</span>
              </div>
              {daysOfWeek.map(day => (
                <div key={`${day}-${period}`} className="p-2 border-b border-r min-h-[12rem] flex flex-col gap-1.5">
                  <div className="flex-1 flex flex-col gap-1.5">
                    {(goals[day]?.[period] || []).map((item, index) => {
                      const hash = stringToHash(item);
                      const color = noteColors[Math.abs(hash) % noteColors.length];
                      return (
                         <div key={index} className={cn(
                             "group relative p-1.5 rounded-md text-xs flex items-center justify-between",
                             color.bg, color.text
                         )}>
                            <p className="break-words mr-1 flex-1 text-left">{item}</p>
                            <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 text-current/70 hover:text-current" onClick={() => removeGoal(day, period, index)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                      )
                    })}
                  </div>
  
                  {addingInfo?.day === day && addingInfo?.period === period ? (
                    <div className="flex gap-1 mt-auto">
                      <Input
                        autoFocus
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        onBlur={() => { setAddingInfo(null); setNewItem(''); }}
                        placeholder={t.addPrompt}
                        className="h-8 text-xs"
                      />
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="w-full mt-auto text-muted-foreground hover:text-foreground" onClick={() => handleAddClick(day, period)}>
                      <Plus className="h-4 w-4 mr-1"/> 添加
                    </Button>
                  )}
  
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

const weekKeys = ['week1', 'week2', 'week3', 'week4', 'week5'];

const MonthlyPlanView = ({ mode }: { mode: 'work' | 'study' }) => {
    const monthlyTranslations = {
      work: {
        title: "本月里程碑",
        weekLabels: ["第一周", "第二周", "第三周", "第四周", "第五周"],
        addPrompt: "添加本周关键目标...",
        emptyWeek: "本周暂无关键目标",
      },
      study: {
        title: "本月学习蓝图",
        weekLabels: ["第一周", "第二周", "第三周", "第四周", "第五周"],
        addPrompt: "添加本周学习重点...",
        emptyWeek: "本周暂无学习重点",
      }
    };

    const t = monthlyTranslations[mode];
    const storageKey = `plan-app-data-${mode}-Monthly-goals`;

    type MonthlyGoals = Record<string, string[]>;

    const [goals, setGoals] = useState<MonthlyGoals>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [newItem, setNewItem] = useState<Record<string, string>>({});
    const [editingInfo, setEditingInfo] = useState<{ week: string, index: number } | null>(null);
    const [editingText, setEditingText] = useState('');

    useEffect(() => {
        const savedGoals = localStorage.getItem(storageKey);
        if (savedGoals) {
            try {
                setGoals(JSON.parse(savedGoals));
            } catch (e) {
                console.error("Failed to parse monthly goals", e);
            }
        }
        setIsLoaded(true);
    }, [storageKey]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(storageKey, JSON.stringify(goals));
    }, [goals, storageKey, isLoaded]);

    const handleNewItemChange = (week: string, value: string) => {
        setNewItem(prev => ({ ...prev, [week]: value }));
    };

    const addGoal = (week: string) => {
        const item = newItem[week];
        if (!item || !item.trim()) return;
        setGoals(prev => {
            const weekGoals = prev[week] || [];
            if (weekGoals.includes(item.trim())) return prev;
            return {
                ...prev,
                [week]: [...weekGoals, item.trim()]
            };
        });
        handleNewItemChange(week, '');
    };

    const removeGoal = (week: string, indexToRemove: number) => {
        setGoals(prev => {
            const newGoals = { ...prev };
            if (newGoals[week]) {
                newGoals[week] = newGoals[week].filter((_, index) => index !== indexToRemove);
            }
            return newGoals;
        });
    };

    const handleStartEdit = (week: string, index: number, text: string) => {
        setEditingInfo({ week, index });
        setEditingText(text);
    };

    const handleCancelEdit = () => {
        setEditingInfo(null);
        setEditingText('');
    };

    const handleSaveEdit = () => {
        if (!editingInfo || !editingText.trim()) {
            handleCancelEdit();
            return;
        }
        const { week, index } = editingInfo;
        setGoals(prev => {
            const updatedGoals = { ...prev };
            const updatedWeekGoals = [...(updatedGoals[week] || [])];
            updatedWeekGoals[index] = editingText.trim();
            updatedGoals[week] = updatedWeekGoals;
            return updatedGoals;
        });
        handleCancelEdit();
    };
    
    return (
        <div className="space-y-4">
             <h3 className="text-lg font-semibold">{t.title}</h3>
            <Accordion type="multiple" defaultValue={['week1']} className="w-full">
                {weekKeys.map((weekKey, index) => (
                    <AccordionItem value={weekKey} key={weekKey}>
                        <AccordionTrigger>
                            <div className="flex items-center gap-4">
                                <span>{t.weekLabels[index]}</span>
                                <Badge variant="secondary">{(goals[weekKey] || []).length} 个目标</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 pl-2">
                                {(goals[weekKey] || []).length > 0 ? (
                                    <ul className="space-y-2">
                                        {(goals[weekKey] || []).map((goal, goalIndex) => (
                                            <li key={goalIndex} className="group flex items-center gap-2">
                                                {editingInfo?.week === weekKey && editingInfo?.index === goalIndex ? (
                                                    <>
                                                        <Input
                                                            value={editingText}
                                                            onChange={(e) => setEditingText(e.target.value)}
                                                            className="flex-1 h-8 text-sm"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveEdit();
                                                                if (e.key === 'Escape') handleCancelEdit();
                                                            }}
                                                            onBlur={handleSaveEdit}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <span 
                                                            className="flex-1 cursor-pointer"
                                                            onDoubleClick={() => handleStartEdit(weekKey, goalIndex, goal)}
                                                        >
                                                            {goal}
                                                        </span>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => removeGoal(weekKey, goalIndex)}>
                                                            <Trash2 className="h-4 w-4 text-destructive/80" />
                                                        </Button>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{t.emptyWeek}</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Input
                                        placeholder={t.addPrompt}
                                        value={newItem[weekKey] || ''}
                                        onChange={(e) => handleNewItemChange(weekKey, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addGoal(weekKey)}
                                        className="h-9"
                                    />
                                    <Button onClick={() => addGoal(weekKey)}>添加</Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};


export default function PlanForm({ mode, planType, placeholder }: PlanFormProps) {
  const currentTranslation = translations[mode][planType];
  const textareaId = `${planType.toLowerCase()}-goals`;
  const storageKey = `plan-app-data-${mode}-${planType}`;

  const [goals, setGoals] = useState('');

  useEffect(() => {
      if (planType === 'Daily' || planType === 'Weekly' || planType === 'Monthly') return;
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
    if (planType === 'Daily' || planType === 'Weekly' || planType === 'Monthly') return;
    localStorage.setItem(storageKey, JSON.stringify(goals));
  }, [goals, storageKey, planType]);


  return (
    <Card className="w-full shadow-lg max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">{currentTranslation.plan}</CardTitle>
        <CardDescription>{currentTranslation.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {planType === 'Daily' ? (
          <DailyPlanForm mode={mode} />
        ) : planType === 'Weekly' ? (
          <WeeklyPlanView mode={mode} />
        ) : planType === 'Monthly' ? (
          <MonthlyPlanView mode={mode} />
        ) : (
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
