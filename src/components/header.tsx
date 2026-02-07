import { ListTodo } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <div className="bg-primary p-2 rounded-lg">
          <ListTodo className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="ml-3 text-2xl font-headline font-bold text-foreground">计划宝</h1>
      </div>
    </header>
  );
}
