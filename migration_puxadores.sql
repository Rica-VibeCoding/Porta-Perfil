-- Migration para adicionar os puxadores disponíveis no sistema

-- Criação da tabela puxadores (se ainda não existir)
-- Usando a estrutura atual observada nos dados reais
CREATE TABLE IF NOT EXISTS puxadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id),
    modelo VARCHAR(50) NOT NULL,
    fabricante VARCHAR(100),
    cor VARCHAR(50),
    medida VARCHAR(50),
    foto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_puxadores_id_usuario ON puxadores(id_usuario);

-- Observações:
-- 1. Esta migration reflete a estrutura atual da tabela no banco de dados
-- 2. O campo id_usuario é uma chave estrangeira que referencia a tabela usuarios
-- 3. Os campos foto e created_at são usados pelo sistema atual
-- 4. Todos os campos são obrigatórios para compatibilidade com o código existente

-- Não incluímos inserções de dados nesta migration, pois os dados são gerenciados pela interface

-- Nota: No sistema atual, as medidas e posições são armazenadas diretamente como 
-- strings nos campos 'medida' e não há um campo de posição separado.
-- As tabelas auxiliares abaixo foram removidas da migration atual, pois não
-- são utilizadas pelo sistema em produção. 