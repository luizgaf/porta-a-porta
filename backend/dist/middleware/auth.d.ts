import { Request, Response, NextFunction } from 'express';
type TipoUsuario = 'COMPRADOR' | 'VENDEDOR' | 'SINDICO';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        condominioId: string;
        nome: string;
        email: string;
        unidade: string;
        tipo: TipoUsuario;
    };
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireRole: (...roles: TipoUsuario[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireCondominio: (req: AuthRequest, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=auth.d.ts.map