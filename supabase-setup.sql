-- =====================================================
-- SCRIPT DE CONFIGURAÇÃO PARA SUPABASE
-- Sistema de Portas e Perfis
-- =====================================================

-- 1. CRIAR/VERIFICAR TABELA USUARIOS
-- =====================================================

-- Criar tabela usuarios se não existir
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    perfil VARCHAR(255),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir usuário admin se não existir
INSERT INTO public.usuarios (id, nome, email, perfil, ativo, criado_em)
VALUES (
    '00000000-0000-0000-0000-000000000007',
    'Ricardo Nilton Borges',
    'ricardo.nilton@hotmail.com',
    'Conecta Móveis e Representações',
    true,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Garantir que o email do admin também seja único
INSERT INTO public.usuarios (id, nome, email, perfil, ativo, criado_em)
VALUES (
    '00000000-0000-0000-0000-000000000008',
    'Ricardo Conecta',
    'ricardo@conectamoveis.net.br',
    'Conecta Móveis',
    true,
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 2. MODIFICAR TABELA PUXADORES
-- =====================================================

-- Verificar se tabela puxadores existe e ajustar estrutura
DO $$
BEGIN
    -- Tornar id_usuario opcional (permitir NULL)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'puxadores' AND column_name = 'id_usuario') THEN
        
        -- Remover constraint NOT NULL se existir
        ALTER TABLE public.puxadores ALTER COLUMN id_usuario DROP NOT NULL;
        
        -- Remover foreign key constraint temporariamente para permitir NULLs
        ALTER TABLE public.puxadores DROP CONSTRAINT IF EXISTS puxadores_id_usuario_fkey;
        
        RAISE NOTICE 'Tabela puxadores ajustada para permitir id_usuario NULL';
    END IF;
END $$;

-- Criar tabela puxadores se não existir
CREATE TABLE IF NOT EXISTS public.puxadores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    modelo VARCHAR(255) NOT NULL,
    fabricante VARCHAR(255),
    cor VARCHAR(255),
    medida VARCHAR(100),
    foto TEXT,
    id_usuario UUID, -- NULLABLE - sem foreign key por enquanto
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MODIFICAR TABELA TRILHOS
-- =====================================================

-- Verificar se tabela trilhos existe e ajustar estrutura
DO $$
BEGIN
    -- Tornar id_usuario opcional (permitir NULL)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'trilhos' AND column_name = 'id_usuario') THEN
        
        -- Remover constraint NOT NULL se existir
        ALTER TABLE public.trilhos ALTER COLUMN id_usuario DROP NOT NULL;
        
        -- Remover foreign key constraint temporariamente
        ALTER TABLE public.trilhos DROP CONSTRAINT IF EXISTS trilhos_id_usuario_fkey;
        
        RAISE NOTICE 'Tabela trilhos ajustada para permitir id_usuario NULL';
    END IF;
END $$;

-- Criar tabela trilhos se não existir
CREATE TABLE IF NOT EXISTS public.trilhos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(255),
    fabricante VARCHAR(255),
    cor VARCHAR(255),
    foto TEXT,
    id_usuario UUID, -- NULLABLE - sem foreign key por enquanto
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA VIDROS (PV_VIDRO)
-- =====================================================

-- Criar tabela de vidros se não existir
CREATE TABLE IF NOT EXISTS public.pv_vidro (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo VARCHAR(255) UNIQUE NOT NULL,
    rgb VARCHAR(50) DEFAULT '255,255,255,0.3',
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tipos básicos de vidro se não existirem
INSERT INTO public.pv_vidro (tipo, rgb, ativo) VALUES
    ('Incolor', '230,235,240,0.35', true),
    ('Espelho', '220,220,225,0.70', true),
    ('Fumê', '80,80,85,0.45', true),
    ('Bronze', '139,117,81,0.50', true),
    ('Verde', '120,180,120,0.40', true)
ON CONFLICT (tipo) DO NOTHING;

-- 5. CONFIGURAR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS mas com políticas permissivas para desenvolvimento
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puxadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trilhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pv_vidro ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento (AJUSTAR EM PRODUÇÃO)
-- USUARIOS - acesso total para usuários autenticados
DROP POLICY IF EXISTS "usuarios_select_policy" ON public.usuarios;
CREATE POLICY "usuarios_select_policy" ON public.usuarios
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "usuarios_insert_policy" ON public.usuarios;
CREATE POLICY "usuarios_insert_policy" ON public.usuarios
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;
CREATE POLICY "usuarios_update_policy" ON public.usuarios
    FOR UPDATE USING (true);

-- PUXADORES - acesso total para desenvolvimento
DROP POLICY IF EXISTS "puxadores_select_policy" ON public.puxadores;
CREATE POLICY "puxadores_select_policy" ON public.puxadores
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "puxadores_insert_policy" ON public.puxadores;
CREATE POLICY "puxadores_insert_policy" ON public.puxadores
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "puxadores_update_policy" ON public.puxadores;
CREATE POLICY "puxadores_update_policy" ON public.puxadores
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "puxadores_delete_policy" ON public.puxadores;
CREATE POLICY "puxadores_delete_policy" ON public.puxadores
    FOR DELETE USING (true);

-- TRILHOS - acesso total para desenvolvimento
DROP POLICY IF EXISTS "trilhos_select_policy" ON public.trilhos;
CREATE POLICY "trilhos_select_policy" ON public.trilhos
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "trilhos_insert_policy" ON public.trilhos;
CREATE POLICY "trilhos_insert_policy" ON public.trilhos
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "trilhos_update_policy" ON public.trilhos;
CREATE POLICY "trilhos_update_policy" ON public.trilhos
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "trilhos_delete_policy" ON public.trilhos;
CREATE POLICY "trilhos_delete_policy" ON public.trilhos
    FOR DELETE USING (true);

-- VIDROS - acesso total para desenvolvimento
DROP POLICY IF EXISTS "vidros_select_policy" ON public.pv_vidro;
CREATE POLICY "vidros_select_policy" ON public.pv_vidro
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "vidros_insert_policy" ON public.pv_vidro;
CREATE POLICY "vidros_insert_policy" ON public.pv_vidro
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "vidros_update_policy" ON public.pv_vidro;
CREATE POLICY "vidros_update_policy" ON public.pv_vidro
    FOR UPDATE USING (true);

-- 6. INSERIR DADOS DE EXEMPLO
-- =====================================================

-- Inserir alguns puxadores de exemplo
INSERT INTO public.puxadores (nome, modelo, fabricante, cor, medida, id_usuario) VALUES
    ('Cielo', 'Cielo', 'Aluminium', 'Anodizado', '150mm', '00000000-0000-0000-0000-000000000007'),
    ('Luna', 'Luna', 'GlassFit', 'Preto', '300mm', '00000000-0000-0000-0000-000000000007'),
    ('Stella', 'Stella', 'Aluminium', 'Branco', '200mm', '00000000-0000-0000-0000-000000000007'),
    ('Basic Handle', 'Basic', 'Generic', 'Inox', '120mm', NULL) -- Exemplo sem usuário
ON CONFLICT DO NOTHING;

-- Inserir alguns trilhos de exemplo
INSERT INTO public.trilhos (nome, tipo, fabricante, cor, id_usuario) VALUES
    ('RO-654025', 'Embutir', 'Rometal', 'Anodizado', '00000000-0000-0000-0000-000000000007'),
    ('KT-890142', 'Sobrepor', 'Kit', 'Preto', '00000000-0000-0000-0000-000000000007'),
    ('AL-123456', 'Deslizante', 'Alumaster', 'Branco', '00000000-0000-0000-0000-000000000007'),
    ('Basic Track', 'Universal', 'Generic', 'Natural', NULL) -- Exemplo sem usuário
ON CONFLICT DO NOTHING;

-- 7. VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se tudo foi criado corretamente
DO $$
DECLARE
    usuarios_count INTEGER;
    puxadores_count INTEGER;
    trilhos_count INTEGER;
    vidros_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO usuarios_count FROM public.usuarios;
    SELECT COUNT(*) INTO puxadores_count FROM public.puxadores;
    SELECT COUNT(*) INTO trilhos_count FROM public.trilhos;
    SELECT COUNT(*) INTO vidros_count FROM public.pv_vidro;
    
    RAISE NOTICE '=== RESUMO DA CONFIGURAÇÃO ===';
    RAISE NOTICE 'Usuários criados: %', usuarios_count;
    RAISE NOTICE 'Puxadores disponíveis: %', puxadores_count;
    RAISE NOTICE 'Trilhos disponíveis: %', trilhos_count;
    RAISE NOTICE 'Tipos de vidro: %', vidros_count;
    RAISE NOTICE '================================';
    
    IF usuarios_count > 0 AND puxadores_count > 0 AND trilhos_count > 0 AND vidros_count > 0 THEN
        RAISE NOTICE '✅ Configuração concluída com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Alguns dados podem estar faltando. Verifique as tabelas.';
    END IF;
END $$;

-- Mostrar estrutura das tabelas criadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('usuarios', 'puxadores', 'trilhos', 'pv_vidro')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;