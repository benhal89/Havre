'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = supabaseBrowser()

  async function sendMagicLink() {
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/` },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {sent ? (
        <p>Check your inbox for the magic link.</p>
      ) : (
        <>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={sendMagicLink}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={!email}
          >
            Send magic link
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  )
}
