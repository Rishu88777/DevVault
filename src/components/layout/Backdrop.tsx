/**
 * Calm animated background: three soft colour glows drifting slowly (transform-only, GPU friendly).
 * Paused by prefers-reduced-motion (see index.css) and never intercepts clicks.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-orb bg-orb-a" />
      <div className="bg-orb bg-orb-b" />
      <div className="bg-orb bg-orb-c" />
      <div className="dot-grid absolute inset-0 opacity-60" />
    </div>
  )
}
