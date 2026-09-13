'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import './login.css';

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
    <form onSubmit={onSubmit} className="login-form space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[var(--app-ink)]">
          邮箱
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="name@company.com"
          className="login-input h-11 border-[var(--app-line)] bg-white text-[var(--app-ink)] placeholder:text-[var(--app-muted)]/70 focus-visible:border-[var(--app-accent)] focus-visible:ring-[var(--app-accent)]/25"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-[var(--app-ink)]">
          密码
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="至少 6 位"
          className="login-input h-11 border-[var(--app-line)] bg-white text-[var(--app-ink)] placeholder:text-[var(--app-muted)]/70 focus-visible:border-[var(--app-accent)] focus-visible:ring-[var(--app-accent)]/25"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="login-submit h-11 w-full bg-[var(--app-accent)] text-white shadow-sm shadow-[var(--app-accent)]/25 hover:bg-[#0c635c] disabled:opacity-70"
      >
        {loading ? '登录中…' : '进入工作台'}
      </Button>
      <p className="text-center text-sm leading-relaxed text-[var(--app-muted)]">
        账号由管理员开通，不支持自助注册
      </p>
    </form>
  );
}

const OUTLINE_LINES = [
  '1 项目概况',
  '2 需求与必要性',
  '3 建设方案',
  '4 投资估算',
  '5 财务评价',
  '6 结论与建议',
] as const;

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-shell">
        <aside className="login-brand" aria-label="产品介绍">
          <div className="login-brand-glow" aria-hidden />
          <div className="login-manuscript" aria-hidden>
            <div className="login-manuscript-rule" />
            <ul className="login-outline">
              {OUTLINE_LINES.map(line => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="login-brand-copy">
            <p className="login-kicker">可行性研究报告 · 智写引擎</p>
            <h1 className="login-title">可研智写</h1>
            <p className="login-lead">
              从信息采集、智能依据到分章生成与 Word 导出，把可研写作收成一条清晰的工作流。
            </p>
            <dl className="login-steps">
              <div>
                <dt>采集</dt>
                <dd>结构化项目信息</dd>
              </div>
              <div>
                <dt>依据</dt>
                <dd>政策标准智能挂载</dd>
              </div>
              <div>
                <dt>成稿</dt>
                <dd>分章智写与导出</dd>
              </div>
            </dl>
          </div>
        </aside>

        <main className="login-panel">
          <div className="login-panel-inner">
            <header className="login-panel-head">
              <h2 className="login-panel-title">登录</h2>
              <p className="login-panel-desc">使用已开通账号继续编写报告</p>
            </header>
            <Suspense
              fallback={
                <p className="text-sm text-[var(--app-muted)]">加载中…</p>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
