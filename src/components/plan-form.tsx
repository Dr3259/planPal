
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Check, X, PanelRightClose, PanelLeftOpen, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import React from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';


type PlanFormProps = {
  mode: 'work' | 'study' | 'life' | 'travel';
  planType: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Itinerary';
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
    },
    life: {
        'Daily': {
            plan: '每日生活计划',
            description: '从右侧选择或添加你的生活琐事，让生活井井有条。',
            goals: '我的每日目标',
            morning: '上午 (8:00 - 12:00)',
            afternoon: '下午 (13:00 - 18:00)',
            evening: '晚上 (19:00 - 22:00)',
            suggestionsTitle: '可能的生活项',
            suggestionsDescription: '双击编辑，或添加到计划中。',
            addSuggestion: '添加',
            noPlans: '暂无计划，从右侧添加或直接创建',
        },
        'Weekly': {
            plan: '每周生活计划',
            description: '规划你本周的生活重点，如家庭、健康和社交。',
            goals: '本周生活重点'
        },
        'Monthly': {
            plan: '每月生活计划',
            description: '设定本月的生活目标，平衡工作与生活的艺术。',
            goals: '本月生活目标'
        },
        'Yearly': {
            plan: '年度生活计划',
            description: '展望你的年度生活愿景，实现个人成长与家庭幸福。',
            goals: '年度生活愿景'
        }
    },
    travel: {
        'Itinerary': {
            plan: '假期行程规划',
            description: '为你的下一个假期制定详细的每日行程吧！',
            addDay: '添加新的一天',
            addItem: '添加项目',
            day: '第',
            dayUnit: '天',
            emptyDay: '这一天玩点什么呢？从下方添加计划项吧。',
            holidayTitle: '假期名称 / 目的地',
            holidayPlaceholder: '例如：东京五日游',
            addItemPlaceholder: '例如：参观浅草寺',
            saveItem: '添加',
        },
    }
};

const defaultSuggestionsRaw = {
    work: ['完成最重要的任务', '回复重要邮件', '参加团队会议', '项目进度跟进', '准备报告'],
    study: ['复习高数', '背50个单词', '完成编程作业', '预习新章节', '整理课堂笔记'],
    life: ['打扫卫生', '采购生活用品', '锻炼身体', '与家人联系', '阅读'],
    travel: ['预定酒店和机票', '打包行李', '研究目的地', '参观博物馆', '品尝当地小吃']
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

type SuggestionItem = {
    id: string;
    text: string;
    children: SuggestionItem[];
};

type SuggestionNodeProps = {
    item: SuggestionItem;
    level: number;
    isLast: boolean;
    onUpdate: (id: string, text: string) => void;
    onDelete: (id: string) => void;
    onAddChild: (parentId: string, text: string) => void;
    addGoal: (period: 'morning' | 'afternoon' | 'evening', item: string) => void;
    parentText?: string;
};

const SuggestionNode = ({ item, level, isLast, onUpdate, onDelete, onAddChild, addGoal, parentText }: SuggestionNodeProps) => {
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(item.text);
    const [addingChild, setAddingChild] = useState(false);
    const [newChildText, setNewChildText] = useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const fullItemText = parentText ? `${parentText} - ${item.text}` : item.text;

    const handleSave = () => {
        if (editText.trim()) {
            onUpdate(item.id, editText.trim());
        }
        setEditing(false);
    };

    const handleCancel = () => {
        setEditText(item.text);
        setEditing(false);
    };

    const handleAddChild = () => {
        if (newChildText.trim()) {
            onAddChild(item.id, newChildText.trim());
            setNewChildText('');
            setAddingChild(false);
        }
    };

    const handleCancelAddChild = () => {
        setNewChildText('');
        setAddingChild(false);
    };

    useEffect(() => {
        if (addingChild || editing) {
            inputRef.current?.focus();
        }
    }, [addingChild, editing]);

    return (
        <div className="relative">
            <div className="absolute -left-3.5 top-0 h-full z-0">
                {level > 0 && <div className={cn("absolute top-0 w-px bg-border", isLast ? 'h-5' : 'h-full')} />}
                {level > 0 && <div className="absolute top-4 h-px w-3.5 bg-border" />}
            </div>
            <div className="flex items-center gap-2 group">
                {editing ? (
                    <div className="flex-1 flex items-center gap-1 py-1 relative z-10">
                        <Input
                            ref={inputRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 h-8 text-sm bg-background"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                            }}
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleSave}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div 
                        onDoubleClick={() => { setEditText(item.text); setEditing(true); }}
                        title="双击编辑"
                        className="flex-1 flex items-center min-h-[38px] cursor-pointer py-1 text-sm break-words relative z-10"
                    >
                        {item.text}
                    </div>
                )}
                
                {!editing && (
                    <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setAddingChild(true)}>
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>添加子项</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => addGoal('morning', fullItemText)}>添加到上午</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addGoal('afternoon', fullItemText)}>添加到下午</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => addGoal('evening', fullItemText)}>添加到晚上</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onDelete(item.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive/80" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>删除此项</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>
            <div className={cn("pl-5 flex flex-col")}>
                 {item.children.map((child, index) => (
                    <SuggestionNode
                        key={child.id}
                        item={child}
                        level={level + 1}
                        isLast={index === item.children.length - 1}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onAddChild={onAddChild}
                        addGoal={addGoal}
                        parentText={fullItemText}
                    />
                ))}
                {addingChild && (
                    <div className="flex items-center gap-1 mt-1 py-1 relative z-10">
                        <div className="absolute -left-3.5 top-0 h-full z-0">
                           <div className="absolute top-0 h-5 w-px bg-border" />
                           <div className="absolute top-4 h-px w-3.5 bg-border" />
                        </div>
                        <Input
                            ref={inputRef}
                            placeholder="新子项..."
                            value={newChildText}
                            onChange={e => setNewChildText(e.target.value)}
                            className="flex-1 h-8 text-sm bg-background"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddChild();
                                if (e.key === 'Escape') handleCancelAddChild();
                            }}
                        />
                         <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleAddChild}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCancelAddChild}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};


const SuggestedItems = ({ mode, addGoal }: { mode: 'work' | 'study' | 'life' | 'travel', addGoal: (period: 'morning' | 'afternoon' | 'evening', item: string) => void }) => {
    const { user, loading: userLoading } = useUser();
    let firestore;
    try {
      firestore = useFirestore();
    } catch(e) {
      // Firebase not initialized on server
    }
    const dailyTranslations = translations[mode]['Daily'];

    const storageKey = `plan-app-data-${mode}-Daily-suggestions-tree`;
    const firestoreKey = `${mode}_Daily_suggestions_tree`;

    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [newSuggestion, setNewSuggestion] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    
    const updateItemInTree = (items: SuggestionItem[], id: string, text: string): SuggestionItem[] => {
        return items.map(item => {
            if (item.id === id) return { ...item, text };
            if (item.children) return { ...item, children: updateItemInTree(item.children, id, text) };
            return item;
        });
    };

    const deleteItemFromTree = (items: SuggestionItem[], id: string): SuggestionItem[] => {
        return items.filter(item => item.id !== id).map(item => {
            if (item.children) return { ...item, children: deleteItemFromTree(item.children, id) };
            return item;
        });
    };

    const addChildToTree = (items: SuggestionItem[], parentId: string, child: SuggestionItem): SuggestionItem[] => {
        return items.map(item => {
            if (item.id === parentId) return { ...item, children: [...item.children, child] };
            if (item.children) return { ...item, children: addChildToTree(item.children, parentId, child) };
            return item;
        });
    };
    
    useEffect(() => {
        if (userLoading) return;

        const loadData = async () => {
            let loadedData = null;
            if (user && firestore) {
                const docRef = doc(firestore, 'plans', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    loadedData = docSnap.data()[firestoreKey];
                }
            } else {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    try {
                        loadedData = JSON.parse(saved);
                    } catch (e) {
                        console.error("Failed to parse suggestions from localStorage", e);
                    }
                }
            }

            if (Array.isArray(loadedData) && loadedData.length > 0) {
                 if (typeof loadedData[0] === 'object') {
                    setSuggestions(loadedData);
                } else if (typeof loadedData[0] === 'string') {
                    // Migrate from old string array format
                    const migrated = loadedData.map((text: string) => ({ id: crypto.randomUUID(), text, children: [] }));
                    setSuggestions(migrated);
                }
            } else {
                const defaultItems = defaultSuggestionsRaw[mode].map(text => ({ id: crypto.randomUUID(), text, children: [] }));
                setSuggestions(defaultItems);
            }
            setIsLoaded(true);
        };

        loadData();
    }, [mode, storageKey, user, userLoading, firestore, firestoreKey]);

    useEffect(() => {
        if (!isLoaded || userLoading) return;

        const saveData = async () => {
            if (user && firestore) {
                const docRef = doc(firestore, 'plans', user.uid);
                try {
                    await setDoc(docRef, { [firestoreKey]: suggestions }, { merge: true });
                } catch (error) {
                    console.error("Error saving suggestions to Firestore:", error);
                }
            } else {
                localStorage.setItem(storageKey, JSON.stringify(suggestions));
            }
        };
        saveData();
    }, [suggestions, storageKey, isLoaded, user, userLoading, firestore, firestoreKey]);

    const handleAddRootSuggestion = () => {
        if (newSuggestion.trim()) {
            const newItem: SuggestionItem = {
                id: crypto.randomUUID(),
                text: newSuggestion.trim(),
                children: [],
            };
            setSuggestions(prev => [...prev, newItem]);
            setNewSuggestion('');
        }
    };
    
    const handleUpdate = (id: string, text: string) => {
        setSuggestions(prev => updateItemInTree(prev, id, text));
    };

    const handleDelete = (id: string) => {
        setSuggestions(prev => deleteItemFromTree(prev, id));
    };

    const handleAddChild = (parentId: string, text: string) => {
        const newChild: SuggestionItem = { id: crypto.randomUUID(), text, children: [] };
        setSuggestions(prev => addChildToTree(prev, parentId, newChild));
    };
    
    return (
        <div className="h-full bg-muted/30 rounded-lg p-4 flex flex-col">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-lg">{dailyTranslations.suggestionsTitle}</h3>
                    <p className="text-sm text-muted-foreground">{dailyTranslations.suggestionsDescription}</p>
                </div>
            </div>
            
            <div className="flex gap-2 my-4">
                <Input
                    value={newSuggestion}
                    onChange={(e) => setNewSuggestion(e.target.value)}
                    placeholder="添加新的常用计划..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRootSuggestion()}
                    className="bg-background"
                />
                <Button onClick={handleAddRootSuggestion} size="sm">{dailyTranslations.addSuggestion}</Button>
            </div>
            <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-1 pr-2">
                   {suggestions.map((item, index) => (
                        <SuggestionNode
                            key={item.id}
                            item={item}
                            level={0}
                            isLast={index === suggestions.length - 1}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onAddChild={handleAddChild}
                            addGoal={addGoal}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};


const DailyPlanForm = ({ mode }: { mode: 'work' | 'study' | 'life' | 'travel' }) => {
    const { user, loading: userLoading } = useUser();
    let firestore;
    try {
      firestore = useFirestore();
    } catch(e) {
      // Firebase not initialized on server
    }
    const dailyTranslations = translations[mode]['Daily'];
    
    const storageKey = `plan-app-data-${mode}-Daily-goals`;
    const firestoreKey = `${mode}_Daily_goals`;

    const [goals, setGoals] = useState<{ morning: string[], afternoon: string[], evening: string[] }>({ morning: [], afternoon: [], evening: [] });
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
        if (userLoading) return;

        const loadData = async () => {
            let loadedData = null;
            if (user && firestore) {
                const docRef = doc(firestore, 'plans', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    loadedData = docSnap.data()[firestoreKey];
                }
            } else {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    try {
                        loadedData = JSON.parse(saved);
                    } catch (e) {
                        console.error("Failed to parse daily goals from localStorage", e);
                    }
                }
            }

            if (loadedData && Array.isArray(loadedData.morning) && Array.isArray(loadedData.afternoon) && Array.isArray(loadedData.evening)) {
                setGoals(loadedData);
            }
            setIsLoaded(true);
        };
        
        loadData();
    }, [mode, storageKey, user, userLoading, firestore, firestoreKey]);

    useEffect(() => {
        if (!isLoaded || userLoading) return;

        const saveData = async () => {
            if (user && firestore) {
                const docRef = doc(firestore, 'plans', user.uid);
                await setDoc(docRef, { [firestoreKey]: goals }, { merge: true });
            } else {
                localStorage.setItem(storageKey, JSON.stringify(goals));
            }
        };

        saveData();
    }, [goals, storageKey, isLoaded, user, userLoading, firestore, firestoreKey]);
    
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
            <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                <Badge variant="secondary">{goals[period].length}</Badge>
            </div>
            <Separator className="my-4" />
            <div className="py-2">
                {goals[period].length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                        {goals[period].map((item, index) => {
                             const hash = stringToHash(item);
                             const color = noteColors[Math.abs(hash) % noteColors.length];
                             return (
                                 <div key={index} className={cn(
                                     "group relative p-4 shadow-sm w-36 h-36 flex items-center justify-center text-center transition-all duration-200 hover:shadow-md hover:-rotate-3 hover:scale-105",
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
                        addGoal={addGoal}
                    />
                </div>
            </div>
        </div>
    );
}

const ItineraryPlanView = ({ mode }: { mode: 'travel' }) => {
    const { user, loading: userLoading } = useUser();
    let firestore;
    try {
        firestore = useFirestore();
    } catch(e) {
        // Firebase not initialized on server
    }
    
    const t = translations[mode]['Itinerary'];
    const storageKey = `plan-app-data-${mode}-Itinerary-plan`;
    const firestoreKey = `${mode}_Itinerary_plan`;

    type ItineraryPlan = {
      title: string;
      days: { id: string; items: string[] }[];
    };

    const [plan, setPlan] = useState<ItineraryPlan>({ title: '', days: [{ id: crypto.randomUUID(), items: [] }] });
    const [newItem, setNewItem] = useState<Record<string, string>>({}); // { [dayId]: "new item text" }
    const [isLoaded, setIsLoaded] = useState(false);

    // useEffect for loading
    useEffect(() => {
        if(userLoading) return;
        const loadData = async () => {
            let loadedData: ItineraryPlan | null = null;
            if (user && firestore) {
                const docRef = doc(firestore, 'plans', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    loadedData = docSnap.data()[firestoreKey];
                }
            } else {
                const savedPlan = localStorage.getItem(storageKey);
                if (savedPlan) {
                    try {
                        loadedData = JSON.parse(savedPlan);
                    } catch (e) {
                        console.error("Failed to parse itinerary plan", e);
                    }
                }
            }
            if (loadedData && loadedData.title !== undefined && Array.isArray(loadedData.days)) {
                setPlan(loadedData);
            } else {
                // Set a default of one day
                setPlan({ title: '', days: [{ id: crypto.randomUUID(), items: [] }] });
            }
            setIsLoaded(true);
        };
        loadData();
    }, [storageKey, user, userLoading, firestore, firestoreKey]);

    // useEffect for saving
    useEffect(() => {
        if (!isLoaded || userLoading) return;
        const saveData = async () => {
            if (user && firestore) {
                const docRef = doc(firestore, 'plans', user.uid);
                await setDoc(docRef, { [firestoreKey]: plan }, { merge: true });
            } else {
                localStorage.setItem(storageKey, JSON.stringify(plan));
            }
        };
        saveData();
    }, [plan, storageKey, isLoaded, user, userLoading, firestore, firestoreKey]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPlan(p => ({...p, title: e.target.value}));
    }

    const addDay = () => {
        setPlan(p => ({ ...p, days: [...p.days, { id: crypto.randomUUID(), items: [] }] }));
    };

    const removeDay = (id: string) => {
        setPlan(p => ({...p, days: p.days.filter(d => d.id !== id)}));
    };

    const handleNewItemChange = (dayId: string, value: string) => {
        setNewItem(prev => ({ ...prev, [dayId]: value }));
    };

    const addItem = (dayId: string) => {
        const itemText = newItem[dayId]?.trim();
        if (!itemText) return;
        setPlan(p => ({
            ...p,
            days: p.days.map(day => {
                if (day.id === dayId) {
                    if (day.items.includes(itemText)) return day;
                    return { ...day, items: [...day.items, itemText] };
                }
                return day;
            })
        }));
        handleNewItemChange(dayId, '');
    };

    const removeItem = (dayId: string, indexToRemove: number) => {
        setPlan(p => ({
            ...p,
            days: p.days.map(day => {
                if (day.id === dayId) {
                    return { ...day, items: day.items.filter((_, index) => index !== indexToRemove) };
                }
                return day;
            })
        }));
    };

    return (
        <div className="space-y-6">
            <div>
                <Label htmlFor="holiday-title" className="text-lg font-semibold">{t.holidayTitle}</Label>
                <Input
                    id="holiday-title"
                    placeholder={t.holidayPlaceholder}
                    value={plan.title}
                    onChange={handleTitleChange}
                    className="mt-2 text-base"
                />
            </div>

            <Accordion type="multiple" defaultValue={plan.days.map(d => d.id)} className="w-full" key={plan.days.length}>
                {plan.days.map((day, index) => (
                    <AccordionItem value={day.id} key={day.id}>
                        <AccordionTrigger>
                            <div className="flex items-center justify-between w-full pr-2">
                                <div className="flex items-center gap-4">
                                    <span>{t.day}{index + 1}{t.dayUnit}</span>
                                    <Badge variant="secondary">{day.items.length} 个项目</Badge>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); removeDay(day.id); }}>
                                    <Trash2 className="h-4 w-4 text-destructive/80" />
                                </Button>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 pl-2">
                                {day.items.length > 0 ? (
                                    <ul className="space-y-2">
                                        {day.items.map((item, itemIndex) => (
                                            <li key={itemIndex} className="group flex items-center gap-2 text-base">
                                                <span className="flex-1">{item}</span>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => removeItem(day.id, itemIndex)}>
                                                    <Trash2 className="h-4 w-4 text-destructive/80" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{t.emptyDay}</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Input
                                        placeholder={t.addItemPlaceholder}
                                        value={newItem[day.id] || ''}
                                        onChange={(e) => handleNewItemChange(day.id, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addItem(day.id)}
                                        className="h-9"
                                    />
                                    <Button onClick={() => addItem(day.id)}>{t.saveItem}</Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
             <div className="flex justify-center pt-4">
                <Button onClick={addDay} variant="outline" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    {t.addDay}
                </Button>
            </div>
        </div>
    );
};


const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const timePeriods = ['morning', 'afternoon', 'evening'];

const WeeklyPlanView = ({ mode }: { mode: 'work' | 'study' | 'life' | 'travel' }) => {
    const { user, loading: userLoading } = useUser();
    let firestore;
    try {
        firestore = useFirestore();
    } catch(e) {
        // Firebase not initialized on server
    }

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
      },
      life: {
        days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        periods: {
          morning: '上午',
          afternoon: '下午',
          evening: '晚上',
        },
        addPrompt: '添加新计划...'
      },
      travel: {
        days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        periods: {
          morning: '上午',
          afternoon: '下午',
          evening: '晚上',
        },
        addPrompt: '添加新行程...'
      }
    };
  
    const t = weeklyTranslations[mode];
  
    type WeeklyGoals = Record<string, Record<string, string[]>>;
    const storageKey = `plan-app-data-${mode}-Weekly-goals`;
    const firestoreKey = `${mode}_Weekly_goals`;
    
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
        if(userLoading) return;
        
        const loadData = async () => {
            let loadedData = {};
            if (user && firestore) {
                const docRef = doc(firestore, 'plans', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    loadedData = docSnap.data()[firestoreKey] || {};
                }
            } else {
                const savedWeeklyGoals = localStorage.getItem(storageKey);
                if (savedWeeklyGoals) {
                    try {
                        const parsedGoals = JSON.parse(savedWeeklyGoals);
                        if (typeof parsedGoals === 'object' && parsedGoals !== null) {
                            loadedData = parsedGoals;
                        }
                    } catch (e) { 
                        console.error("Failed to parse weekly goals", e);
                    }
                }
            }
            setGoals(loadedData);
            setIsLoaded(true);
        };
        loadData();
    }, [mode, storageKey, user, userLoading, firestore, firestoreKey]);
  
    useEffect(() => {
      if (!isLoaded || userLoading) return;
      
      const saveData = async () => {
          if(user && firestore) {
              const docRef = doc(firestore, 'plans', user.uid);
              await setDoc(docRef, { [firestoreKey]: goals }, { merge: true });
          } else {
              localStorage.setItem(storageKey, JSON.stringify(goals));
          }
      };
      saveData();
    }, [goals, storageKey, isLoaded, user, userLoading, firestore, firestoreKey]);
    
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

const MonthlyPlanView = ({ mode }: { mode: 'work' | 'study' | 'life' | 'travel' }) => {
    const { user, loading: userLoading } = useUser();
    let firestore;
    try {
        firestore = useFirestore();
    } catch(e) {
        // Firebase not initialized on server
    }

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
      },
      life: {
        title: "本月生活里程碑",
        weekLabels: ["第一周", "第二周", "第三周", "第四周", "第五周"],
        addPrompt: "添加本周生活要事...",
        emptyWeek: "本周暂无生活要事",
    },
    travel: {
        title: "本月旅行蓝图",
        weekLabels: ["第一周", "第二周", "第三周", "第四周", "第五周"],
        addPrompt: "添加本周旅行重点...",
        emptyWeek: "本周暂无旅行重点",
    }
    };

    const t = monthlyTranslations[mode];
    const storageKey = `plan-app-data-${mode}-Monthly-goals`;
    const firestoreKey = `${mode}_Monthly_goals`;

    type MonthlyGoals = Record<string, string[]>;

    const [goals, setGoals] = useState<MonthlyGoals>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [newItem, setNewItem] = useState<Record<string, string>>({});
    const [editingInfo, setEditingInfo] = useState<{ week: string, index: number } | null>(null);
    const [editingText, setEditingText] = useState('');

    useEffect(() => {
        if(userLoading) return;
        const loadData = async () => {
            let loadedData = {};
             if (user && firestore) {
                const docRef = doc(firestore, 'plans', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    loadedData = docSnap.data()[firestoreKey] || {};
                }
            } else {
                const savedGoals = localStorage.getItem(storageKey);
                if (savedGoals) {
                    try {
                        loadedData = JSON.parse(savedGoals);
                    } catch (e) {
                        console.error("Failed to parse monthly goals", e);
                    }
                }
            }
            setGoals(loadedData);
            setIsLoaded(true);
        };
        loadData();
    }, [storageKey, user, userLoading, firestore, firestoreKey]);

    useEffect(() => {
        if (!isLoaded || userLoading) return;
        const saveData = async () => {
            if(user && firestore) {
                const docRef = doc(firestore, 'plans', user.uid);
                await setDoc(docRef, { [firestoreKey]: goals }, { merge: true });
            } else {
                localStorage.setItem(storageKey, JSON.stringify(goals));
            }
        };
        saveData();
    }, [goals, storageKey, isLoaded, user, userLoading, firestore, firestoreKey]);

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
                                                    <React.Fragment>
                                                        <Input
                                                            value={editingText}
                                                            onChange={(e) => setEditingText(e.target.value)}
                                                            className="flex-1 h-8 text-sm"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveEdit();
                                                                if (e.key === 'Escape') handleCancelEdit();
                                                            }}
                                                        />
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleSaveEdit}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCancelEdit}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </React.Fragment>
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

const quarterKeys = ['q1', 'q2', 'q3', 'q4'];

const YearlyPlanView = ({ mode }: { mode: 'work' | 'study' | 'life' | 'travel' }) => {
    const { user, loading: userLoading } = useUser();
    let firestore;
    try {
        firestore = useFirestore();
    } catch(e) {
        // Firebase not initialized on server
    }

    const yearlyTranslations = {
      work: {
        title: "年度里程碑",
        quarterLabels: ["第一季度 (1月-3月)", "第二季度 (4月-6月)", "第三季度 (7月-9月)", "第四季度 (10月-12月)"],
        addPrompt: "添加本季度核心目标...",
        emptyQuarter: "本季度暂无核心目标",
      },
      study: {
        title: "年度学习地图",
        quarterLabels: ["第一季度 (1月-3月)", "第二季度 (4月-6月)", "第三季度 (7月-9月)", "第四季度 (10月-12月)"],
        addPrompt: "添加本季度学习目标...",
        emptyQuarter: "本季度暂无学习目标",
      },
      life: {
        title: "年度生活里程碑",
        quarterLabels: ["第一季度 (1月-3月)", "第二季度 (4月-6月)", "第三季度 (7月-9月)", "第四季度 (10月-12月)"],
        addPrompt: "添加本季度生活目标...",
        emptyQuarter: "本季度暂无生活目标",
    },
    travel: {
        title: "年度旅行地图",
        quarterLabels: ["第一季度 (1月-3月)", "第二季度 (4月-6月)", "第三季度 (7月-9月)", "第四季度 (10月-12月)"],
        addPrompt: "添加本季度旅行目标...",
        emptyQuarter: "本季度暂无旅行目标",
    }
    };

    const t = yearlyTranslations[mode];
    const storageKey = `plan-app-data-${mode}-Yearly-goals`;
    const firestoreKey = `${mode}_Yearly_goals`;

    type YearlyGoals = Record<string, string[]>;

    const [goals, setGoals] = useState<YearlyGoals>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [newItem, setNewItem] = useState<Record<string, string>>({});
    const [editingInfo, setEditingInfo] = useState<{ quarter: string, index: number } | null>(null);
    const [editingText, setEditingText] = useState('');

     useEffect(() => {
        if(userLoading) return;
        const loadData = async () => {
            let loadedData = {};
             if (user && firestore) {
                const docRef = doc(firestore, 'plans', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    loadedData = docSnap.data()[firestoreKey] || {};
                }
            } else {
                const savedGoals = localStorage.getItem(storageKey);
                if (savedGoals) {
                    try {
                        loadedData = JSON.parse(savedGoals);
                    } catch (e) {
                        console.error("Failed to parse yearly goals", e);
                    }
                }
            }
            setGoals(loadedData);
            setIsLoaded(true);
        };
        loadData();
    }, [storageKey, user, userLoading, firestore, firestoreKey]);

    useEffect(() => {
        if (!isLoaded || userLoading) return;
        const saveData = async () => {
            if(user && firestore) {
                const docRef = doc(firestore, 'plans', user.uid);
                await setDoc(docRef, { [firestoreKey]: goals }, { merge: true });
            } else {
                localStorage.setItem(storageKey, JSON.stringify(goals));
            }
        };
        saveData();
    }, [goals, storageKey, isLoaded, user, userLoading, firestore, firestoreKey]);

    const handleNewItemChange = (quarter: string, value: string) => {
        setNewItem(prev => ({ ...prev, [quarter]: value }));
    };

    const addGoal = (quarter: string) => {
        const item = newItem[quarter];
        if (!item || !item.trim()) return;
        setGoals(prev => {
            const quarterGoals = prev[quarter] || [];
            if (quarterGoals.includes(item.trim())) return prev;
            return {
                ...prev,
                [quarter]: [...quarterGoals, item.trim()]
            };
        });
        handleNewItemChange(quarter, '');
    };

    const removeGoal = (quarter: string, indexToRemove: number) => {
        setGoals(prev => {
            const newGoals = { ...prev };
            if (newGoals[quarter]) {
                newGoals[quarter] = newGoals[quarter].filter((_, index) => index !== indexToRemove);
            }
            return newGoals;
        });
    };

    const handleStartEdit = (quarter: string, index: number, text: string) => {
        setEditingInfo({ quarter, index });
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
        const { quarter, index } = editingInfo;
        setGoals(prev => {
            const updatedGoals = { ...prev };
            const updatedQuarterGoals = [...(updatedGoals[quarter] || [])];
            updatedQuarterGoals[index] = editingText.trim();
            updatedGoals[quarter] = updatedQuarterGoals;
            return updatedGoals;
        });
        handleCancelEdit();
    };
    
    return (
        <div className="space-y-4">
             <h3 className="text-lg font-semibold">{t.title}</h3>
            <Accordion type="multiple" defaultValue={['q1']} className="w-full">
                {quarterKeys.map((quarterKey, index) => (
                    <AccordionItem value={quarterKey} key={quarterKey}>
                        <AccordionTrigger>
                            <div className="flex items-center gap-4">
                                <span>{t.quarterLabels[index]}</span>
                                <Badge variant="secondary">{(goals[quarterKey] || []).length} 个目标</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 pl-2">
                                {(goals[quarterKey] || []).length > 0 ? (
                                    <ul className="space-y-2">
                                        {(goals[quarterKey] || []).map((goal, goalIndex) => (
                                            <li key={goalIndex} className="group flex items-center gap-2">
                                                {editingInfo?.quarter === quarterKey && editingInfo?.index === goalIndex ? (
                                                    <React.Fragment>
                                                        <Input
                                                            value={editingText}
                                                            onChange={(e) => setEditingText(e.target.value)}
                                                            className="flex-1 h-8 text-sm"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveEdit();
                                                                if (e.key === 'Escape') handleCancelEdit();
                                                            }}
                                                        />
                                                         <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleSaveEdit}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCancelEdit}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </React.Fragment>
                                                ) : (
                                                    <>
                                                        <span 
                                                            className="flex-1 cursor-pointer"
                                                            onDoubleClick={() => handleStartEdit(quarterKey, goalIndex, goal)}
                                                        >
                                                            {goal}
                                                        </span>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => removeGoal(quarterKey, goalIndex)}>
                                                            <Trash2 className="h-4 w-4 text-destructive/80" />
                                                        </Button>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{t.emptyQuarter}</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Input
                                        placeholder={t.addPrompt}
                                        value={newItem[quarterKey] || ''}
                                        onChange={(e) => handleNewItemChange(quarterKey, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addGoal(quarterKey)}
                                        className="h-9"
                                    />
                                    <Button onClick={() => addGoal(quarterKey)}>添加</Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

const TodayDate = () => {
    const [dateString, setDateString] = useState('');

    useEffect(() => {
        const today = new Date();
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
        };
        setDateString(new Intl.DateTimeFormat('zh-CN', options).format(today));
    }, []);

    if (!dateString) return null;

    return (
        <span className="text-base font-normal text-muted-foreground tracking-wide">
            {dateString}
        </span>
    );
};

const WeekInfo = () => {
    const [dateString, setDateString] = useState('');

    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.toLocaleString('zh-CN', { month: 'long' });
        
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // 0 for Monday, 6 for Sunday
        const weekOfMonth = Math.ceil((today.getDate() + firstDayOfWeek) / 7);

        setDateString(`${year}年 ${month} 第${weekOfMonth}周`);
    }, []);

    if (!dateString) return null;

    return (
        <span className="text-base font-normal text-muted-foreground tracking-wide">
            {dateString}
        </span>
    );
};

const MonthInfo = () => {
    const [dateString, setDateString] = useState('');

    useEffect(() => {
        const today = new Date();
        setDateString(today.toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
        }));
    }, []);

    if (!dateString) return null;

    return (
        <span className="text-base font-normal text-muted-foreground tracking-wide">
            {dateString}
        </span>
    );
};

const YearInfo = () => {
    const [dateString, setDateString] = useState('');

    useEffect(() => {
        const today = new Date();
        setDateString(today.getFullYear().toString() + '年');
    }, []);

    if (!dateString) return null;

    return (
        <span className="text-base font-normal text-muted-foreground tracking-wide">
            {dateString}
        </span>
    );
};


export default function PlanForm({ mode, planType, placeholder }: PlanFormProps) {
  const currentTranslation = translations[mode][planType as keyof typeof translations[typeof mode]];
  
  if (!currentTranslation) {
    // This can happen if the mode and planType combination is not defined,
    // especially after changing the travel mode logic.
    return null;
  }
  
  return (
    <Card className="w-full shadow-lg max-w-7xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-baseline">
            <CardTitle className="font-headline text-3xl">{currentTranslation.plan}</CardTitle>
            {planType === 'Daily' && <TodayDate />}
            {planType === 'Weekly' && <WeekInfo />}
            {planType === 'Monthly' && <MonthInfo />}
            {planType === 'Yearly' && <YearInfo />}
        </div>
        <CardDescription>{currentTranslation.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {planType === 'Daily' ? (
          <DailyPlanForm mode={mode} />
        ) : planType === 'Weekly' ? (
          <WeeklyPlanView mode={mode} />
        ) : planType === 'Monthly' ? (
          <MonthlyPlanView mode={mode} />
        ) : planType === 'Yearly' ? (
            <YearlyPlanView mode={mode} />
        ) : planType === 'Itinerary' ? (
            <ItineraryPlanView mode={mode as 'travel'} />
        ) : (
            <div className="space-y-2">
                <Label htmlFor="legacy-goals" className="text-lg">{currentTranslation.goals}</Label>
                <Textarea
                  id="legacy-goals"
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
