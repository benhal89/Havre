export default function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto max-w-6xl px-4 text-xs text-slate-500">
        © {new Date().getFullYear()} Havre · Built for curious travelers
      </div>
    </footer>
  )
}