export interface Aluno {
  id: number;
  nome: string;
  email: string;
  matricula: string;
  criadoEm?: string;
}

export interface AlunoPayload {
  nome: string;
  email: string;
  matricula: string;
}
