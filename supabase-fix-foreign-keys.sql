-- =====================================================
-- SCRIPT PARA CORRIGIR PROBLEMAS DE FOREIGN KEYS
-- Execute este script se ainda houver erros FK
-- =====================================================

-- 1. REMOVER TODAS AS FOREIGN KEY CONSTRAINTS PROBLEMÁTICAS
-- =====================================================

-- Remover FK constraints que causam problemas
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Buscar e remover constraints de FK em puxadores
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.puxadores'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE public.puxadores DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Removida constraint % da tabela puxadores', constraint_name;
    END LOOP;
    
    -- Buscar e remover constraints de FK em trilhos
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.trilhos'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE public.trilhos DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Removida constraint % da tabela trilhos', constraint_name;
    END LOOP;
END $$;

-- 2. GARANTIR QUE AS COLUNAS ID_USUARIO SEJAM NULLABLE
-- =====================================================

-- Tornar id_usuario nullable em puxadores
ALTER TABLE public.puxadores ALTER COLUMN id_usuario DROP NOT NULL;

-- Tornar id_usuario nullable em trilhos  
ALTER TABLE public.trilhos ALTER COLUMN id_usuario DROP NOT NULL;

-- 3. LIMPAR REGISTROS COM IDs INVÁLIDOS (OPCIONAL)
-- =====================================================

-- Comentado por segurança - descomente se necessário
/*
-- Limpar puxadores com id_usuario inválido
UPDATE public.puxadores 
SET id_usuario = NULL 
WHERE id_usuario IS NOT NULL 
AND id_usuario NOT IN (SELECT id FROM public.usuarios);

-- Limpar trilhos com id_usuario inválido
UPDATE public.trilhos 
SET id_usuario = NULL 
WHERE id_usuario IS NOT NULL 
AND id_usuario NOT IN (SELECT id FROM public.usuarios);
*/

-- 4. CRIAR FOREIGN KEYS OPCIONAIS (SE DESEJAR MANTER RELACIONAMENTO)
-- =====================================================

-- FK opcional para puxadores (permite NULL)
ALTER TABLE public.puxadores 
ADD CONSTRAINT puxadores_id_usuario_fkey_optional 
FOREIGN KEY (id_usuario) 
REFERENCES public.usuarios(id) 
ON DELETE SET NULL;

-- FK opcional para trilhos (permite NULL)
ALTER TABLE public.trilhos 
ADD CONSTRAINT trilhos_id_usuario_fkey_optional 
FOREIGN KEY (id_usuario) 
REFERENCES public.usuarios(id) 
ON DELETE SET NULL;

-- 5. VERIFICAR SE TUDO ESTÁ FUNCIONANDO
-- =====================================================

-- Teste de inserção em puxadores SEM id_usuario
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.puxadores (nome, modelo, medida)
    VALUES ('Teste FK Fix', 'Teste FK Fix', '100mm')
    RETURNING id INTO test_id;
    
    RAISE NOTICE 'Teste de inserção em puxadores SEM id_usuario: SUCCESS (id: %)', test_id;
    
    -- Limpar teste
    DELETE FROM public.puxadores WHERE id = test_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Teste de inserção em puxadores FALHOU: %', SQLERRM;
END $$;

-- Teste de inserção em trilhos SEM id_usuario
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.trilhos (nome, tipo)
    VALUES ('Teste FK Fix', 'Teste')
    RETURNING id INTO test_id;
    
    RAISE NOTICE 'Teste de inserção em trilhos SEM id_usuario: SUCCESS (id: %)', test_id;
    
    -- Limpar teste
    DELETE FROM public.trilhos WHERE id = test_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Teste de inserção em trilhos FALHOU: %', SQLERRM;
END $$;

-- Teste de inserção em puxadores COM id_usuario válido
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.puxadores (nome, modelo, medida, id_usuario)
    VALUES ('Teste FK Fix Com User', 'Teste FK Fix Com User', '100mm', '00000000-0000-0000-0000-000000000007')
    RETURNING id INTO test_id;
    
    RAISE NOTICE 'Teste de inserção em puxadores COM id_usuario: SUCCESS (id: %)', test_id;
    
    -- Limpar teste
    DELETE FROM public.puxadores WHERE id = test_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Teste de inserção em puxadores COM id_usuario FALHOU: %', SQLERRM;
END $$;

-- 6. MOSTRAR STATUS FINAL
-- =====================================================

SELECT 
    'puxadores' as tabela,
    COUNT(*) as total_registros,
    COUNT(id_usuario) as com_usuario,
    COUNT(*) - COUNT(id_usuario) as sem_usuario
FROM public.puxadores

UNION ALL

SELECT 
    'trilhos' as tabela,
    COUNT(*) as total_registros,
    COUNT(id_usuario) as com_usuario,
    COUNT(*) - COUNT(id_usuario) as sem_usuario
FROM public.trilhos

UNION ALL

SELECT 
    'usuarios' as tabela,
    COUNT(*) as total_registros,
    0 as com_usuario,
    0 as sem_usuario
FROM public.usuarios;

RAISE NOTICE '✅ Script de correção de Foreign Keys executado!';
RAISE NOTICE 'Agora as tabelas puxadores e trilhos aceitam inserções sem id_usuario';
RAISE NOTICE 'As Foreign Keys são opcionais e não bloqueiam inserções';