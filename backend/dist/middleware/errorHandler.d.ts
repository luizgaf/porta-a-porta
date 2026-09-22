import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    message: string;
    code?: string | undefined;
    details?: unknown | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined, details?: unknown | undefined);
}
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map