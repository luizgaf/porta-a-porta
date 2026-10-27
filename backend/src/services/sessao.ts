import jwt from 'jsonwebtoken';

// Token de acesso. O condominioId é o condomínio ativo: o de origem no login e outro
// condomínio quando o usuário troca para um em que tem vínculo aprovado.
export const gerarToken = (usuarioId: string, condominioId: string, tipo: string) =>
  jwt.sign({ id: usuarioId, condominioId, tipo }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
