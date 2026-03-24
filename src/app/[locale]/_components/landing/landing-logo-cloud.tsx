export function LandingLogoCloud() {
  const logos = [
    { name: 'Supabase', width: 120 },
    { name: 'Stripe', width: 80 },
    { name: 'Claude AI', width: 100 },
    { name: 'Vercel', width: 90 },
  ]

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-40 grayscale lg:gap-12">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex h-8 items-center text-sm font-semibold tracking-wide text-muted-foreground"
            >
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
