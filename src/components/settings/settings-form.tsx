'use client';

import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SettingsState = {
  deepseekConfigured: boolean;
  deepseekApiKeyMasked: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
};

function errorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'string'
  ) {
    return (data as { error: string }).error;
  }
  return fallback;
}

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [apiKey, setApiKey] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '加载设置失败'));
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (payload as { data: { settings?: SettingsState } }).data
          : null;
      if (data?.settings) {
        setSettings(data.settings);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiKey.trim()) {
      toast.error('请输入 DeepSeek API Key，或使用「清除」');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deepseekApiKey: apiKey }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '保存失败'));
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (payload as { data: { settings?: SettingsState } }).data
          : null;
      if (data?.settings) {
        setSettings(data.settings);
      }
      setApiKey('');
      toast.success('DeepSeek API Key 已保存');
    } finally {
      setSaving(false);
    }
  };

  const onClear = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearDeepseekApiKey: true }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '清除失败'));
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (payload as { data: { settings?: SettingsState } }).data
          : null;
      if (data?.settings) {
        setSettings(data.settings);
      }
      setApiKey('');
      toast.success('已清除 API Key');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-[var(--app-muted)]">加载设置中…</p>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <section className="space-y-4 rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] px-4 py-6 sm:px-6">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
            智写大模型
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            分章智写与单章智能重写将调用你配置的 DeepSeek 能力。API Key
            加密存库，界面仅展示脱敏信息。
          </p>
        </div>

        <div className="rounded-md border border-[var(--app-line)] bg-[var(--app-tint)]/40 px-3 py-3 text-sm text-[var(--app-muted)]">
          <p>
            状态：{' '}
            {settings?.deepseekConfigured ? (
              <span className="text-[var(--app-ink)]">
                已配置（{settings.deepseekApiKeyMasked}）
              </span>
            ) : (
              <span className="text-destructive">未配置</span>
            )}
          </p>
          <p className="mt-1">
            默认模型：{settings?.deepseekModel ?? 'deepseek-chat'} · Base URL：
            {settings?.deepseekBaseUrl ?? 'https://api.deepseek.com'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deepseekApiKey">DeepSeek API Key</Label>
          <Input
            id="deepseekApiKey"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={event => setApiKey(event.target.value)}
            placeholder={
              settings?.deepseekConfigured
                ? '输入新 Key 以覆盖'
                : 'sk-...'
            }
          />
          <p className="text-xs text-[var(--app-muted)]">
            在 DeepSeek 开放平台创建 Key 后粘贴至此，即可激活智写引擎。
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? '保存中…' : '保存 API Key'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving || !settings?.deepseekConfigured}
            onClick={() => {
              void onClear();
            }}
          >
            清除
          </Button>
        </div>
      </section>
    </form>
  );
}
