
# 📄 `testes.md` – Estratégia de Testes do Projeto *Portas Perfis*

## ✅ Visão Geral

Esta documentação define a estrutura de testes automatizados do projeto *Portas Perfis*. O objetivo é garantir robustez e manutenção confiável do sistema de desenho SVG, interface e armazenamento de dados.

---

## 🧪 Estrutura de Testes

### 1. Testes Unitários

#### Módulos Testados

* `initialize.test.js` – Inicialização do projeto e compatibilidade
* `storage.test.js` – Armazenamento local (localStorage)
* `core.test.js` – Funções SVG fundamentais (`criarElementoSVG`, etc.)
* `elements.test.js` – Dobradiças, puxadores, vidros
* `annotations.test.js` – Cotas e anotações
* `ui-controls.test.js` – Comportamento da interface (botões, modais)
* `printing.test.js` – Exportação e captura de canvas

#### Organização

```
/tests
  ├─ unit/
  │   ├─ initialize.test.js
  │   ├─ storage.test.js
  │   ├─ core.test.js
  │   ├─ elements.test.js
  │   └─ ...
  ├─ mocks/
  └─ helpers/
```

---

### 2. Cobertura Atual

#### ✅ Módulo `initialize.js`
- [x] `inicializar()`
- [x] `verificarCompatibilidade()`

#### ✅ Módulo `storage.js`
- [x] `salvarConfiguracao()`
- [x] `carregarUltimaConfiguracao()`

#### ✅ Módulo `drawing/core.js`
- [x] `criarElementoSVG()`
- [x] `inicializarCanvas()`

#### ✅ Módulo `drawing/elements.js`
- [x] `desenharDobradiças()`
- [x] `desenharPuxador()`

#### ✅ Módulo `annotations.js`
- [x] `desenharCotasPorta()`

#### ✅ Módulo `printing.js`
- [x] `capturarImagemCanvas()`
- [x] `exportarComoPDF()`

#### ✅ Módulo `ui-controls.js`
- [x] `toggleFuncaoPorta()`
- [x] `inicializarControles()`

---

## 🧪 Exemplos de Testes

### Exemplo 1 – Função SVG

```javascript
// core.test.js
test('criarElementoSVG deve criar um SVG com atributos corretos', () => {
  const el = criarElementoSVG('rect', { width: 100, height: 200 });
  expect(el.tagName).toBe('rect');
  expect(el.getAttribute('width')).toBe('100');
});
```

### Exemplo 2 – Armazenamento

```javascript
// storage.test.js
test('deve salvar e carregar configuração', () => {
  const config = { altura: 2100, largura: 700 };
  salvarConfiguracao(config);
  const resultado = carregarUltimaConfiguracao();
  expect(resultado).toEqual(config);
});
```

---

## 🧰 Mocks e Helpers

### Mock de Canvas

```js
export const mockCanvas = {
  getContext: () => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn()
  })
};
```

### Mock de LocalStorage

```js
export const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
```

---

## ⚙️ Configuração

### Scripts no `package.json`

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

### Arquivo `jest.config.js`

```js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/vendor/**'
  ]
};
```

---

## 📌 Boas Práticas

* Manter testes independentes e de fácil leitura
* Usar mocks sempre que houver dependência de DOM ou armazenamento
* Cobrir casos de sucesso e falha
* Atualizar testes ao refatorar código

---

## 📈 Roadmap de Qualidade

### Melhorias Futuras

- [ ] Criar testes E2E com Cypress ou Playwright
- [ ] Automatizar via GitHub Actions (CI)
- [ ] Gerar relatório de cobertura pós-commit
- [ ] Implementar testes visuais para o SVG (snapshot testing)

---

## ✅ Conclusão

Com a estrutura atual, o projeto possui uma base sólida para testes unitários. A expansão para integração e automação garantirá ainda mais robustez no desenvolvimento contínuo.

