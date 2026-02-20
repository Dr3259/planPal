'use client';

import { ListTodo, Briefcase, BookOpen, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UserButton from './auth/user-button';

type HeaderProps = {
  mode: 'work' | 'study';
  setMode: (mode: 'work' | 'study') => void;
};

export default function Header({ mode, setMode }: HeaderProps) {
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
              <Button variant="ghost" className="gap-2 w-[180px] justify-start">
                {mode === 'work' ? (
                  <>
                    <Briefcase className="mr-2" />
                    <span>工作模式</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2" />
                    <span>学习模式</span>
                  </>
                )}
                <ChevronDown className="w-4 h-4 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem onClick={() => setMode('work')} className="gap-2">
                <Briefcase />
                <span>工作模式</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('study')} className="gap-2">
                <BookOpen />
                <span>学习模式</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
