import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseProvider } from '@/firebase/provider';
import './globals.css';

export const metadata: Metadata = {
  title: '计划宝',
  description: '你的个人规划助手。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://lh4.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://lh5.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://lh6.googleusercontent.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500&family=ZCOOL+XiaoWei&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full">
        <FirebaseProvider>
          {children}
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
