"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { renderMarkdown } from "@/lib/markdown";
import { slugify } from "@/lib/slugify";
import type { Article } from "@/lib/supabase/types";
import { Button, ErrorMessage, Field, inputClass } from "./ui";
import { uploadImage } from "./upload-image";

type ArticleDraft = Omit<Article, "id" | "updated_at"> & { id?: string };

const emptyDraft = (): ArticleDraft => ({
  locale: "ru",
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  cover_url: null,
  is_published: false,
  published_at: new Date().toISOString().slice(0, 10),
});

const localeLabels: Record<Locale, string> = { ru: "Русский", uk: "Українська", fr: "Français" };

export function ArticlesAdmin({ supabase }: { supabase: SupabaseClient }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [draft, setDraft] = useState<ArticleDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data, error }) => {
        if (isCancelled) return;
        if (error) setError(error.message);
        else setArticles(data as Article[]);
      });
    return () => {
      isCancelled = true;
    };
  }, [supabase, reloadKey]);

  if (draft) {
    return (
      <ArticleForm
        supabase={supabase}
        initial={draft}
        onDone={() => {
          setDraft(null);
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Статьи</h1>
        <Button onClick={() => setDraft(emptyDraft())}>+ Новая статья</Button>
      </div>
      <ErrorMessage message={error} />

      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-white">
        {articles.length === 0 && <li className="p-5 text-sm text-muted">Пока нет статей.</li>}
        {articles.map((article) => (
          <li key={article.id}>
            <button
              type="button"
              onClick={() => setDraft(article)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-sand/50"
            >
              <span>
                <span className="block font-semibold">{article.title}</span>
                <span className="text-xs text-muted">
                  {localeLabels[article.locale]} · {article.published_at}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${article.is_published ? "bg-accent/10 text-accent" : "bg-sand text-muted"}`}
              >
                {article.is_published ? "Опубликована" : "Черновик"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface ArticleFormProps {
  supabase: SupabaseClient;
  initial: ArticleDraft;
  onDone: () => void;
}

function ArticleForm({ supabase, initial, onDone }: ArticleFormProps) {
  const [draft, setDraft] = useState(initial);
  const [isSlugEdited, setIsSlugEdited] = useState(Boolean(initial.id));
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<ArticleDraft>) => setDraft((current) => ({ ...current, ...patch }));

  function handleTitleChange(title: string) {
    update(isSlugEdited ? { title } : { title, slug: slugify(title) });
  }

  async function handleCoverChange(file: File | undefined) {
    if (!file) return;
    try {
      update({ cover_url: await uploadImage(supabase, "articles", file) });
    } catch (uploadError) {
      setError((uploadError as Error).message);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    const { id, ...fields } = draft;
    const { error } = id
      ? await supabase.from("articles").update(fields).eq("id", id)
      : await supabase.from("articles").insert(fields);
    setIsSaving(false);

    if (error) {
      setError(error.code === "23505" ? "Статья с таким адресом уже есть" : error.message);
      return;
    }
    onDone();
  }

  async function handleDelete() {
    if (!draft.id || !confirm(`Удалить статью «${draft.title}»?`)) return;
    const { error } = await supabase.from("articles").delete().eq("id", draft.id);
    if (error) setError(error.message);
    else onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{draft.id ? "Редактирование статьи" : "Новая статья"}</h1>
        <Button type="button" variant="secondary" onClick={onDone}>
          ← К списку
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_12rem_12rem]">
        <Field label="Заголовок">
          <input required value={draft.title} onChange={(e) => handleTitleChange(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Язык">
          <select value={draft.locale} onChange={(e) => update({ locale: e.target.value as Locale })} className={inputClass}>
            {Object.entries(localeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Дата">
          <input type="date" required value={draft.published_at} onChange={(e) => update({ published_at: e.target.value })} className={inputClass} />
        </Field>
      </div>

      <Field label="Адрес страницы" hint={`/${draft.locale}/articles/${draft.slug || "…"}`}>
        <input
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          value={draft.slug}
          onChange={(e) => {
            setIsSlugEdited(true);
            update({ slug: e.target.value });
          }}
          className={inputClass}
        />
      </Field>

      <Field label="Краткое описание" hint="Показывается в списке статей и в поисковиках. 1–2 предложения.">
        <textarea rows={2} value={draft.excerpt} onChange={(e) => update({ excerpt: e.target.value })} className={inputClass} />
      </Field>

      <Field label="Обложка (необязательно)">
        <div className="flex items-center gap-4">
          {draft.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview
            <img src={draft.cover_url} alt="" className="h-16 w-24 rounded object-cover" />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleCoverChange(e.target.files?.[0])} className="text-sm" />
          {draft.cover_url && (
            <Button type="button" variant="danger" onClick={() => update({ cover_url: null })}>
              Убрать
            </Button>
          )}
        </div>
      </Field>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold">Текст</span>
          <Button type="button" variant="secondary" onClick={() => setShowPreview((value) => !value)}>
            {showPreview ? "Редактировать" : "Предпросмотр"}
          </Button>
        </div>
        {showPreview ? (
          <div
            className="prose prose-stone min-h-80 max-w-none rounded-lg border border-line bg-white p-5"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.body) }}
          />
        ) : (
          <textarea
            rows={18}
            value={draft.body}
            onChange={(e) => update({ body: e.target.value })}
            className={`${inputClass} font-mono`}
          />
        )}
        <p className="mt-1 text-xs text-muted">
          Оформление: ## Подзаголовок, **жирный**, *курсив*, &gt; цитата, - список, [ссылка](https://…). Ссылка на YouTube отдельной строкой — встроенное видео. Пустая строка — новый абзац.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={draft.is_published} onChange={(e) => update({ is_published: e.target.checked })} />
        Опубликовать на сайте
      </label>

      <ErrorMessage message={error} />

      <div className="flex justify-between border-t border-line pt-5">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Сохранение…" : "Сохранить"}
        </Button>
        {draft.id && (
          <Button type="button" variant="danger" onClick={handleDelete}>
            Удалить статью
          </Button>
        )}
      </div>
    </form>
  );
}
