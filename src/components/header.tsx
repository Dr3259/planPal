'use client';

import { ListTodo, Briefcase, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
        <div className="flex items-center gap-2">
          <Button
            variant={mode === 'work' ? 'default' : 'ghost'}
            onClick={() => setMode('work')}
            className={cn('gap-2')}
          >
            <Briefcase />
            工作模式
          </Button>
          <Button
            variant={mode === 'study' ? 'default' : 'ghost'}
            onClick={() => setMode('study')}
            className={cn('gap-2')}
          >
            <BookOpen />
            学习模式
          </Button>
        </div>
      </div>
    </header>
  );
}