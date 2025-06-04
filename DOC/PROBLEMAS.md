# Problemas Conhecidos e Soluções

## Travamento ao Alterar Altura da Porta

### Problema
Quando o usuário altera a medida da altura da porta, ocorre um travamento ocasional no front-end que impede a interação com a aplicação. Este travamento é causado principalmente por:

1. **Loops infinitos no cálculo das posições de dobradiças** - A função `calcularPosicaoDefaultDobradica` pode entrar em um loop de chamadas recursivas.
2. **Múltiplos redesenhos em cascata** - Várias funções chamam `desenharPorta()` ou `atualizarDesenho()` simultaneamente, sobrecarregando o navegador.
3. **Ciclos de dependência** - Funções chamando-se mutuamente em um ciclo sem controle.

### Solução Implementada

Foram implementadas três camadas de proteção, em ordem de invasividade:

#### 1. Proteção contra Loops Infinitos no Cálculo de Posições
```javascript
// Substitui a função original com proteção contra loops
window.calcularPosicaoDefaultDobradica = function(total, alturaPorta) {
  // Validação de parâmetros
  total = parseInt(total, 10);
  alturaPorta = parseInt(alturaPorta, 10);
  
  // Contador de chamadas para detectar loops
  if (window._contadorChamadas === undefined) window._contadorChamadas = 0;
  window._contadorChamadas++;
  
  // Se atingir um limite, retorna valores seguros
  if (window._contadorChamadas > 10) {
    window._contadorChamadas = 0;
    return [valores seguros baseados na altura];
  }
  
  // Restante da função com try/catch e fallback seguro
}
```

#### 2. Controle de Redesenhos Múltiplos
```javascript
// Substitui a função de desenho com mecanismo de debounce
window.desenharPorta = function(config, forceRedraw) {
  // Bloqueia chamadas múltiplas em um curto período
  if (window._bloqueioDesenho) return;
  window._bloqueioDesenho = true;
  
  // Desenha a porta de forma segura
  try {
    desenharPortaOriginal(config, forceRedraw);
  } catch (error) {
    console.error("Erro ao desenhar porta", error);
  }
  
  // Remove o bloqueio após um tempo
  setTimeout(() => { window._bloqueioDesenho = false; }, 500);
};
```

#### 3. Substituição Completa da Atualização de Altura
```javascript
// Remove todos os event listeners existentes e implementa novos
function atualizarAlturaSimplificado(altura) {
  // Validação de altura
  altura = parseInt(altura, 10);
  if (isNaN(altura) || altura < 200 || altura > 3000) return false;
  
  // Cálculo direto de número de dobradiças e posições
  // sem depender de funções externas
  const numDobradicas = (altura <= 900) ? 2 : 
                        (altura <= 1500) ? 3 : 
                        (altura <= 2600) ? 4 : 5;
  
  // Atualiza interface e configuração
  // com tratamento de erros em cada etapa
  
  // Redesenho com timeout para evitar loops
  setTimeout(() => { window.desenharPorta(novaConfig, true); }, 50);
}
```

### Ativação das Soluções

As soluções são ativadas automaticamente no carregamento da página através do arquivo `diagnostico.js`, que é importado em `index.html`:

```html
<!-- Carrega o script de diagnóstico -->
<script type="module" src="js/diagnostico.js"></script>

<!-- Ativa todas as camadas de proteção -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      // ... código existente ...
      
      // Ativar diagnósticos em sequência
      if (typeof window.diagnosticarProblemaCalculoPosicoes === 'function') {
        window.diagnosticarProblemaCalculoPosicoes();
      }
      
      if (typeof window.diagnosticarProblemaRedesenho === 'function') {
        window.diagnosticarProblemaRedesenho();
      }
      
      if (typeof window.diagnosticarProblemaAlturaCompleto === 'function') {
        window.diagnosticarProblemaAlturaCompleto();
      }
    }, 500);
  });
</script>
```

### Regras para Desenvolvimento Futuro

1. **Evite loops recursivos** - Nunca crie funções que possam chamar a si mesmas indiretamente.
2. **Implemente debounce em redesenhos** - Use técnicas como timeouts e flags de bloqueio.
3. **Valide todos os parâmetros** - Tratar valores inválidos de maneira segura, evitando erros.
4. **Centralize redesenhos** - Evite chamar `desenharPorta()` em múltiplos pontos.
5. **Isole funções críticas** - Mantenha funções com alta intensidade computacional isoladas.

Este conjunto de soluções previne o travamento do front-end e garante uma experiência estável ao usuário, mesmo quando altera a altura da porta.

## Erros em Modo Anônimo ou com localStorage Limpo

### Problema
Ao abrir o aplicativo em modo anônimo ou com localStorage limpo, ocorriam erros críticos no console que impediam o desenho das portas:

1. **ReferenceError: limparSVG is not defined** - A função `limparSVG` era chamada em `desenharPorta` mas não estava importada.
2. **Erro ao importar funções do storage.js: ReferenceError: require is not defined** - Uso de `require()` (Node.js) em ambiente de navegador.
3. **Valores inválidos (NaN) para atributos SVG** - Erros ao tentar criar elementos SVG com valores indefinidos.

### Soluções Implementadas

#### 1. Correção da Importação de limparSVG
```javascript
// Adicionada a importação correta no arquivo door-types.js
import { criarElementoSVG, getSvgContainer, aplicarFundoBranco, inicializarCanvas, limparSVG } from './core.js';
```

#### 2. Substituição de require() por Acesso Direto ao localStorage
```javascript
// Em vez de importar do storage.js usando require()
const padroesFuncao = {
  obterUltimoValorPorta: (tipo) => {
    // Tentar obter do localStorage diretamente
    try {
      const padroesPorta = localStorage.getItem('conecta_portas_padrao');
      if (padroesPorta) {
        const padroes = JSON.parse(padroesPorta);
        if (padroes && padroes[tipo]) return padroes[tipo];
      }
    } catch (e) { /* tratamento de erro */ }
    // Fallback duro para valores padrão
    return fallbackPadroes[tipo] || { altura: 2450, largura: 450 };
  },
  obterPadroesPorta: () => fallbackPadroes
};
```

#### 3. Validação Robusta para Criação de Elementos SVG
```javascript
// Validação para todos os tipos de elementos SVG
export function criarElementoSVG(tagName, attributes = {}) {
  // Validação específica por tipo de elemento
  if (tagName === 'circle') {
    const { cx, cy, r } = attributes;
    if ([cx, cy, r].some(v => v === undefined || isNaN(Number(v)))) {
      console.error('[ERRO] <circle> com atributo inválido:', { cx, cy, r });
      return null; // Não cria o elemento
    }
  }
  // Validações para outros tipos...
  
  try {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    // Verificar cada atributo antes de definir
    for (const [key, value] of Object.entries(attributes)) {
      if (typeof value === 'number' && isNaN(value)) continue; // Pular atributos NaN
      element.setAttribute(key, value);
    }
    return element;
  } catch (error) {
    console.error(`[ERRO] Falha ao criar elemento <${tagName}>:`, error);
    return null;
  }
}
```

### Ativação das Soluções

As soluções foram implementadas diretamente nos arquivos de código-fonte afetados:

- `js/drawing/core.js` - Validação robusta de elementos SVG
- `js/drawing/door-types.js` - Importação correta de `limparSVG` e fallback para `storage.js`
- `js/drawing/elements.js` - Acesso direto ao localStorage para substituir `require()`

### Regras para Desenvolvimento Futuro

1. **Evite `require()` em código de navegador** - Use sempre `import/export` ou módulos ES6.
2. **Importe todas as dependências corretamente** - Sempre verifique se todas as funções utilizadas são importadas.
3. **Implemente fallbacks robustos** - Defina valores padrão no código para quando o localStorage não estiver disponível.
4. **Valide todos os valores antes de usar** - Verifique todos os valores, especialmente aqueles usados para criar elementos SVG.
5. **Trate erros em todos os níveis** - Use try/catch para capturar e lidar com erros inesperados.
6. **Teste em modo anônimo** - Sempre teste o aplicativo em navegador com modo anônimo para garantir que funcione sem localStorage.

Estas correções eliminam os erros críticos que impediam o funcionamento do sistema em navegadores com localStorage limpo ou em modo anônimo, tornando a aplicação muito mais robusta e acessível para todos os usuários.

## Erro ReferenceError: inicializarAplicacao is not defined

### Problema
Ao tentar depurar ou reinicializar a aplicação via console, o erro `ReferenceError: inicializarAplicacao is not defined` pode ocorrer se a função não estiver exportada globalmente.

### Solução
A função `inicializarAplicacao` foi implementada e exportada globalmente em `main.js`. Certifique-se de que o arquivo foi atualizado e que a função está disponível no escopo global.

---

## Variáveis Globais do Supabase

### Problema
Se as variáveis `window.supabaseUrl` e `window.supabaseKey` não estiverem definidas no `<head>` do `index.html`, a inicialização do Supabase falha e recursos como upload de imagens não funcionam.

### Solução
Adicione as variáveis no `<head>`:
```html
<script>
  window.supabaseUrl = 'SUA_URL_SUPABASE';
  window.supabaseKey = 'SUA_CHAVE_ANONIMA';
</script>
```

---

## Robustez para localStorage limpo ou modo anônimo

### Problema
Em modo anônimo ou com localStorage limpo, funções de persistência podem falhar, causando erros de configuração ou travamento do desenho.

### Solução
O sistema implementa fallbacks robustos e validação de dados para garantir funcionamento mesmo sem localStorage. Teste sempre em modo anônimo para garantir robustez.

---

## Fallback SVG para Imagens de Puxadores

### Problema
Se a imagem de um puxador não carregar (URL inválida, bucket ausente, etc.), a interface pode exibir um espaço vazio ou erro visual.

### Solução
O sistema exibe automaticamente um SVG de fallback:
```html
<img src="URL_DA_IMAGEM" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'><rect width=\'120\' height=\'120\' fill=\'%23f5f5f5\'/><text x=\'50%25\' y=\'50%25\' font-size=\'14\' text-anchor=\'middle\' alignment-baseline=\'middle\' font-family=\'Arial\' fill=\'%23999999\'>Imagem não disponível</text></svg>'">
```

---
