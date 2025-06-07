-- =====================================================
-- SCRIPT FINAL PARA SISTEMA DE ENTRADA LIVRE
-- Execute este SQL no Supabase Dashboard
-- =====================================================

-- 1. VERIFICAR ESTADO ATUAL
-- =====================================================
SELECT 'ANTES DAS ALTERAÇÕES:' as status;

SELECT 
    table_name,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('puxadores', 'trilhos') 
    AND column_name = 'id_usuario'
    AND table_schema = 'public';

-- 2. TORNAR id_usuario OPCIONAL (NULLABLE)
-- =====================================================

-- Tornar id_usuario nullable em puxadores
ALTER TABLE public.puxadores ALTER COLUMN id_usuario DROP NOT NULL;

-- Tornar id_usuario nullable em trilhos  
ALTER TABLE public.trilhos ALTER COLUMN id_usuario DROP NOT NULL;

-- 3. REMOVER FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Remover FK de puxadores (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%puxadores%fkey%' 
        AND table_name = 'puxadores'
    ) THEN
        ALTER TABLE public.puxadores DROP CONSTRAINT puxadores_id_usuario_fkey;
        RAISE NOTICE 'FK constraint removida de puxadores';
    ELSE
        RAISE NOTICE 'FK constraint já não existe em puxadores';
    END IF;
END $$;

-- Remover FK de trilhos (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%trilhos%fkey%' 
        AND table_name = 'trilhos'
    ) THEN
        ALTER TABLE public.trilhos DROP CONSTRAINT trilhos_id_usuario_fkey;
        RAISE NOTICE 'FK constraint removida de trilhos';
    ELSE
        RAISE NOTICE 'FK constraint já não existe em trilhos';
    END IF;
END $$;

-- 4. GARANTIR QUE RLS ESTÁ DESABILITADO
-- =====================================================

-- Desabilitar RLS em todas as tabelas para sistema livre
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.puxadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trilhos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pv_vidro DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Salvar_Portas" DISABLE ROW LEVEL SECURITY;

-- Remover políticas se existirem
DROP POLICY IF EXISTS "user_puxadores" ON public.puxadores;
DROP POLICY IF EXISTS "user_trilhos" ON public.trilhos;
DROP POLICY IF EXISTS "user_projetos" ON public."Salvar_Portas";

-- 5. TESTE DE INSERÇÃO
-- =====================================================

-- Teste inserir puxador SEM id_usuario
DO $$
DECLARE
    test_puxador_id UUID;
BEGIN
    INSERT INTO public.puxadores (nome, modelo, medida, id_usuario)
    VALUES ('Teste Sistema Livre', 'Teste Sistema Livre', '100mm', NULL)
    RETURNING id INTO test_puxador_id;
    
    RAISE NOTICE '✅ Teste puxador sem id_usuario: SUCCESS (id: %)', test_puxador_id;
    
    -- Limpar teste
    DELETE FROM public.puxadores WHERE id = test_puxador_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro no teste de puxador: %', SQLERRM;
END $$;

-- Teste inserir trilho SEM id_usuario
DO $$
DECLARE
    test_trilho_id UUID;
BEGIN
    INSERT INTO public.trilhos (nome, tipo, id_usuario)
    VALUES ('Teste Sistema Livre', 'Universal', NULL)
    RETURNING id INTO test_trilho_id;
    
    RAISE NOTICE '✅ Teste trilho sem id_usuario: SUCCESS (id: %)', test_trilho_id;
    
    -- Limpar teste
    DELETE FROM public.trilhos WHERE id = test_trilho_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro no teste de trilho: %', SQLERRM;
END $$;

-- 6. VERIFICAR RESULTADO FINAL
-- =====================================================
SELECT 'APÓS AS ALTERAÇÕES:' as status;

SELECT 
    table_name,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('puxadores', 'trilhos') 
    AND column_name = 'id_usuario'
    AND table_schema = 'public';

-- Verificar se existem FK constraints
SELECT 
    tc.table_name, 
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('puxadores', 'trilhos')
    AND tc.table_schema = 'public';

-- Mostrar dados de exemplo
SELECT 'puxadores' as tabela, COUNT(*) as total_registros FROM public.puxadores
UNION ALL
SELECT 'trilhos' as tabela, COUNT(*) as total_registros FROM public.trilhos
UNION ALL
SELECT 'usuarios' as tabela, COUNT(*) as total_registros FROM public.usuarios
UNION ALL
SELECT 'pv_vidro' as tabela, COUNT(*) as total_registros FROM public.pv_vidro;

-- 7. INSERIR DADOS BÁSICOS SE NÃO EXISTIREM
-- =====================================================

-- Inserir alguns puxadores básicos
INSERT INTO public.puxadores (nome, modelo, fabricante, medida, id_usuario) VALUES
    ('Cielo', 'Cielo', 'Aluminium', '150mm', NULL),
    ('Luna', 'Luna', 'GlassFit', '300mm', NULL),
    ('Stella', 'Stella', 'Aluminium', '200mm', NULL),
    ('Basic', 'Basic', 'Generic', '120mm', NULL)
ON CONFLICT DO NOTHING;

-- Inserir alguns trilhos básicos
INSERT INTO public.trilhos (nome, tipo, fabricante, cor, id_usuario) VALUES
    ('RO-654025', 'Embutir', 'Rometal', 'Anodizado', NULL),
    ('KT-890142', 'Sobrepor', 'Kit', 'Preto', NULL),
    ('AL-123456', 'Deslizante', 'Alumaster', 'Branco', NULL),
    ('Universal', 'Universal', 'Generic', 'Natural', NULL)
ON CONFLICT DO NOTHING;

-- Inserir tipos básicos de vidro se não existirem
INSERT INTO public.pv_vidro (tipo, rgb, ativo) VALUES
    ('Incolor', '230,235,240,0.35', true),
    ('Fumê', '80,80,85,0.45', true),
    ('Bronze', '139,117,81,0.50', true),
    ('Verde', '120,180,120,0.40', true),
    ('Espelho', '220,220,225,0.70', true)
ON CONFLICT (tipo) DO NOTHING;

RAISE NOTICE '🎉 CONFIGURAÇÃO PARA SISTEMA LIVRE CONCLUÍDA!';
RAISE NOTICE '✅ Agora o sistema aceita inserções sem id_usuario';
RAISE NOTICE '✅ Não há mais constraints de FK bloqueando';
RAISE NOTICE '✅ RLS desabilitado para acesso livre';
RAISE NOTICE '✅ Dados básicos inseridos para teste';