-- Um pedido por vendedor. Pedidos gravados antes desta mudança podiam misturar produtos de
-- vendedores diferentes, e a mudança de status de um vendedor valia para os itens do outro.
-- Cada pedido misturado fica com os itens do vendedor do primeiro item; os itens de cada outro
-- vendedor vão para um pedido novo, com a mesma entrega, horário, status e data, e as avaliações
-- desses produtos acompanham os itens.

DO $$
DECLARE
  r RECORD;
  novo TEXT;
BEGIN
  FOR r IN
    SELECT DISTINCT i.pedido_id, pr.vendedor_id
    FROM itens_pedido i
    JOIN produtos pr ON pr.id = i.produto_id
    WHERE pr.vendedor_id <> (
      SELECT pr2.vendedor_id
      FROM itens_pedido i2
      JOIN produtos pr2 ON pr2.id = i2.produto_id
      WHERE i2.pedido_id = i.pedido_id
      ORDER BY i2.id
      LIMIT 1
    )
  LOOP
    novo := gen_random_uuid()::text;

    INSERT INTO pedidos (id, condominio_id, comprador_id, unidade_entrega, tipo_entrega, janela_horario, status, valor_total, criado_em, atualizado_em)
    SELECT novo, condominio_id, comprador_id, unidade_entrega, tipo_entrega, janela_horario, status, 0, criado_em, now()
    FROM pedidos
    WHERE id = r.pedido_id;

    UPDATE itens_pedido
    SET pedido_id = novo
    WHERE pedido_id = r.pedido_id
      AND produto_id IN (SELECT id FROM produtos WHERE vendedor_id = r.vendedor_id);

    UPDATE avaliacoes
    SET pedido_id = novo
    WHERE pedido_id = r.pedido_id
      AND produto_id IN (SELECT id FROM produtos WHERE vendedor_id = r.vendedor_id);
  END LOOP;
END $$;

-- Total de cada pedido = soma dos itens que ficaram nele (preço congelado no item)
UPDATE pedidos p
SET valor_total = s.total
FROM (
  SELECT pedido_id, SUM(quantidade * preco_unitario) AS total
  FROM itens_pedido
  GROUP BY pedido_id
) s
WHERE s.pedido_id = p.id
  AND p.valor_total <> s.total;
