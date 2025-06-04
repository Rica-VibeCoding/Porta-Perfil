# Testes Automatizados - Projeto Portas Perfis

Este diretório contém os testes automatizados para o projeto Portas Perfis, utilizando o framework Jest.

## Estrutura de Diretórios

```
tests/
├── mocks/           # Mocks para dependências externas
│   └── styleMock.js # Mock para arquivos CSS
├── setup.js         # Configuração global para os testes
├── unit/            # Testes unitários
│   ├── initialize.test.js  # Testes para as funções de inicialização
│   ├── storage.test.js     # Testes para as funções de armazenamento
│   ├── drawing.test.js     # Testes para as funções de desenho
│   └── ui-controls.test.js # Testes para as funções de controles de UI
└── README.md        # Este arquivo
```

## Execução dos Testes

Para executar todos os testes:

```bash
npm test
```

Para executar os testes em modo watch (atualização automática):

```bash
npm run test:watch
```

Para gerar um relatório de cobertura de código:

```bash
npm run test:coverage
```

## Mocks e Configurações

Os testes utilizam mocks para simular as APIs do navegador, incluindo:

- `document` e elementos do DOM
- `localStorage` para armazenamento
- `canvas` e `SVG` para funções de desenho
- Eventos e manipuladores de eventos

A configuração global está no arquivo `setup.js`, que é carregado automaticamente pelo Jest antes da execução dos testes.

## Módulos Testados

### initialize.js

Testes para as funções de inicialização do sistema, incluindo:
- `inicializar()`
- `verificarCompatibilidade()`
- `obterConfiguracaoAtual()`
- `atualizarConfiguracao()`

### storage.js

Testes para as funções de armazenamento e configurações:
- `inicializarArmazenamento()`
- `obterTodasConfiguracoes()`
- `salvarConfiguracao()`
- `carregarUltimaConfiguracao()`

### drawing.js

Testes para as funções de desenho:
- `inicializarCanvas()`
- `criarElementoSVG()`
- `capturarImagemCanvas()`
- `desenharPorta()`

### ui-controls.js

Testes para as funções de interface do usuário:
- `toggleFuncaoPorta()`
- `inicializarControles()`
- `inicializarModais()`
- `inicializarSeletorLogo()`

## Problemas Conhecidos

Os testes ainda apresentam alguns problemas devido à complexa interação com o DOM e as APIs do navegador. Em um ambiente de desenvolvimento real, seria necessário:

1. Refatorar o código para usar injeção de dependências, facilitando o teste
2. Usar bibliotecas como `jest-dom` para testes de DOM mais precisos
3. Criar mocks mais elaborados para as APIs específicas do navegador

## Próximos Passos

- Corrigir os testes existentes
- Aumentar a cobertura de testes
- Implementar testes de integração
- Configurar CI/CD para execução automática dos testes 