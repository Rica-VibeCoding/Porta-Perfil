# Estrutura da Tabela: puxadores

| Campo       | Tipo         | Descrição                                 |
|-------------|--------------|-------------------------------------------|
| id          | uuid         | Identificador único do puxador            |
| modelo      | texto        | Nome/modelo do puxador                    |
| fabricante  | texto        | Fabricante do puxador                     |
| cor         | texto        | Cor do puxador                            |
| medida      | texto        | Medida do puxador (ex: 150mm)             |
| id_usuario  | uuid         | ID do usuário proprietário                |
| foto        | texto (URL)  | URL pública da imagem (Supabase Storage)  |
| created_at  | timestamp    | Data/hora de criação                      |

## Observações
- O campo `foto` armazena a URL pública da imagem hospedada no bucket `imagens` do Supabase.
- O bucket `imagens` deve ser público para permitir exibição direta das imagens.
- Os campos `modelo` e `medida` são obrigatórios, os demais são opcionais.

## Como criar o bucket `imagens` no Supabase
1. Acesse o painel do Supabase.
2. Vá em **Storage** > **Buckets**.
3. Clique em **New bucket** e preencha:
   - **Name**: `imagens`
   - **Public bucket**: Marque como público
4. Salve e utilize este bucket para upload de fotos de puxadores.

## Permissões de Acesso
- Na implementação atual, todos os usuários têm acesso total a todos os registros.
- O sistema de cache de usuários associa automaticamente cada registro ao seu proprietário.
- Os registros são identificados por `id_usuario`, que é mantido mesmo quando editado por outro usuário.

## Exemplo de registro
```json
{
  "id": "b03b306c-c2f2-4216-83b6-682af02da723",
  "modelo": "Slim",
  "fabricante": "Alumínios Brasil",
  "cor": "Bronze",
  "medida": "100mm",
  "id_usuario": "...",
  "foto": "https://<sua-instancia>.supabase.co/storage/v1/object/public/imagens/puxadores/slim-123.jpg",
  "created_at": "2025-04-18T18:42:29.855Z"
}
```

---

# Passo a passo para cadastrar novas tabelas no sistema

Este guia serve para criar e integrar novas tabelas (ex: "perfis", "dobradiças") seguindo o padrão do cadastramento de puxadores.

## 1. Criação da tabela no Supabase
- Acesse o painel do Supabase e vá em **Table Editor**.
- Clique em **New Table** e defina:
  - Nome da tabela (ex: `perfis`)
  - Campos obrigatórios:
    - `id` (uuid, primary key, default: uuid_generate_v4())
    - Campos específicos do item (ex: `modelo`, `cor`, `medida`, etc.)
    - `id_usuario` (uuid, referência ao usuário proprietário)
    - `foto` (texto/URL, se houver imagem)
    - `created_at` (timestamp, default: now())
- Defina permissões de acesso (RLS) conforme necessário.

## 2. Configuração de Storage
- Se a tabela tiver imagens, use o bucket público `imagens` no Supabase Storage.
- O sistema inclui tratamento de erro para criar o bucket automaticamente se não existir.
- Estrutura de pastas recomendada: `imagens/[tipo_item]/[arquivo]` (ex: `imagens/puxadores/item123.jpg`).

## 3. Ajuste do backend/configuração Supabase
- Configure as permissões (RLS) conforme necessidade do projeto:
  - **Política atual:** Todos os usuários têm acesso total a todos os registros.
  - Caso necessário restringir, crie regras baseadas em `id_usuario = auth.uid()`.
- Verifique se os triggers e funções necessários estão configurados.

## 4. Integração no frontend
- Duplique e adapte o módulo `cadastramento.js`:
  ```javascript
  // Exemplo de adaptação para nova tabela (ex: perfis)
  elementos.tabelas.perfis = document.getElementById('tabelaPerfis');
  elementos.botoes.novoPerfil = document.getElementById('btnNovoPerfil');
  
  // Renomear funções: carregarPuxadores -> carregarPerfis, etc.
  // Adaptar renderizarTabelaPuxadores para renderizarTabelaPerfis
  ```
- Atualize os elementos HTML correspondentes:
  - Tabela para listagem dos itens
  - Formulários para cadastro/edição
  - Botões e controles
- Adicione validação específica para campos obrigatórios.
- Aproveite o sistema de cache de usuários que já está implementado.

## 5. Acessibilidade e UI
- Mantenha suporte à navegação por teclado:
  ```javascript
  // Exemplos já implementados:
  tr.setAttribute('tabindex', '0'); // Torna a linha focável 
  btnEditar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          editarItem(id);
      }
  });
  ```
- Inclua atributos `aria-*` e `title` para melhorar a experiência com leitores de tela.
- Mantenha tooltips para textos truncados ou que precisam de explicação adicional.

## 6. Tratamento de erros
- Implemente fallbacks adequados:
  - Dados de demonstração para quando a tabela não existir
  - Mensagens claras para erros de permissão ou conexão
  - Tratamento para falhas de upload de imagens
- Use o sistema de notificações:
  ```javascript
  mostrarNotificacao('Mensagem de sucesso', 'success');
  mostrarNotificacao('Mensagem de erro', 'error');
  ```

## 7. Checklist de testes e validação
- [ ] Cadastro, edição e exclusão funcionam
- [ ] Upload e exibição de imagens funcionam (se aplicável)
- [ ] Campos obrigatórios são validados corretamente
- [ ] Interface é acessível por teclado e screen readers
- [ ] Mensagens de feedback são claras e informativas
- [ ] Modo de demonstração funciona quando tabela não existe
- [ ] Tratamento de erros é adequado
- [ ] A experiência é consistente com outros módulos

---

> **Dica:** Para adaptar este sistema para novas tabelas, comece renomeando elementos e funções de forma sistemática. Mantenha sempre a mesma estrutura de responsabilidades.

> **Boas práticas:** Mantenha o padrão de nomenclatura de elementos DOM com prefixos descritivos (`elementos.tabelas.nome`, `elementos.botoes.nome`) para facilitar manutenção.
