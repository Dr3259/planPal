import { config } from 'dotenv';
config();

import '@/ai/flows/ai-suggest-monthly-tasks.ts';
import '@/ai/flows/ai-suggest-yearly-tasks.ts';
import '@/ai/flows/ai-suggest-weekly-tasks.ts';
import '@/ai/flows/ai-suggest-daily-tasks.ts';