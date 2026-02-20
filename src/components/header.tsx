'use client';

import { ListTodo, Briefcase, BookOpen, ChevronDown, Home, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UserButton from './auth/user-button';
import React from 'react';

type Mode = 'work' | 'study' | 'life' | 'travel';

type HeaderProps = {
  mode: Mode;
  setMode: (mode: Mode) => void;
};

export default function Header({ mode, setMode }: HeaderProps) {
    const modeConfig: Record<Mode, { icon: React.ReactNode; text: string }> = {
    work: { icon: <Briefcase />, text: '工作模式' },
    study: { icon: <BookOpen />, text: '学习模式' },
    life: { icon: <Home />, text: '生活模式' },
    travel: { icon: <Plane />, text: '旅游模式' },
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-primary p-2 rounded-lg">
            <ListTodo className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="ml-3 text-2xl font-headline font-bold text-foreground">计划宝</h1>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                {modeConfig[mode].icon}
                <span>{modeConfig[mode].text}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMode('study')} className="gap-2">
                <BookOpen />
                <span>学习模式</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('work')} className="gap-2">
                <Briefcase />
                <span>工作模式</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('life')} className="gap-2">
                <Home />
                <span>生活模式</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('travel')} className="gap-2">
                <Plane />
                <span>旅游模式</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
