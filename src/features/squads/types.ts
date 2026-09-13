// Squad (ex.: "Mão de Obra"). Antes era um enum fixo (3 valores); agora é entidade real no back
// (Id/Nome/Order) — o admin cria/renomeia pela tela de Squads.
export interface Squad {
  id: string
  nome: string
}
