// M0 placeholder — exercises the design tokens so the scaffold is visually verifiable.
// Replaced with the real dashboard in M4+.
export default function Dashboard() {
  return (
    <main className="mx-auto max-w-[1120px] px-4 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">mura</h1>
      <p className="mt-1 text-ink-soft">Hospital roster — scaffold up and running.</p>

      <section className="mt-8 rounded-lg border border-grid bg-sheet p-4">
        <h2 className="text-sm font-medium text-ink-soft">Pen colors</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-md bg-pen-black-bg px-2 py-0.5 text-sm font-semibold text-pen-black">
            R
          </span>
          <span className="rounded-md bg-pen-violet-bg px-2 py-0.5 text-sm font-semibold text-pen-violet">
            G
          </span>
          <span className="rounded-md bg-pen-green-bg px-2 py-0.5 text-sm font-semibold text-pen-green">
            Pu
          </span>
          <span className="rounded-md bg-pen-red-bg px-2 py-0.5 text-sm font-semibold text-pen-red">
            D
          </span>
          <span className="rounded-md bg-pen-blue-bg px-2 py-0.5 text-sm font-semibold text-pen-blue">
            S
          </span>
          <span className="rounded-md bg-pen-teal-bg px-2 py-0.5 text-sm font-semibold text-pen-teal">
            R
          </span>
          <span className="rounded-md bg-pen-orange-bg px-2 py-0.5 text-sm font-semibold text-pen-orange">
            M
          </span>
          <span className="rounded-md bg-pen-pink-bg px-2 py-0.5 text-sm font-semibold text-pen-pink">
            U
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="rounded-md bg-cash-bg px-2 py-0.5 text-sm text-cash">◆ cash</span>
          <span className="rounded-md bg-postcash-bg px-2 py-0.5 text-sm text-postcash">
            ■ post-cash
          </span>
          <span className="rounded-md bg-draft-bg px-2 py-0.5 text-sm text-draft">DRAFT</span>
          <span className="rounded-md bg-ok-bg px-2 py-0.5 text-sm text-ok">PUBLISHED</span>
        </div>
      </section>
    </main>
  )
}
