// Divide um Markdown em "slides" a cada `## título` — sem campo novo no banco, aproveita a
// convenção que o próprio conteúdo da Ambientação já segue (um `##` por seção/slide da
// apresentação original). Conteúdo antes do primeiro `##` (se houver) vira o primeiro bloco, sem
// título. Um conteúdo com 0 ou 1 `##` sempre volta um array de tamanho <= 1 — quem chama decide
// que isso não tem "slide" nenhum pra passar, é só um artigo comum.
export function dividirEmSlides(markdown: string): string[] {
  const linhas = markdown.split('\n')
  const blocos: string[][] = []
  let atual: string[] = []

  for (const linha of linhas) {
    if (/^##\s+/.test(linha) && atual.some((l) => l.trim() !== '')) {
      blocos.push(atual)
      atual = []
    }
    atual.push(linha)
  }
  if (atual.some((l) => l.trim() !== '')) blocos.push(atual)

  return blocos.map((b) => b.join('\n').trim()).filter(Boolean)
}
