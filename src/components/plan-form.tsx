"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wand2, Loader2, ClipboardCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  goals: z.string().min(10, { message: 'Please describe your goals in at least 10 characters.' }),
});

type PlanFormProps = {
  planType: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  suggestionAction: (input: { [key: string]: string }) => Promise<{ suggestedTasks: string | string[] }>;
  placeholder: string;
};

export default function PlanForm({ planType, suggestionAction, placeholder }: PlanFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<string | string[] | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      goals: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setSuggestedTasks(null);
    try {
      const inputKey = `${planType.toLowerCase()}Goals`;
      const result = await suggestionAction({ [inputKey]: data.goals });
      setSuggestedTasks(result.suggestedTasks);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "There was a problem with the AI suggestion. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const renderTasks = (tasks: string | string[]) => {
    if (typeof tasks === 'string') {
      return tasks.split('\n').filter(task => task.trim()).map((task, index) => (
        <li key={index} className="flex items-start gap-3">
          <ClipboardCheck className="h-5 w-5 mt-1 text-primary shrink-0" />
          <span>{task.replace(/^\d+\.\s*/, '')}</span>
        </li>
      ));
    }
    return tasks.map((task, index) => (
      <li key={index} className="flex items-start gap-3">
        <ClipboardCheck className="h-5 w-5 mt-1 text-primary shrink-0" />
        <span>{task}</span>
      </li>
    ));
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">{planType} Plan</CardTitle>
        <CardDescription>Outline your goals for the {planType.toLowerCase()} and let AI help you break them down into actionable tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">My {planType} Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={placeholder}
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Suggest Tasks with AI
                </>
              )}
            </Button>
          </form>
        </Form>
        {(isLoading || suggestedTasks) && (
          <div className="mt-8">
            <Separator />
            <h3 className="text-2xl font-headline mt-6 mb-4">Suggested Tasks</h3>
            {isLoading && !suggestedTasks && (
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <div className="h-5 w-5 bg-muted rounded-full animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="h-5 w-5 bg-muted rounded-full animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="h-5 w-5 bg-muted rounded-full animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                    </div>
                </div>
            )}
            {suggestedTasks && (
                <ul className="space-y-4">
                {renderTasks(suggestedTasks)}
                </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
