'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { LogIn, LogOut, Settings } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { useState } from 'react';

export default function UserButton() {
  
  const { user, loading } = useUser();
  const auth = useAuth();
  const [optimisticProfile, setOptimisticProfile] = useState<{ displayName?: string; email?: string; photoURL?: string } | null>(null);

  const optimizeGooglePhotoURL = (url: string, size = 64) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('googleusercontent.com')) {
        if (!u.searchParams.get('sz') && !u.searchParams.get('s')) {
          u.searchParams.set('sz', String(size));
        }
        return u.toString();
      }
    } catch {}
    return url;
  };

  const handleSignIn = async () => {
    if (!auth) return;
    logger.log('[Auth] handleSignIn start');
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      logger.log('[Auth] Attempt popup sign-in');
      const result = await signInWithPopup(auth, provider);
      logger.log('[Auth] Popup sign-in success', {
        user: {
          uid: result.user?.uid,
          email: result.user?.email,
          displayName: result.user?.displayName,
        },
      });
      try {
        const p = result.user;
        const providerProfile = p.providerData.find(pr => pr.photoURL || pr.displayName || pr.email);
        const raw = p.photoURL ?? providerProfile?.photoURL ?? '';
        const photoURL = raw ? optimizeGooglePhotoURL(raw, 64) : '';
        setOptimisticProfile({
          displayName: p.displayName ?? providerProfile?.displayName ?? '',
          email: p.email ?? providerProfile?.email ?? '',
          photoURL,
        });
        // 立即预加载头像，提高显示速度
        if (photoURL) {
          const img = new Image();
          img.src = photoURL;
          img.onload = () => logger.log('[Auth] Avatar preloaded successfully');
          img.onerror = () => logger.error('[Auth] Avatar preload failed');
        }
      } catch {}
      toast({
        title: '登录成功',
        description: '欢迎回来',
      });
    } catch (error) {
      const err = error as { code?: string; message?: string };
      logger.error('[Auth] Popup sign-in error', { code: err?.code, message: err?.message });
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        logger.log('[Auth] Fallback to redirect sign-in');
        toast({
          title: '切换为重定向登录',
          description: '当前环境阻止弹窗，已改为重定向方式登录',
        });
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (e) {
          logger.error('[Auth] Redirect sign-in error', e);
        }
      }
      if (err.code === 'auth/unauthorized-domain') {
        toast({
          variant: 'destructive',
          title: '域名未授权',
          description: `请在 Firebase 控制台的 Authentication -> Settings -> Authorized domains 添加：${window.location.hostname}`,
        });
      }
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      logger.log('[Auth] Sign out start');
      await signOut(auth);
      logger.log('[Auth] Sign out success');
      toast({
        title: '已退出登录',
        description: '您已安全退出',
      });
    } catch (error) {
      logger.error('[Auth] Sign out error', error);
      toast({
        variant: 'destructive',
        title: '退出登录失败',
        description: '请稍后重试',
      });
    }
  };

  if (loading) {
    const current = auth?.currentUser;
    if (current) {
      logger.log('[Auth] Using currentUser while loading');
      const currentProfile = current.providerData.find(p => p.photoURL || p.displayName || p.email);
      const displayName = current.displayName ?? currentProfile?.displayName ?? '';
      const email = current.email ?? currentProfile?.email ?? '';
      const photoURLRaw = current.photoURL ?? currentProfile?.photoURL ?? '';
      const photoURL = photoURLRaw ? optimizeGooglePhotoURL(photoURLRaw, 64) : '';
      const fallbackText = displayName?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || 'U';
      
      // 预加载头像
      if (photoURL && typeof window !== 'undefined') {
        const img = new Image();
        img.src = photoURL;
      }
      
      return (
        <DropdownMenu
          onOpenChange={(open) => {
            logger.log('[Auth] Menu open change (fallback currentUser):', open);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 p-0"
              aria-label="打开账户菜单"
              onPointerDownCapture={() => {
                logger.log('[Auth] Pointer down capture on avatar button (fallback)');
              }}
              onClick={() => {
                logger.log('[Auth] Avatar button click (fallback)');
              }}
            >
              <Avatar className="h-10 w-10">
                {photoURL ? <AvatarImage src={photoURL} alt={displayName} /> : null}
                <AvatarFallback>{fallbackText}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>个人设置</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <Button variant="ghost" size="icon" className="h-10 w-10 p-0" disabled aria-label="加载中">
        <Skeleton className="h-10 w-10 rounded-full" />
      </Button>
    );
  }

  if (!user) {
    if (optimisticProfile) {
      const fallbackText =
        optimisticProfile.displayName?.charAt(0).toUpperCase() ||
        optimisticProfile.email?.charAt(0).toUpperCase() ||
        'U';
      return (
        <div className="h-10 w-10">
          <Button variant="ghost" size="icon" className="h-10 w-10 p-0" aria-label="账户">
            <Avatar className="h-10 w-10">
              {optimisticProfile.photoURL ? (
                <AvatarImage
                  src={optimisticProfile.photoURL}
                  alt={optimisticProfile.displayName ?? ''}
                />
              ) : null}
              <AvatarFallback>{fallbackText}</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      );
    }
  
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            onClick={() => {
              logger.log('[Auth] Click login trigger');
            }}
          >
            <LogIn className="mr-2 h-4 w-4" />
            登录
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[400px]"
          onOpenAutoFocus={() => {
            logger.log('[Auth] Provider dialog opened');
            toast({ title: '选择登录方式', description: '请选择一种登录方式' });
          }}
        >
          <DialogHeader>
            <DialogTitle>选择登录方式</DialogTitle>
            <DialogDescription>请选择一种登录方式。</DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2">
            <Button
              onClick={() => {
                logger.log('[Auth] Click Google login button');
                handleSignIn();
              }}
            >
              使用 Google 登录
            </Button>
            <Button variant="secondary" disabled>使用 GitHub 登录（即将支持）</Button>
            <Button variant="secondary" disabled>使用 QQ 登录（即将支持）</Button>
            <Button variant="secondary" disabled>使用 微信 登录（即将支持）</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        logger.log('[Auth] Menu open change:', open);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 p-0"
          aria-label="打开账户菜单"
          onPointerDownCapture={() => {
            logger.log('[Auth] Pointer down capture on avatar button');
          }}
          onClick={() => {
            logger.log('[Auth] Avatar button click');
          }}
        >
          <Avatar className="h-10 w-10">
            {(() => {
              const providerProfile = user.providerData.find(p => p.photoURL || p.displayName || p.email);
              const raw = user.photoURL ?? providerProfile?.photoURL ?? '';
              const photoURL = raw ? optimizeGooglePhotoURL(raw, 64) : '';
              const displayName = user.displayName ?? providerProfile?.displayName ?? '';
              if (photoURL) {
                return <AvatarImage src={photoURL} alt={displayName ?? ''} />;
              }
              return null;
            })()}
            <AvatarFallback>
              {(() => {
                const providerProfile = user.providerData.find(p => p.photoURL || p.displayName || p.email);
                const displayName = user.displayName ?? providerProfile?.displayName ?? '';
                const email = user.email ?? providerProfile?.email ?? '';
                return displayName?.charAt(0).toUpperCase() ?? email?.charAt(0).toUpperCase();
              })()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>个人设置</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  
}
