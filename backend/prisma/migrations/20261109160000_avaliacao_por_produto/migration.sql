-- Avaliação por produto: cada produto do pedido recebe a sua nota.
-- As avaliações antigas (uma por pedido) passam a valer para cada produto daquele pedido.

DROP INDEX "avaliacoes_pedido_id_key";

ALTER TABLE "avaliacoes" ADD COLUMN "produto_id" TEXT;

-- Avaliação antiga: fica com o primeiro produto do pedido...
UPDATE "avaliacoes" a
SET "produto_id" = (
  SELECT i."produto_id" FROM "itens_pedido" i WHERE i."pedido_id" = a."pedido_id" ORDER BY i."id" LIMIT 1
);

-- ...e ganha uma cópia para cada outro produto do mesmo pedido
INSERT INTO "avaliacoes" ("id", "pedido_id", "produto_id", "comprador_id", "nota", "comentario", "removida_por", "criado_em")
SELECT gen_random_uuid()::text, a."pedido_id", i."produto_id", a."comprador_id", a."nota", a."comentario", a."removida_por", a."criado_em"
FROM "avaliacoes" a
JOIN (SELECT DISTINCT "pedido_id", "produto_id" FROM "itens_pedido") i ON i."pedido_id" = a."pedido_id"
WHERE i."produto_id" <> a."produto_id";

-- Pedido sem itens não tem o que avaliar
DELETE FROM "avaliacoes" WHERE "produto_id" IS NULL;

ALTER TABLE "avaliacoes" ALTER COLUMN "produto_id" SET NOT NULL;

CREATE UNIQUE INDEX "avaliacoes_pedido_id_produto_id_key" ON "avaliacoes"("pedido_id", "produto_id");
CREATE INDEX "avaliacoes_produto_id_idx" ON "avaliacoes"("produto_id");

ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
