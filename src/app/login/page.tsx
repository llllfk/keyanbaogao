'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : '登录失败';
        toast.error(message);
        return;
      }
      toast.success('登录成功');
      const next = searchParams.get('next') || '/projects';
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="至少 6 位"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '登录中…' : '登录'}
      </Button>
      <p className="text-center text-sm text-[var(--app-muted)]">
        账号由管理员开通，不支持自助注册
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-canvas)] px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--app-ink)]">
            可研智写
          </p>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            AI 驱动的可研报告智写引擎 · 登录后继续创作
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-[var(--app-muted)]">加载中…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
