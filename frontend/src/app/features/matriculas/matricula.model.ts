export type MatriculaStatus = 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA';

export interface Matricula {
  id: number;
  alunoId: number;
  turmaId: number;
  status: MatriculaStatus;
  criadaEm?: string;
  confirmadaEm?: string;
  canceladaEm?: string;
}

export interface MatriculaPayload {
  alunoId: number;
  turmaId: number;
}
