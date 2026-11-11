export default function GamesLoading() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 md:px-8 md:pt-32 lg:max-w-[56rem]" aria-busy="true" aria-label="Loading games">
      <div className="mb-8 flex flex-col items-center gap-3 sm:mb-10">
        <p className="text-sm font-medium text-muted-foreground motion-reduce:opacity-100">Shuffling the tables…</p>
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted/70 motion-reduce:animate-none" />
        <div className="mt-2 h-10 w-full max-w-lg animate-pulse rounded-2xl bg-muted/60 motion-reduce:animate-none" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-14 animate-pulse rounded-full bg-muted/50 motion-reduce:animate-none" />
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-6 w-16 animate-pulse rounded-full bg-muted/40 motion-reduce:animate-none" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] animate-pulse rounded-[28px] bg-muted motion-reduce:animate-none sm:rounded-[32px]"
            style={{ animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
