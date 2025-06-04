# Documentação da Tabela `usuarios`

## Descrição
A tabela `usuarios` armazena as informações dos usuários que têm acesso ao Sistema de Portas e Perfis. Esta tabela é essencial para o controle de acesso, autenticação e personalização da experiência do usuário.

## Estrutura

| Campo          | Tipo                   | Descrição                                 | Obrigatório | Único |
|----------------|------------------------|-------------------------------------------|-------------|-------|
| id             | UUID                   | Identificador único do usuário            | Sim         | Sim   |
| nome           | TEXT                   | Nome completo do usuário                  | Sim         | Não   |
| email          | TEXT                   | Email do usuário (usado para login)       | Sim         | Sim   |
| empresa        | TEXT                   | Empresa à qual o usuário está vinculado   | Sim         | Não   |
| created_at     | TIMESTAMP WITH TIME ZONE | Data e hora de criação do registro      | Não         | Não   |
| ultimo_acesso  | TIMESTAMP WITH TIME ZONE | Data e hora do último acesso do usuário | Não         | Não   |

## Regras e Restrições

1. O campo `id` é gerado automaticamente pelo sistema usando a função `uuid_generate_v4()`.
2. O campo `email` deve ser único para evitar duplicidade de contas.
3. O campo `created_at` é preenchido automaticamente com a data e hora atual no momento da criação.
4. O campo `ultimo_acesso` é atualizado sempre que o usuário faz login no sistema.

## Relacionamentos
Atualmente, a tabela `usuarios` não possui relacionamentos diretos com outras tabelas. No futuro, poderá ser relacionada com:

- Tabela de projetos (relação um para muitos)
- Tabela de permissões (relação muitos para muitos)

## Índices
- Índice primário: `id`
- Índice secundário: `email` (para otimizar buscas por email)

## SQL de Criação

```sql
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  empresa TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultimo_acesso TIMESTAMP WITH TIME ZONE
);
```

## Interface de Usuário

A tabela `usuarios` é exibida na interface através de um modal de gerenciamento de usuários com as seguintes características:

### Layout da Tabela
- **Tamanho do Modal**: Modal XL (Extra largo) para maximizar espaço de visualização
- **Colunas**:
  - Nome (20% da largura)
  - Email (25% da largura)
  - Empresa (25% da largura)
  - Data Cadastro (100px, centralizada)
  - Último Acesso (100px, centralizada)
  - Ações (80px)

### Estilização
- **Fonte**: 0.85rem para economizar espaço e permitir mais conteúdo em uma linha
- **Layout da Tabela**: Fixed para garantir consistência de larguras das colunas
- **Truncamento**: Textos longos são truncados com ellipsis (...) e exibem o texto completo no tooltip
- **Colunas de Data**: Centralizadas com largura fixa para melhor alinhamento visual

### Formulários
- **Modal de Novo/Editar Usuário**: Modal de tamanho médio (440px) com campos para:
  - Nome (campo de texto)
  - Email (campo de email)
  - Empresa (campo de texto)
- **Modal de Exclusão**: Confirmação com nome do usuário antes de proceder com a exclusão

### Recursos de Interface
- Modais arrastáveis (drag-and-drop) para melhor experiência do usuário
- Botões de ação (editar/excluir) alinhados horizontalmente
- Tabela responsiva que mantém estrutura consistente em diferentes tamanhos de tela

## Exemplos de Uso

### Inserir um novo usuário
```sql
INSERT INTO usuarios (nome, email, empresa) 
VALUES ('João da Silva', 'joao@email.com', 'Portas do Brasil');
```

### Consultar todos os usuários
```sql
SELECT * FROM usuarios ORDER BY nome;
```

### Atualizar dados de um usuário
```sql
UPDATE usuarios 
SET nome = 'João Silva Santos', empresa = 'Portas do Brasil Ltda.' 
WHERE id = '404fb501-29ca-44b9-abd5-1b7e55b0d91b';
```

### Registrar o último acesso
```sql
UPDATE usuarios 
SET ultimo_acesso = NOW() 
WHERE email = 'joao@email.com';
```

## Modo de Demonstração
O sistema possui um modo de demonstração que é ativado automaticamente quando:
1. A tabela `usuarios` não existe no banco de dados Supabase
2. A conexão com o banco de dados falha
3. A tabela existe mas está vazia

Nesse modo, dados fictícios são exibidos na interface, permitindo demonstrar a funcionalidade sem necessidade de conexão com o banco.

## Implementação JavaScript
O gerenciamento de usuários é implementado no arquivo `js/usuarios.js`, que contém:
- Funções para listar, adicionar, editar e excluir usuários
- Tratamento de erros de conexão com fallback para modo de demonstração
- Validação de formulários antes de salvar
- Manipulação dinâmica da interface

## Segurança e Permissões
- Os usuários finais não devem ter acesso direto a esta tabela.
- Todas as operações devem ser feitas através da API Supabase com as devidas validações.
- Senhas não são armazenadas nesta tabela; a autenticação é gerenciada pelo serviço Auth do Supabase.

## Observações
- A tabela está localizada no projeto Supabase "PORTA_PERFIL".
- Futuramente, campos adicionais como "cargo", "telefone" e "foto_perfil" poderão ser adicionados conforme necessidade.
- A empresa é um campo obrigatório, mas pode ser usado "Autônomo" para usuários sem vínculo empresarial.

```bash

```
