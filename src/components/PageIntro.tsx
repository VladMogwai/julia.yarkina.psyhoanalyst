export function PageIntro({ title, intro }: { title: string; intro: string }) {
  return (
    <header className="container-page pt-14 pb-12 md:pt-20">
      <h1 className="font-serif text-5xl font-medium sm:text-6xl">{title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{intro}</p>
    </header>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="container-page">
      <p className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">{text}</p>
    </div>
  );
}
