import { apiPost, apiSend } from '../../services/api'
import type { TrailStep } from '../onboarding/types'
import type { Perfil, Squad } from './types'

// Envia o Perfil e recebe os 16 passos com a profundidade recomendada (POST /onboarding/trail).
export function postTrail(perfil: Perfil): Promise<TrailStep[]> {
  return apiPost<TrailStep[]>('/onboarding/trail', perfil)
}

// Persiste o nivelamento no usuário (perfil de skills + squad).
export function salvarPerfil(userId: string, perfil: Perfil, squad: Squad): Promise<void> {
  return apiSend('PUT', `/users/${userId}/perfil`, { perfil, squad })
}
