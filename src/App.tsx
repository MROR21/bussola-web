import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('...')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setStatus(d.status ?? 'desconhecido'))
      .catch(() => setStatus('offline'))
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 text-neutral-100">
      <h1 className="text-5xl font-bold tracking-tight">🧭 Bússola</h1>
      <p className="text-neutral-400">Onboarding técnico — em construção.</p>
      <span className="rounded-full border border-neutral-700 px-3 py-1 text-sm">
        API:{' '}
        <strong className={status === 'ok' ? 'text-green-400' : 'text-red-400'}>
          {status}
        </strong>
      </span>
    </main>
  )
}

export default App
