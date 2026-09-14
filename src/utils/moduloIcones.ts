// Lista curada de ícones do material-symbols pra escolher na criação/edição de um Módulo — troca
// o antigo dicionário fixo por NOME de módulo (só cobria 4 nomes; qualquer módulo novo caía num
// ícone genérico de quebra-cabeça sem jeito de corrigir sem mexer em código, ver GuiasPage.tsx).
export const MODULO_ICONES = [
  'inventory_2',
  'engineering',
  'construction',
  'precision_manufacturing',
  'handyman',
  'home_repair_service',
  'foundation',
  'architecture',
  'factory',
  'warehouse',
  'local_shipping',
  'agriculture',
  'hub',
  'desktop_windows',
  'code',
  'terminal',
  'storage',
  'cloud',
  'security',
  'groups',
  'school',
  'quiz',
  'checklist',
  'dashboard',
] as const

export const ICONE_MODULO_PADRAO = 'inventory_2'
