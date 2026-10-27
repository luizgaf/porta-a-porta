-- Foto de perfil e sanções (advertência, suspensão e banimento) aplicadas pelo síndico

-- CreateEnum
CREATE TYPE "TipoSancao" AS ENUM ('ADVERTENCIA', 'SUSPENSAO', 'BANIMENTO');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "foto_url" TEXT;

-- CreateTable
CREATE TABLE "sancoes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "sindico_id" TEXT NOT NULL,
    "tipo" "TipoSancao" NOT NULL,
    "motivo" TEXT NOT NULL,
    "ate" TIMESTAMP(3),
    "revogada_em" TIMESTAMP(3),
    "revogada_por" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sancoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sancoes_usuario_id_condominio_id_idx" ON "sancoes"("usuario_id", "condominio_id");

-- CreateIndex
CREATE INDEX "sancoes_condominio_id_tipo_idx" ON "sancoes"("condominio_id", "tipo");

-- AddForeignKey
ALTER TABLE "sancoes" ADD CONSTRAINT "sancoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sancoes" ADD CONSTRAINT "sancoes_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
