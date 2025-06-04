# Documentação do Projeto PORTAS PERFIS

> Última atualização: 15/04/2025

## Visão Geral

Este projeto consiste em um aplicativo web para desenho técnico de portas e perfis, permitindo a configuração de diversos parâmetros como dimensões, tipo de vidro, perfil, dobradiças e puxadores. O desenho é gerado dinamicamente usando SVG, resultando em uma representação técnica precisa e otimizada para impressão.

## Fluxo de Inicialização

1. As credenciais do Supabase são definidas no `<head>` do `index.html`.
2. O sistema inicializa o Supabase e os módulos principais (cadastramento, autenticação, desenho, etc).
3. Se o Supabase não estiver disponível, o sistema entra em modo demonstração com dados mockados.
4. Funções globais utilitárias são expostas para depuração (ver exemplos abaixo).

## Funções Globais Utilitárias

- `inicializarAplicacao()`: Reinicializa toda a aplicação, útil para diagnóstico e recuperação de estado.
- `diagnosticarImpressao()`: Retorna um diagnóstico detalhado do sistema de impressão/exportação.

**Exemplo de uso no console:**
```js
inicializarAplicacao();
console.log(diagnosticarImpressao());
```

## Tratamento de Erros de Imagem (SVG Fallback)

Se uma imagem de puxador não carregar, o sistema exibe automaticamente um SVG de fallback para garantir acessibilidade e clareza visual:

```html
<img src="URL_DA_IMAGEM" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'><rect width=\'120\' height=\'120\' fill=\'%23f5f5f5\'/><text x=\'50%25\' y=\'50%25\' font-size=\'14\' text-anchor=\'middle\' alignment-baseline=\'middle\' font-family=\'Arial\' fill=\'%23999999\'>Imagem não disponível</text></svg>'">
```

**Exemplo visual:**
![Exemplo SVG fallback](https://raw.githubusercontent.com/vibecode/portas-perfis/main/DOC/img/fallback-exemplo.png)

## Integração do Campo `foto` dos Puxadores

- O campo `foto` da tabela `puxadores` armazena a URL pública da imagem hospedada no bucket `imagens` do Supabase.
- O upload é feito automaticamente pelo sistema, e o link é salvo no banco.
- Caso o bucket não exista, o sistema tenta criá-lo automaticamente.

## Referência a Problemas Conhecidos

Consulte o arquivo [`DOC/PROBLEMAS.md`](./PROBLEMAS.md) para detalhes sobre:
- Loops de redesenho
- Fallbacks para localStorage
- Erros de importação e robustez
- Soluções para travamentos e erros de imagem

## Estrutura do Projeto

### Diretórios e Arquivos Principais

- **js/drawing/**: Módulo principal de desenho SVG
  - **core.js**: Funções SVG fundamentais
  - **elements.js**: Componentes gráficos (dobradiças, puxadores, vidros)
  - **door-types.js**: Lógica e renderização dos tipos de porta
  - **annotations.js**: Sistema de cotas técnicas
  - **config.js**: Configurações globais de desenho
  - **utils.js**: Funções utilitárias
  - **index.js**: Agrupamento dos módulos de desenho
- **js/**: Scripts principais e de interface
  - **main.js**: Entrada da aplicação e controle principal
  - **initialize.js**: Inicialização do sistema
  - **storage.js**: Persistência e gerenciamento de dados
  - **sidebar.js**: Controle do menu lateral (sidebar)
  - **ui-controls.js**: Elementos e lógica da interface do usuário
  - **form-handlers.js**: Manipulação de formulários e validações
  - **printing.js**: Sistema de impressão e exportação PDF
  - **diagnostico.js**: Diagnóstico e correção de erros
  - **novo-projeto.js**: Criação de novos projetos
  - **notifications.js**: Notificações e alertas
- **css/**: Estilos customizados (styles.css, sidebar.css, bootstrap-sidebar.css, etc.)
- **index.html**: Interface principal da aplicação
- **tests/**: Scripts de testes automatizados
- **DOC/**: Documentação do projeto

## Funcionalidades Principais

### Renderização e Configuração de Portas
- Desenho SVG dinâmico e responsivo, ajustável em tempo real
- Suporte a múltiplos tipos de perfis (RM-059, RM-060, RM-119, RM-377, RM-114)
- Sistema de vidros com gradientes otimizados para performance e exportação PDF
- Dobradiças automáticas conforme altura da porta, com opção "S/Dobradiças"
- Puxadores verticais/horizontais, com lógica inteligente de posicionamento e opção "S/Puxador"
- Cotas técnicas automáticas e configuráveis
- Exportação para PDF com qualidade técnica

### Interface do Usuário
- Sidebar interativa para configuração de medidas, perfis, vidros e hardware
- Campo "Quantidade" com lógica para múltiplas portas
- Checkbox "Porta em Par" (dupla lado a lado):
  - Exibido apenas quando a quantidade for par (2, 4, 6...)
  - Desabilitado/oculto para quantidades ímpares
- **Ajuste Automático de Dimensões:** Ao selecionar um novo "Tipo de Porta" (Basculante, Deslizante, etc.) na seção "Função da Porta", as dimensões (Largura, Altura) e a Quantidade são automaticamente ajustadas para os valores padrão recomendados para aquele tipo específico, agilizando a configuração.
- Visualização em tempo real do desenho técnico
- Sistema de notificações e feedback

### Outros Recursos
- Diagnóstico automático e correção de problemas comuns
- Sistema de projetos recentes, ordenação e limitação
- Impressão otimizada e legendas técnicas
- Testes automatizados e scripts de diagnóstico

### Comportamento Específico por Tipo de Porta
- Portas de abrir: lógica de puxadores e dobradiças conforme lado e posição
- Portas deslizantes: puxadores em um ou ambos os lados
- Portas basculantes: puxador horizontal, dobradiças sempre no topo

### Otimizações Recentes
- Redução de gradientes para melhor performance
- Debounce e proteção contra loops de redesenho
- Validação rigorosa de parâmetros
- Isolamento de funções críticas

## Comportamento Específico Por Tipo de Porta

### 1. Portas de Abrir (Superior/Inferior)
- Puxador vertical na lateral oposta às dobradiças

### 2. Documentação
- JSDoc em funções importantes
- Comentários explicativos em seções críticas
- Documentação atualizada de alterações

## Dependências

- **Bootstrap 5**: Interface do sidebar, modais e responsividade (CDN: bootstrap@5.2.3)
- **Bootstrap Icons**: Ícones da interface (CDN: bootstrap-icons@1.10.0)
- **Inter Font**: Fonte principal (Google Fonts)
- **HTML2PDF.js**: Exportação para PDF (v0.10.1)
- **Node.js**: Ambiente para scripts e servidor local
- **ESLint/Jest**: Padronização e testes automatizados

## Melhorias Planejadas e Roadmap

- Otimização adicional de SVG e gradientes
- Implementação de cache e preview leve
- Modo escuro e responsividade aprimorada
- Exportação para múltiplos formatos
- Sistema de templates para projetos
- Testes automatizados e integração contínua (CI/CD)
- Documentação de API e exemplos de uso
- Expansão de tipos de porta e configurações específicas

## Guia de Manutenção

### 1. Alterações em Gradientes
- Manter IDs únicos globais
- Seguir padrão de otimização
- Testar em PDFs grandes

### 2. Novos Perfis
- Adicionar em ordem lógica
- Manter descrições consistentes
- Atualizar documentação

### 3. Performance
- Monitorar tamanho de PDFs
- Verificar reutilização de elementos
- Otimizar renderização

### 4. Testes
- Verificar em diferentes navegadores
- Testar impressão
- Validar PDFs gerados

### 5. Distâncias e Posicionamento
- Posição vertical da porta:
  - Portas de abrir: posY = (CONFIG.altura - alturaPorta) / 4
  - Portas deslizantes: posY = (CONFIG.altura - alturaPorta) / 3
- Distância das cotas: 50px padronizado para largura e altura

### 6. Prevenção de Problemas Conhecidos
- Seguir diretrizes em `.cursor/DOC/PROBLEMAS.md`
- Implementar debounce em operações de redesenho
- Evitar loops recursivos nas funções de cálculo
- Validar parâmetros de todas as funções
- Usar timeout para redesenhos complexos 