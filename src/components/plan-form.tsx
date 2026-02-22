
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Check, X, PanelRightClose, PanelLeftOpen, PlusCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { logger } from '@/lib/logger';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import React from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createPlanItem, createPlanService } from '@/lib/services/plan-service';
import { createStorageAdapter } from '@/lib/storage/storage-factory';
import { formatDate } from '@/lib/date-utils';
import type { DailyPlan, PlanMode } from '@/types/plan-sync';


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
            noPlans: '暂无计划，请从右侧添加',
            noPlansPast: '历史记录暂无计划',
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
            noPlans: '暂无计划，请从右侧添加',
            noPlansPast: '历史记录暂无计划',
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
            noPlans: '暂无计划，请从右侧添加',
            noPlansPast: '历史记录暂无计划',
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
    readOnly?: boolean;
};

const SuggestionNode = ({ item, level, isLast, onUpdate, onDelete, onAddChild, addGoal, parentText, readOnly }: SuggestionNodeProps) => {
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
            <div className="absolute -left-3.5 top-0 h-full">
                {level > 0 && <div className={cn("absolute top-0 w-px bg-border", isLast ? 'h-5' : 'h-full', editing && 'z-0')} />}
                {level > 0 && <div className={cn("absolute top-4 h-px w-3.5 bg-border", editing && 'z-0')} />}
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

                        {!readOnly && (
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
                        )}

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
                        readOnly={readOnly}
                    />
                ))}
                {addingChild && (
                    <div className="flex items-center gap-1 mt-1 py-1 relative z-10">
                        <div className="absolute -left-3.5 top-0 h-full">
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


const SuggestedItems = ({ mode, addGoal, readOnly }: { mode: 'work' | 'study' | 'life' | 'travel', addGoal: (period: 'morning' | 'afternoon' | 'evening', item: string) => void, readOnly?: boolean }) => {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
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
    
    // 第一阶段：立即从 localStorage 加载，不等待认证
    useEffect(() => {
        const loadFromLocalStorage = () => {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    const loadedData = JSON.parse(saved);
                    if (Array.isArray(loadedData) && loadedData.length > 0) {
                        if (typeof loadedData[0] === 'object') {
                            setSuggestions(loadedData);
                        } else if (typeof loadedData[0] === 'string') {
                            const migrated = loadedData.map((text: string) => ({ 
                                id: crypto.randomUUID(), 
                                text, 
                                children: [] 
                            }));
                            setSuggestions(migrated);
                        }
                        setIsLoaded(true);
                        return;
                    }
                } catch (e) {
                    logger.error("Failed to parse suggestions from localStorage", e);
                }
            }
            
            // 如果 localStorage 没有数据，使用默认值
            const defaultItems = defaultSuggestionsRaw[mode].map(text => ({ 
                id: crypto.randomUUID(), 
                text, 
                children: [] 
            }));
            setSuggestions(defaultItems);
            setIsLoaded(true);
        };
        
        loadFromLocalStorage();
    }, [mode, storageKey]);

    // 第二阶段：认证完成后，如果用户已登录，从 Firestore 加载
    useEffect(() => {
        if (userLoading) return;
        
        const loadFromFirestore = async () => {
            if (user && firestore) {
                try {
                    const docRef = doc(firestore, 'plans', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const firestoreData = docSnap.data()[firestoreKey];
                        if (Array.isArray(firestoreData) && firestoreData.length > 0) {
                            setSuggestions(firestoreData);
                        }
                    }
                } catch (error) {
                    logger.error("Error loading suggestions from Firestore:", error);
                }
            }
        };
        
        loadFromFirestore();
    }, [user, userLoading, firestore, firestoreKey]);

    useEffect(() => {
        if (!isLoaded) return;

        const saveData = async () => {
            // 总是保存到 localStorage（即使用户已登录）
            localStorage.setItem(storageKey, JSON.stringify(suggestions));
            
            // 如果用户已登录且认证完成，也保存到 Firestore
            if (user && firestore && !userLoading) {
                const docRef = doc(firestore, 'plans', user.uid);
                try {
                    await setDoc(docRef, { [firestoreKey]: suggestions }, { merge: true });
                } catch (error) {
                    logger.error("Error saving suggestions to Firestore:", error);
                }
            }
        };
        
        saveData();
    }, [suggestions, storageKey, isLoaded, user, firestore, firestoreKey, userLoading]);

    const handleAddRootSuggestion = () => {
        if (newSuggestion.trim()) {
            const newItem: SuggestionItem = {
                id: crypto.randomUUID(),
                text: newSuggestion.trim(),
                children: [],
            };
            setSuggestions(prev => [newItem, ...prev]);
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
                            readOnly={readOnly}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

function formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function readStoredDate(storageKey: string) {
    try {
        const savedDate = localStorage.getItem(storageKey);
        if (!savedDate) return null;
        const [year, month, day] = savedDate.split('-').map(Number);
        if (!year || !month || !day) return null;
        return new Date(year, month - 1, day);
    } catch {
        return null;
    }
}

function isSameDate(left: Date, right: Date) {
    return left.getFullYear() === right.getFullYear()
        && left.getMonth() === right.getMonth()
        && left.getDate() === right.getDate();
}

function normalizeDate(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isBeforeDate(left: Date, right: Date) {
    return normalizeDate(left).getTime() < normalizeDate(right).getTime();
}

const DailyPlanForm = ({ mode, selectedDate }: { mode: 'work' | 'study' | 'life' | 'travel'; selectedDate: Date }) => {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const dailyTranslations = translations[mode]['Daily'];
    const dateKey = formatDateKey(selectedDate);
    const isToday = isSameDate(selectedDate, new Date());
    const isPast = isBeforeDate(selectedDate, new Date());

    const planUserId = user?.uid ?? 'local';
    const storageAdapter = useMemo(
        () => createStorageAdapter(firestore, user?.uid ?? null),
        [firestore, user?.uid]
    );
    const planService = useMemo(
        () => createPlanService(storageAdapter, planUserId),
        [storageAdapter, planUserId]
    );
    
    const storageKey = `plan-app-data-${mode}-Daily-goals-${dateKey}`;
    const firestoreKey = `${mode}_Daily_goals_${dateKey}`;
    const legacyStorageKey = `plan-app-data-${mode}-Daily-goals`;
    const legacyFirestoreKey = `${mode}_Daily_goals`;

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

    // 第一阶段：立即从 localStorage 加载，不等待认证
    useEffect(() => {
        const loadFromLocalStorage = () => {
            setIsLoaded(false);
            setGoals({ morning: [], afternoon: [], evening: [] });

            const saved = localStorage.getItem(storageKey);
            const fallbackSaved = !saved && isToday ? localStorage.getItem(legacyStorageKey) : null;
            const source = saved ?? fallbackSaved;

            if (source) {
                try {
                    const loadedData = JSON.parse(source);
                    if (loadedData && Array.isArray(loadedData.morning) && Array.isArray(loadedData.afternoon) && Array.isArray(loadedData.evening)) {
                        setGoals(loadedData);
                    }
                } catch (e) {
                    logger.error("Failed to parse daily goals from localStorage", e);
                }
            }
            setIsLoaded(true);
        };
        
        loadFromLocalStorage();
    }, [storageKey, legacyStorageKey, isToday]);

    // 第二阶段：认证完成后，如果用户已登录，从 Firestore 加载
    useEffect(() => {
        if (userLoading) return;
        
        const loadFromFirestore = async () => {
            if (user && firestore) {
                try {
                    const docRef = doc(firestore, 'plans', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const firestoreData = data?.[firestoreKey] ?? (isToday ? data?.[legacyFirestoreKey] : undefined);
                        if (firestoreData && Array.isArray(firestoreData.morning) && Array.isArray(firestoreData.afternoon) && Array.isArray(firestoreData.evening)) {
                            setGoals(firestoreData);
                        }
                    }
                } catch (error) {
                    logger.error("Error loading daily goals from Firestore:", error);
                }
            }
        };
        
        loadFromFirestore();
    }, [user, userLoading, firestore, firestoreKey, legacyFirestoreKey, isToday]);

    useEffect(() => {
        if (!isLoaded) return;

        const saveData = async () => {
            // 总是保存到 localStorage（即使用户已登录）
            localStorage.setItem(storageKey, JSON.stringify(goals));
            
            // 如果用户已登录且认证完成，也保存到 Firestore
            if (user && firestore && !userLoading) {
                const docRef = doc(firestore, 'plans', user.uid);
                try {
                    await setDoc(docRef, { [firestoreKey]: goals }, { merge: true });
                } catch (error) {
                    logger.error("Error saving daily goals to Firestore:", error);
                }
            }

            const dailyPlan: DailyPlan = {
                date: dateKey,
                mode: mode as PlanMode,
                morning: goals.morning.map(createPlanItem),
                afternoon: goals.afternoon.map(createPlanItem),
                evening: goals.evening.map(createPlanItem),
            };

            try {
                await planService.saveDailyPlan(dateKey, mode as PlanMode, dailyPlan);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('planpal-daily-updated', {
                        detail: { mode, date: dateKey }
                    }));
                }
            } catch (error) {
                logger.error("Error syncing daily plan:", error);
            }
        };

        saveData();
    }, [goals, storageKey, isLoaded, user, firestore, firestoreKey, userLoading, dateKey, mode, planService]);
    
    const addGoal = (period: 'morning' | 'afternoon' | 'evening', item: string) => {
        if (isPast) return;
        setGoals(prev => {
            if (prev[period].includes(item)) {
                return prev;
            }
            return { ...prev, [period]: [...prev[period], item] };
        });
    };

    const removeGoal = (period: 'morning' | 'afternoon' | 'evening', indexToRemove: number) => {
        if (isPast) return;
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
                                {!isPast && (
                                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-current/70 hover:text-current" onClick={() => removeGoal(period, index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )})}
                    </div>
                ) : (
                    <div className="flex items-center justify-center border-2 border-dashed w-full min-h-[10rem]">
                        <p className="text-sm text-muted-foreground">
                            {isPast ? dailyTranslations.noPlansPast : dailyTranslations.noPlans}
                        </p>
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
                        readOnly={isPast}
                    />
                </div>
            </div>
        </div>
    );
}

const ItineraryPlanView = ({ mode }: { mode: 'travel' }) => {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    
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

    // 第一阶段：立即从 localStorage 加载，不等待认证
    useEffect(() => {
        const loadFromLocalStorage = () => {
            const savedPlan = localStorage.getItem(storageKey);
            if (savedPlan) {
                try {
                    const loadedData: ItineraryPlan = JSON.parse(savedPlan);
                    if (loadedData && loadedData.title !== undefined && Array.isArray(loadedData.days)) {
                        setPlan(loadedData);
                        setIsLoaded(true);
                        return;
                    }
                } catch (e) {
                    logger.error("Failed to parse itinerary plan", e);
                }
            }
            // Set a default of one day
            setPlan({ title: '', days: [{ id: crypto.randomUUID(), items: [] }] });
            setIsLoaded(true);
        };
        loadFromLocalStorage();
    }, [storageKey]);

    // 第二阶段：认证完成后，如果用户已登录，从 Firestore 加载
    useEffect(() => {
        if(userLoading) return;
        const loadFromFirestore = async () => {
            if (user && firestore) {
                try {
                    const docRef = doc(firestore, 'plans', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const firestoreData = docSnap.data()[firestoreKey];
                        if (firestoreData && firestoreData.title !== undefined && Array.isArray(firestoreData.days)) {
                            setPlan(firestoreData);
                        }
                    }
                } catch (error) {
                    logger.error("Error loading itinerary plan from Firestore:", error);
                }
            }
        };
        loadFromFirestore();
    }, [user, userLoading, firestore, firestoreKey]);

    // useEffect for saving
    useEffect(() => {
        if (!isLoaded) return;
        const saveData = async () => {
            // 总是保存到 localStorage（即使用户已登录）
            localStorage.setItem(storageKey, JSON.stringify(plan));
            
            // 如果用户已登录且认证完成，也保存到 Firestore
            if (user && firestore && !userLoading) {
                const docRef = doc(firestore, 'plans', user.uid);
                try {
                    await setDoc(docRef, { [firestoreKey]: plan }, { merge: true });
                } catch (error) {
                    logger.error("Error saving itinerary plan to Firestore:", error);
                }
            }
        };
        saveData();
    }, [plan, storageKey, isLoaded, user, firestore, firestoreKey, userLoading]);

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
                                <Button asChild variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); removeDay(day.id); }}>
                                    <div>
                                        <Trash2 className="h-4 w-4 text-destructive/80" />
                                    </div>
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

const WeeklyPlanView = ({ mode, selectedDate }: { mode: 'work' | 'study' | 'life' | 'travel'; selectedDate: Date }) => {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const weeklyTranslations = {
      work: {
        days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        periods: {
          morning: '上午',
          afternoon: '下午',
          evening: '晚上',
        },
      },
      study: {
        days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        periods: {
          morning: '上午',
          afternoon: '下午',
          evening: '晚上',
        },
      },
      life: {
        days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        periods: {
          morning: '上午',
          afternoon: '下午',
          evening: '晚上',
        },
      },
      travel: {
        days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        periods: {
          morning: '上午',
          afternoon: '下午',
          evening: '晚上',
        },
      }
    };
  
    const t = weeklyTranslations[mode];
    const weekStart = useMemo(() => {
        const day = selectedDate.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const start = new Date(selectedDate);
        start.setDate(selectedDate.getDate() + diff);
        start.setHours(0, 0, 0, 0);
        return start;
    }, [selectedDate]);
    const todayKey = formatDate(new Date());

    const formatDayLabel = (dateKey: string) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    };

    const weekDates = useMemo(() => {
        return daysOfWeek.map((_, index) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);
            return formatDate(date);
        });
    }, [weekStart]);

    const planUserId = user?.uid ?? 'local';
    const storageAdapter = useMemo(
        () => createStorageAdapter(firestore, user?.uid ?? null),
        [firestore, user?.uid]
    );
    const planService = useMemo(
        () => createPlanService(storageAdapter, planUserId),
        [storageAdapter, planUserId]
    );

    const readLocalPlan = (dateKey: string): DailyPlan | null => {
        if (typeof window === 'undefined') return null;

        const primaryKey = `plan-app-data-users-${planUserId}-dailyPlans-${dateKey}-${mode}`;
        const primaryRaw = localStorage.getItem(primaryKey);
        if (primaryRaw) {
            try {
                const parsed = JSON.parse(primaryRaw);
                if (parsed && Array.isArray(parsed.morning) && Array.isArray(parsed.afternoon) && Array.isArray(parsed.evening)) {
                    return parsed as DailyPlan;
                }
            } catch (error) {
                logger.error("Error parsing synced daily plan:", error);
            }
        }

        const legacyKey = `plan-app-data-${mode}-Daily-goals-${dateKey}`;
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw) {
            try {
                const parsed = JSON.parse(legacyRaw);
                if (parsed && Array.isArray(parsed.morning) && Array.isArray(parsed.afternoon) && Array.isArray(parsed.evening)) {
                    return {
                        date: dateKey,
                        mode: mode as PlanMode,
                        morning: parsed.morning.map(createPlanItem),
                        afternoon: parsed.afternoon.map(createPlanItem),
                        evening: parsed.evening.map(createPlanItem),
                    };
                }
            } catch (error) {
                logger.error("Error parsing legacy daily plan:", error);
            }
        }

        return null;
    };

    const [dailyPlans, setDailyPlans] = useState<Record<string, DailyPlan | null>>(() => {
        if (typeof window === 'undefined') return {};
        const entries = weekDates.map((dateKey) => [dateKey, readLocalPlan(dateKey)] as const);
        return Object.fromEntries(entries);
    });
    const [isLoading, setIsLoading] = useState(true);
  
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
        if (userLoading) return;
        let cancelled = false;

        const loadDailyPlans = async () => {
            if (cancelled) return;
            setIsLoading(true);
            const localEntries = weekDates.map((dateKey) => [dateKey, readLocalPlan(dateKey)] as const);
            if (!cancelled) {
                setDailyPlans(Object.fromEntries(localEntries));
            }
            try {
                const entries = await Promise.all(
                    weekDates.map(async (dateKey) => {
                        const syncedPlan = await planService.loadDailyPlan(dateKey, mode as PlanMode, planUserId);
                        if (syncedPlan) return [dateKey, syncedPlan] as const;

                        const legacyKey = `plan-app-data-${mode}-Daily-goals-${dateKey}`;
                        const legacyRaw = localStorage.getItem(legacyKey);
                        if (!legacyRaw) return [dateKey, null] as const;

                        try {
                            const parsed = JSON.parse(legacyRaw);
                            if (parsed && Array.isArray(parsed.morning) && Array.isArray(parsed.afternoon) && Array.isArray(parsed.evening)) {
                                const fallbackPlan: DailyPlan = {
                                    date: dateKey,
                                    mode: mode as PlanMode,
                                    morning: parsed.morning.map(createPlanItem),
                                    afternoon: parsed.afternoon.map(createPlanItem),
                                    evening: parsed.evening.map(createPlanItem),
                                };
                                return [dateKey, fallbackPlan] as const;
                            }
                        } catch (error) {
                            logger.error("Error parsing legacy daily plan:", error);
                        }

                        return [dateKey, null] as const;
                    })
                );

                if (!cancelled) {
                    setDailyPlans(Object.fromEntries(entries));
                }
            } catch (error) {
                logger.error("Error loading weekly daily plans:", error);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        const handleRefresh = () => {
            loadDailyPlans();
        };

        loadDailyPlans();

        if (typeof window !== 'undefined') {
            window.addEventListener('planpal-daily-updated', handleRefresh);
        }

        return () => {
            cancelled = true;
            if (typeof window !== 'undefined') {
                window.removeEventListener('planpal-daily-updated', handleRefresh);
            }
        };
    }, [userLoading, planService, weekDates, mode, planUserId]);
  
    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[980px] rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="grid grid-cols-[140px_repeat(7,minmax(140px,1fr))]">
            <div className="p-3 border-b border-r text-sm font-semibold bg-muted/60 sticky left-0 z-20 backdrop-blur">
              时间段
            </div>
            {weekDates.map((dateKey, index) => {
              const isToday = dateKey === todayKey;
              return (
                <div
                  key={dateKey}
                  className={cn(
                    "p-3 border-b border-r text-center bg-muted/60",
                    isToday && "bg-amber-50/70"
                  )}
                >
                  <div className="text-sm font-semibold text-foreground">{t.days[index]}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDayLabel(dateKey)}</div>
                </div>
              );
            })}
            
            {timePeriods.map(period => (
              <React.Fragment key={period}>
                <div className="p-3 border-b border-r font-semibold bg-muted/40 flex items-center justify-center sticky left-0 z-10">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {t.periods[period as keyof typeof t.periods]}
                  </Badge>
                </div>
                {weekDates.map((dateKey) => {
                  const dailyPlan = dailyPlans[dateKey];
                  const items = dailyPlan
                      ? period === 'morning'
                          ? dailyPlan.morning
                          : period === 'afternoon'
                              ? dailyPlan.afternoon
                              : dailyPlan.evening
                      : [];
                  const isToday = dateKey === todayKey;
                  return (
                      <div
                        key={`${dateKey}-${period}`}
                        className={cn(
                          "p-3 border-b border-r min-h-[12rem] flex flex-col gap-2 transition-colors",
                          isToday && "bg-amber-50/30"
                        )}
                      >
                          <div className="flex-1 flex flex-col gap-2">
                              {items.length > 0 ? (
                                  items.map((item, index) => {
                                      const hash = stringToHash(item.text);
                                      const color = noteColors[Math.abs(hash) % noteColors.length];
                                      return (
                                          <div key={`${dateKey}-${period}-${index}`} className={cn(
                                              "px-2 py-1.5 rounded-md text-xs flex items-center shadow-sm",
                                              color.bg, color.text
                                          )}>
                                              <p className="break-words flex-1 text-left">{item.text}</p>
                                          </div>
                                      );
                                  })
                              ) : null}
                          </div>
                      </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

const weekKeys = ['week1', 'week2', 'week3', 'week4', 'week5'];

const MonthlyPlanView = ({ mode }: { mode: 'work' | 'study' | 'life' | 'travel' }) => {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

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

    // 第一阶段：立即从 localStorage 加载，不等待认证
    useEffect(() => {
        const loadFromLocalStorage = () => {
            const savedGoals = localStorage.getItem(storageKey);
            if (savedGoals) {
                try {
                    const loadedData = JSON.parse(savedGoals);
                    setGoals(loadedData);
                } catch (e) {
                    logger.error("Failed to parse monthly goals", e);
                }
            }
            setIsLoaded(true);
        };
        loadFromLocalStorage();
    }, [storageKey]);

    // 第二阶段：认证完成后，如果用户已登录，从 Firestore 加载
    useEffect(() => {
        if(userLoading) return;
        const loadFromFirestore = async () => {
            if (user && firestore) {
                try {
                    const docRef = doc(firestore, 'plans', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const firestoreData = docSnap.data()[firestoreKey];
                        if (firestoreData) {
                            setGoals(firestoreData);
                        }
                    }
                } catch (error) {
                    logger.error("Error loading monthly goals from Firestore:", error);
                }
            }
        };
        loadFromFirestore();
    }, [user, userLoading, firestore, firestoreKey]);

    useEffect(() => {
        if (!isLoaded) return;
        const saveData = async () => {
            // 总是保存到 localStorage（即使用户已登录）
            localStorage.setItem(storageKey, JSON.stringify(goals));
            
            // 如果用户已登录且认证完成，也保存到 Firestore
            if(user && firestore && !userLoading) {
                const docRef = doc(firestore, 'plans', user.uid);
                try {
                    await setDoc(docRef, { [firestoreKey]: goals }, { merge: true });
                } catch (error) {
                    logger.error("Error saving monthly goals to Firestore:", error);
                }
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
    const firestore = useFirestore();

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

     // 第一阶段：立即从 localStorage 加载，不等待认证
     useEffect(() => {
        const loadFromLocalStorage = () => {
            const savedGoals = localStorage.getItem(storageKey);
            if (savedGoals) {
                try {
                    const loadedData = JSON.parse(savedGoals);
                    setGoals(loadedData);
                } catch (e) {
                    logger.error("Failed to parse yearly goals", e);
                }
            }
            setIsLoaded(true);
        };
        loadFromLocalStorage();
    }, [storageKey]);

    // 第二阶段：认证完成后，如果用户已登录，从 Firestore 加载
    useEffect(() => {
        if(userLoading) return;
        const loadFromFirestore = async () => {
            if (user && firestore) {
                try {
                    const docRef = doc(firestore, 'plans', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const firestoreData = docSnap.data()[firestoreKey];
                        if (firestoreData) {
                            setGoals(firestoreData);
                        }
                    }
                } catch (error) {
                    logger.error("Error loading yearly goals from Firestore:", error);
                }
            }
        };
        loadFromFirestore();
    }, [user, userLoading, firestore, firestoreKey]);

    useEffect(() => {
        if (!isLoaded) return;
        const saveData = async () => {
            // 总是保存到 localStorage（即使用户已登录）
            localStorage.setItem(storageKey, JSON.stringify(goals));
            
            // 如果用户已登录且认证完成，也保存到 Firestore
            if(user && firestore && !userLoading) {
                const docRef = doc(firestore, 'plans', user.uid);
                try {
                    await setDoc(docRef, { [firestoreKey]: goals }, { merge: true });
                } catch (error) {
                    logger.error("Error saving yearly goals to Firestore:", error);
                }
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

const TodayDate = ({ selectedDate, onChange }: { selectedDate: Date; onChange: (nextDate: Date) => void }) => {
    const handlePrevDay = () => {
        const updated = new Date(selectedDate);
        updated.setDate(updated.getDate() - 1);
        onChange(updated);
    };

    const handleNextDay = () => {
        const updated = new Date(selectedDate);
        updated.setDate(updated.getDate() + 1);
        onChange(updated);
    };

    const handleBackToToday = () => {
        onChange(new Date());
    };

    const isToday = isSameDate(selectedDate, new Date());
    const isPast = isBeforeDate(selectedDate, new Date());
    const dateLabel = selectedDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });

    return (
        <div className="flex items-center gap-2 text-base font-normal text-muted-foreground tracking-wide">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevDay} aria-label="上一天">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 gap-2 text-sm font-normal"
                            title={dateLabel}
                            aria-label={dateLabel}
                        >
                            <CalendarIcon className="h-4 w-4" />
                            <span className="max-w-[11rem] truncate">{dateLabel}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-transparent border-none shadow-none" align="end">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && onChange(date)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                {isPast && <Badge variant="secondary" className="hidden sm:inline-flex">历史记录</Badge>}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextDay} aria-label="下一天">
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
                variant={isToday ? 'secondary' : 'outline'}
                size="sm"
                className="h-8 px-3"
                onClick={handleBackToToday}
                disabled={isToday}
            >
                今天
            </Button>
        </div>
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
  const selectedDateStorageKey = `plan-app-data-${mode}-Daily-selected-date`;
  const [selectedDate, setSelectedDate] = useState(() => readStoredDate(selectedDateStorageKey) ?? new Date());

  useEffect(() => {
    const storedDate = readStoredDate(selectedDateStorageKey);
    if (storedDate) {
      setSelectedDate(storedDate);
    }
  }, [selectedDateStorageKey]);

  useEffect(() => {
    localStorage.setItem(selectedDateStorageKey, formatDateKey(selectedDate));
  }, [selectedDateStorageKey, selectedDate]);
  
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
            {planType === 'Daily' && <TodayDate selectedDate={selectedDate} onChange={setSelectedDate} />}
            {planType === 'Weekly' && <WeekInfo />}
            {planType === 'Monthly' && <MonthInfo />}
            {planType === 'Yearly' && <YearInfo />}
        </div>
        <CardDescription>{currentTranslation.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {planType === 'Daily' ? (
          <DailyPlanForm mode={mode} selectedDate={selectedDate} />
        ) : planType === 'Weekly' ? (
          <WeeklyPlanView mode={mode} selectedDate={selectedDate} />
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

