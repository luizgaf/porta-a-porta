-- Vínculos de usuários com outros condomínios, aprovados pelo síndico de cada condomínio

-- CreateEnum
CREATE TYPE "StatusVinculo" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO');

-- CreateTable
CREATE TABLE "vinculos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "condominio_id" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "tipo_solicitado" "TipoUsuario" NOT NULL,
    "tipo" "TipoUsuario",
    "status" "StatusVinculo" NOT NULL DEFAULT 'PENDENTE',
    "decidido_por" TEXT,
    "decidido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vinculos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vinculos_condominio_id_status_idx" ON "vinculos"("condominio_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vinculos_usuario_id_condominio_id_key" ON "vinculos"("usuario_id", "condominio_id");

-- AddForeignKey
ALTER TABLE "vinculos" ADD CONSTRAINT "vinculos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculos" ADD CONSTRAINT "vinculos_condominio_id_fkey" FOREIGN KEY ("condominio_id") REFERENCES "condominios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
