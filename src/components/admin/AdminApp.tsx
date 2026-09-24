"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { ArticlesAdmin } from "./ArticlesAdmin";
import { CertificatesAdmin } from "./CertificatesAdmin";
import { Button, ErrorMessage, Field, inputClass } from "./ui";

type Tab = "articles" | "certificates";

export function AdminApp() {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("articles");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (!supabase) {
    return <Centered>Supabase не настроен: задайте переменные из .env.example.</Centered>;
  }
  if (session === undefined) return <Centered>Загрузка…</Centered>;
  if (!session) return <LoginForm supabase={supabase} />;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <nav className="flex gap-2">
          {(
            [
              ["articles", "Статьи"],
              ["certificates", "Сертификаты"],
            ] as const
          ).map(([value, label]) => (
            <Button key={value} variant={tab === value ? "primary" : "secondary"} onClick={() => setTab(value)}>
              {label}
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>{session.user.email}</span>
          <Button variant="secondary" onClick={() => supabase.auth.signOut()}>
            Выйти
          </Button>
        </div>
      </header>

      <p className="mt-5 rounded-lg bg-sand px-4 py-3 text-sm">
        После сохранения сайт пересобирается автоматически — изменения появятся примерно через 2–3 минуты.
      </p>

      <main className="mt-8">
        {tab === "articles" ? <ArticlesAdmin supabase={supabase} /> : <CertificatesAdmin supabase={supabase} />}
      </main>
    </div>
  );
}

function LoginForm({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setError(error ? "Неверный email или пароль" : null);
    setIsSubmitting(false);
  }

  return (
    <Centered>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-white p-8 text-left">
        <h1 className="text-xl font-semibold">Вход в админку</h1>
        <Field label="Email">
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Пароль">
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </Field>
        <ErrorMessage message={error} />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          Войти
        </Button>
      </form>
    </Centered>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center p-5 text-center text-muted">{children}</div>;
}
