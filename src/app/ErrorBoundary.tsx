import { Component, type ReactNode } from 'react'

// Rede de segurança: qualquer erro de render não tratado cai aqui, em vez de tela branca.
// Mostra uma saída amigável com "Recarregar" (que costuma resolver estado corrompido).
export class ErrorBoundary extends Component<{ children: ReactNode }, { erro: boolean }> {
  state = { erro: false }

  static getDerivedStateFromError() {
    return { erro: true }
  }

  componentDidCatch(erro: unknown) {
    console.error('Erro não tratado no Bússola:', erro)
  }

  render() {
    if (!this.state.erro) return this.props.children

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-4 text-center text-neutral-100">
        <span className="text-5xl">🧭</span>
        <h1 className="text-xl font-semibold">Algo saiu do rumo</h1>
        <p className="max-w-sm text-sm text-neutral-400">
          Encontramos um erro inesperado. Recarregar a página costuma resolver.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400"
        >
          Recarregar
        </button>
      </main>
    )
  }
}
