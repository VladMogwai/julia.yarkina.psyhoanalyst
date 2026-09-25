"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState, type FormEvent } from "react";
import type { Certificate } from "@/lib/supabase/types";
import { Button, ErrorMessage, Field, inputClass } from "./ui";
import { uploadImage } from "./upload-image";

type CertificateDraft = Omit<Certificate, "id" | "created_at"> & { id?: string };

const emptyDraft = (): CertificateDraft => ({
  title_ru: "",
  title_uk: "",
  title_fr: "",
  issuer: "",
  year: new Date().getFullYear(),
  image_url: "",
  sort_order: 0,
});

export function CertificatesAdmin({ supabase }: { supabase: SupabaseClient }) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [draft, setDraft] = useState<CertificateDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    supabase
      .from("certificates")
      .select("*")
      .order("sort_order")
      .order("year", { ascending: false, nullsFirst: false })
      .then(({ data, error }) => {
        if (isCancelled) return;
        if (error) setError(error.message);
        else setCertificates(data as Certificate[]);
      });
    return () => {
      isCancelled = true;
    };
  }, [supabase, reloadKey]);

  if (draft) {
    return (
      <CertificateForm
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
        <h1 className="text-2xl font-semibold">Сертификаты</h1>
        <Button onClick={() => setDraft(emptyDraft())}>+ Добавить</Button>
      </div>
      <ErrorMessage message={error} />

      {certificates.length === 0 && <p className="mt-6 text-sm text-muted">Пока нет сертификатов.</p>}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certificates.map((certificate) => (
          <li key={certificate.id}>
            <button
              type="button"
              onClick={() => setDraft(certificate)}
              className="block w-full rounded-xl border border-line bg-white p-3 text-left hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
              <img src={certificate.image_url} alt="" className="aspect-[4/3] w-full object-contain" />
              <span className="mt-2 block text-sm font-semibold">{certificate.title_ru}</span>
              <span className="text-xs text-muted">
                {[certificate.issuer, certificate.year].filter(Boolean).join(" · ")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface CertificateFormProps {
  supabase: SupabaseClient;
  initial: CertificateDraft;
  onDone: () => void;
}

function CertificateForm({ supabase, initial, onDone }: CertificateFormProps) {
  const [draft, setDraft] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<CertificateDraft>) => setDraft((current) => ({ ...current, ...patch }));

  async function handleImageChange(file: File | undefined) {
    if (!file) return;
    try {
      update({ image_url: await uploadImage(supabase, "certificates", file) });
    } catch (uploadError) {
      setError((uploadError as Error).message);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.image_url) {
      setError("Загрузите скан сертификата");
      return;
    }
    setIsSaving(true);
    const { id, ...fields } = draft;
    const { error } = id
      ? await supabase.from("certificates").update(fields).eq("id", id)
      : await supabase.from("certificates").insert(fields);
    setIsSaving(false);

    if (error) setError(error.message);
    else onDone();
  }

  async function handleDelete() {
    if (!draft.id || !confirm(`Удалить сертификат «${draft.title_ru}»?`)) return;
    const { error } = await supabase.from("certificates").delete().eq("id", draft.id);
    if (error) setError(error.message);
    else onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{draft.id ? "Редактирование сертификата" : "Новый сертификат"}</h1>
        <Button type="button" variant="secondary" onClick={onDone}>
          ← К списку
        </Button>
      </div>

      <Field label="Скан сертификата">
        <div className="flex items-center gap-4">
          {draft.image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview
            <img src={draft.image_url} alt="" className="h-24 w-32 rounded border border-line object-contain" />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageChange(e.target.files?.[0])} className="text-sm" />
        </div>
      </Field>

      <Field label="Название (русский)">
        <input required value={draft.title_ru} onChange={(e) => update({ title_ru: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Назва (українська)">
        <input required value={draft.title_uk} onChange={(e) => update({ title_uk: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Название (французский)">
        <input required value={draft.title_fr} onChange={(e) => update({ title_fr: e.target.value })} className={inputClass} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-[1fr_8rem_8rem]">
        <Field label="Кем выдан">
          <input value={draft.issuer} onChange={(e) => update({ issuer: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Год">
          <input
            type="number"
            min={1950}
            max={2100}
            value={draft.year ?? ""}
            onChange={(e) => update({ year: e.target.value ? Number(e.target.value) : null })}
            className={inputClass}
          />
        </Field>
        <Field label="Порядок" hint="Меньше — выше">
          <input
            type="number"
            value={draft.sort_order}
            onChange={(e) => update({ sort_order: Number(e.target.value) })}
            className={inputClass}
          />
        </Field>
      </div>

      <ErrorMessage message={error} />

      <div className="flex justify-between border-t border-line pt-5">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Сохранение…" : "Сохранить"}
        </Button>
        {draft.id && (
          <Button type="button" variant="danger" onClick={handleDelete}>
            Удалить
          </Button>
        )}
      </div>
    </form>
  );
}
