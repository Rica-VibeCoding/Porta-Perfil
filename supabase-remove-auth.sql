-- =====================================================
-- SCRIPT PARA REMOVER DEPENDÊNCIAS DE AUTENTICAÇÃO
-- Sistema de entrada livre
-- =====================================================

-- 1. TORNAR id_usuario OPCIONAL
-- =====================================================

-- Remover constraint NOT NULL de id_usuario
ALTER TABLE puxadores ALTER COLUMN id_usuario DROP NOT NULL;
ALTER TABLE trilhos ALTER COLUMN id_usuario DROP NOT NULL;

-- 2. REMOVER FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Remover FK constraints que causam problemas
ALTER TABLE puxadores DROP CONSTRAINT IF EXISTS puxadores_id_usuario_fkey;
ALTER TABLE trilhos DROP CONSTRAINT IF EXISTS trilhos_id_usuario_fkey;

-- 3. GARANTIR QUE RLS ESTÁ DESABILITADO
-- =====================================================

-- Desabilitar RLS em todas as tabelas
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE puxadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE trilhos DISABLE ROW LEVEL SECURITY;
ALTER TABLE pv_vidro DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Salvar_Portas" DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas RLS se existirem
DROP POLICY IF EXISTS "user_puxadores" ON puxadores;
DROP POLICY IF EXISTS "user_trilhos" ON trilhos;
DROP POLICY IF EXISTS "user_projetos" ON "Salvar_Portas";
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON usuarios;

-- 4. VERIFICAR SE TUDO FUNCIONOU
-- =====================================================

-- Teste de inserção sem id_usuario
DO $$
DECLARE
    test_puxador_id UUID;
    test_trilho_id UUID;
BEGIN
    -- Teste puxador
    INSERT INTO puxadores (nome, modelo, medida)
    VALUES ('Teste Livre', 'Teste Livre', '100mm')
    RETURNING id INTO test_puxador_id;
    
    RAISE NOTICE 'Teste puxador sem id_usuario: SUCCESS (id: %)', test_puxador_id;
    
    -- Teste trilho
    INSERT INTO trilhos (nome, tipo)
    VALUES ('Teste Livre', 'Universal')
    RETURNING id INTO test_trilho_id;
    
    RAISE NOTICE 'Teste trilho sem id_usuario: SUCCESS (id: %)', test_trilho_id;
    
    -- Limpar testes
    DELETE FROM puxadores WHERE id = test_puxador_id;
    DELETE FROM trilhos WHERE id = test_trilho_id;
    
    RAISE NOTICE '✅ Sistema configurado para entrada livre!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro no teste: %', SQLERRM;
END $$;

-- 5. MOSTRAR ESTRUTURA FINAL
-- =====================================================

SELECT 
    table_name,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('puxadores', 'trilhos') 
    AND column_name = 'id_usuario'
    AND table_schema = 'public';

RAISE NOTICE '🎯 Configuração para sistema livre concluída!';