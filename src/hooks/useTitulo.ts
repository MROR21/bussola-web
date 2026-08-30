import { useEffect } from 'react'

// Título da aba por página — passa vazio (ou não chama) pra voltar ao título padrão do app.
export function useTitulo(titulo?: string) {
  useEffect(() => {
    document.title = titulo
      ? `${titulo} - Bússola`
      : 'Bússola - Onboarding técnico e repositório de conhecimento'
  }, [titulo])
}
