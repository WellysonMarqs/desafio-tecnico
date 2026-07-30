export type TurmaStatus = 'ABERTA' | 'FECHADA';

export interface Turma {
  id: number;
  codigo: string;
  disciplinaId: number;
  disciplinaNome?: string;
  capacidade: number;
  vagasDisponiveis: number;
  status: TurmaStatus;
}

export interface TurmaPayload {
  codigo: string;
  disciplinaId: number;
  capacidade: number;
  status: TurmaStatus;
}
