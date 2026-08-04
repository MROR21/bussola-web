import { useEffect, useState } from 'react'
import { StepsList } from './features/onboarding/StepsList'

function App() {
  const [status, setStatus] = useState('...')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setStatus(d.status ?? 'desconhecido'))
      .catch(() => setStatus('offline'))
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-neutral-950 py-12 text-neutral-100">
      <header className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight">🧭 Bússola</h1>
        <p className="text-neutral-400">Onboarding técnico</p>
        <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs">
          API:{' '}
          <strong className={status === 'ok' ? 'text-green-400' : 'text-red-400'}>
            {status}
          </strong>
        </span>
      </header>

      <StepsList />
    </main>
  )
}

export default App
