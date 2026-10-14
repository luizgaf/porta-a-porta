-- Remove a coluna de token de push, que não é mais usada (push fora do escopo)
ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "push_token";

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "imagem_url" TEXT;

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "entidade_tipo" TEXT,
    "entidade_id" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacoes_usuario_id_lida_idx" ON "notificacoes"("usuario_id", "lida");

-- CreateIndex
CREATE INDEX "notificacoes_condominio_id_idx" ON "notificacoes"("condominio_id");

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

