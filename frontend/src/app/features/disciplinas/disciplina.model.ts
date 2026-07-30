export interface Disciplina {
  id: number;
  nome: string;
  codigo: string;
  cursoId: number;
  cursoNome?: string;
}

export interface DisciplinaPayload {
  nome: string;
  codigo: string;
  cursoId: number;
}
