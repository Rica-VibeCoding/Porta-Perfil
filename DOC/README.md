# PORTAS PERFIS — Aplicativo de Desenho Técnico de Portas e Perfis

> Última atualização: 15/04/2025

## Visão Geral

Sistema web para desenho técnico de portas e perfis, com configuração dinâmica de dimensões, perfis, vidros, puxadores e dobradiças. Permite exportação otimizada para PDF, visualização em tempo real e controle completo dos elementos técnicos. Desenvolvido para Conecta Soluções.

## Instalação e Execução

1. Instale o [Node.js](https://nodejs.org/)
2. Clone este repositório
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm start
   ```
5. Acesse a aplicação em: http://localhost:3000

## Configuração do Supabase

- As credenciais do Supabase devem ser definidas no `<head>` do `index.html`:
  ```html
  <script>
    window.supabaseUrl = 'SUA_URL_SUPABASE';
    window.supabaseKey = 'SUA_CHAVE_ANONIMA';
  </script>
  ```
- O bucket público `imagens` deve existir no Supabase para upload de fotos de puxadores.
- O campo `foto` da tabela `puxadores` armazena a URL pública da imagem.

## Funcionalidades Principais

- Desenho SVG dinâmico e responsivo de portas técnicas
- Suporte a múltiplos tipos de perfis (RM-059, RM-060, RM-119, RM-377, RM-114)
- Gradientes otimizados para vidros e exportação PDF
- Dobradiças automáticas conforme altura, com opção "S/Dobradiças"
- Puxadores inteligentes (vertical/horizontal), com opção "S/Puxador"
- Campo "Quantidade" e opção "Porta em Par" (checkbox para portas duplas lado a lado, habilitado apenas para quantidades pares)
- Cotas técnicas automáticas
- Exportação otimizada para PDF
- Sidebar interativa para configuração
- Diagnóstico automático de erros e sistema de notificações
- Testes automatizados via Jest

## Exemplo de Uso das Funções Globais

No console do navegador, para depuração:
```js
// Reinicializa toda a aplicação
inicializarAplicacao();

// Diagnostica o sistema de impressão e exportação
console.log(diagnosticarImpressao());
```

## Fallback de Imagem SVG

Se uma imagem de puxador não carregar, o sistema exibe automaticamente um SVG de fallback:
```html
<img src="URL_DA_IMAGEM" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'><rect width=\'120\' height=\'120\' fill=\'%23f5f5f5\'/><text x=\'50%25\' y=\'50%25\' font-size=\'14\' text-anchor=\'middle\' alignment-baseline=\'middle\' font-family=\'Arial\' fill=\'%23999999\'>Imagem não disponível</text></svg>'">
```

## Estrutura do Projeto

```
PORTAS PERFIS/
├── js/
│   ├── drawing/           # Módulo de desenho SVG
│   │   ├── core.js        # Funções SVG base
│   │   ├── elements.js    # Componentes gráficos
│   │   ├── door-types.js  # Tipos de portas
│   │   ├── annotations.js # Sistema de cotas
│   │   ├── config.js      # Configurações globais
│   │   ├── utils.js       # Funções utilitárias
│   │   └── index.js       # Agrupamento dos módulos
│   ├── main.js            # Entrada principal
│   ├── initialize.js      # Inicialização
│   ├── storage.js         # Persistência
│   ├── sidebar.js         # Sidebar e controles de UI
│   ├── ui-controls.js     # Controles da interface
│   ├── form-handlers.js   # Manipulação de formulários
│   ├── printing.js        # Impressão e PDF
│   ├── diagnostico.js     # Diagnóstico e correção
│   ├── novo-projeto.js    # Criação de projetos
│   └── notifications.js   # Notificações
├── css/                   # Estilos customizados
├── img/                   # Recursos
├── index.html             # Interface principal
├── tests/                 # Scripts de teste
├── DOC/                   # Documentação
└── package.json           # Dependências do projeto
```

## Desenvolvimento

### Requisitos
- Node.js 14+
- Navegador moderno com suporte a ES6
- Conexão com a internet para CDNs (Bootstrap, Icons, Fonts)

### Scripts Disponíveis
```bash
npm start     # Inicia servidor de desenvolvimento
npm test      # Executa testes automatizados (Jest)
npm run build # Build de produção
```

## Tecnologias e Dependências

- HTML5/CSS3/JavaScript ES6+
- SVG para desenho vetorial
- Bootstrap 5 (CDN)
- Bootstrap Icons (CDN)
- Inter Font (Google Fonts)
- HTML2PDF.js (v0.10.1)
- Node.js
- ESLint/Jest


## Licença

Copyright © Conecta Soluções. Todos os direitos reservados.