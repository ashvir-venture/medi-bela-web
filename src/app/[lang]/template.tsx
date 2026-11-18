// A template re-mounts on every navigation, so each page gets a short, quiet fade-in
// (the "page transition"). CSS only; switched off under prefers-reduced-motion.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>
}
