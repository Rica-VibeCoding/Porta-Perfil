# Documentação: Portas Deslizantes

## Visão Geral

Este documento descreve a implementação e o comportamento das portas deslizantes no sistema de desenho técnico. As portas deslizantes representam um tipo específico de porta com características próprias de design, hardware e renderização visual.

## Interface do Usuário

Quando o usuário seleciona "Deslizante" no seletor de "Tipo de Porta", diversas alterações ocorrem na interface:

### Campos Exclusivos para Portas Deslizantes

1. **Seção de Sistema Deslizante**:
   - **Modelo do Sistema Deslizante**: Opções disponíveis:
     - RO-654025
     - RO-654030
     - KIT-4545
     - KIT-6060
   - **Tipo de Trilho**: Opções disponíveis:
     - Embutir
     - Sobrepor

2. **Configuração do Puxador**:
   - Exibe o campo "Lados" com opções:
     - Esquerdo
     - Direito
     - 2 Lados
   - Oculta o campo "Posição" (vertical/horizontal)
   - Oculta as cotas verticais do puxador

### Campos Ocultados

1. **Seção de Dobradiças**: Completamente ocultada, pois portas deslizantes não utilizam dobradiças

## Comportamento Técnico

### Posicionamento e Renderização

1. **Posição Vertical Diferenciada**:
   ```javascript
   // Posição vertical da porta deslizante
   const posY = (CONFIG.altura - alturaPorta) / 3;
   ```
   (comparado com `(CONFIG.altura - alturaPorta) / 4` para portas de abrir)

2. **Renderização Específica**:
   - Utiliza a função `desenharPortaDeslizante()` em vez de `desenharPortaAbrir()`
   - Aplica renderização específica para os componentes da porta

### Configuração do Puxador

A configuração do puxador para portas deslizantes agora respeita completamente a seleção do usuário para o lado do puxador:

```javascript
// Verificar se o puxador deve ser desenhado em ambos os lados
const ladoPuxador = config.puxador?.lados || 'direito';

if (ladoPuxador === 'ambos') {
  // Configuração para puxador do lado direito
  const configPuxadorDireito = {
    ...config,
    puxador: {
      ...config.puxador,
      posicao: 'vertical',
      lado: 'direito'
    }
  };
  
  // Configuração para puxador do lado esquerdo
  const configPuxadorEsquerdo = {
    ...config,
    puxador: {
      ...config.puxador,
      posicao: 'vertical',
      lado: 'esquerdo'
    }
  };
  
  // Desenhar puxador no lado direito (ladoDireito = true)
  desenharPuxadorSVG(posX, posY, alturaPorta, true, larguraPorta, configPuxadorDireito);
  
  // Desenhar puxador no lado esquerdo (ladoDireito = false)
  desenharPuxadorSVG(posX, posY, alturaPorta, false, larguraPorta, configPuxadorEsquerdo);
} 
else {
  // Desenhar puxador respeitando a configuração do usuário para um único lado
  const configuracaoPuxador = {
    ...config,
    puxador: {
      ...config.puxador,
      posicao: 'vertical',
      lado: ladoPuxador
    }
  };
  
  // O parâmetro ladoDireito agora é dinâmico baseado na configuração
  desenharPuxadorSVG(posX, posY, alturaPorta, ladoPuxador !== 'esquerdo', larguraPorta, configuracaoPuxador);
}
```

#### Comportamento dos Puxadores por Opção:

- **Direito**: Puxador renderizado apenas no lado direito da porta
- **Esquerdo**: Puxador renderizado apenas no lado esquerdo da porta
- **2 Lados**: Puxadores renderizados em ambos os lados da porta simultaneamente

### Posicionamento das Cotas

O posicionamento das cotas para portas deslizantes é determinado pelo lado do puxador:

```javascript
// Cota vertical (altura) - posicionada do lado oposto ao puxador
let posXCotaAltura;

if (ehDeslizante) {
  // Para portas deslizantes, posicionar com base no valor de lados
  const ladoPuxador = config.puxador?.lados || 'direito';
  
  if (ladoPuxador === 'esquerdo') {
    // Se o puxador está à esquerda, colocar cota à direita
    posXCotaAltura = posX + larguraPorta + distanciaCota;
  }
  else if (ladoPuxador === 'direito') {
    // Se o puxador está à direita, colocar cota à esquerda
    posXCotaAltura = posX - distanciaCota;
  }
  else if (ladoPuxador === 'ambos') {
    // Se o puxador está em ambos os lados, colocar cota à esquerda (padrão)
    posXCotaAltura = posX - distanciaCota;
  }
}
```

A distância padrão das cotas é de 50 pixels:
```javascript
const distanciaCota = 50;
```

## Estrutura Visual

A renderização da porta deslizante inclui os seguintes elementos:

1. **Moldura Externa**: Retângulo com preenchimento da cor do perfil selecionado
2. **Contorno Interno**: Linha que delimita a área interna do perfil
3. **Área de Vidro**: Preenchida com o tipo de vidro selecionado e efeitos de reflexo
4. **Puxador(es)**:
   - Sempre vertical
   - Um puxador na lateral (direita ou esquerda) quando configurado com um lado
   - Dois puxadores (um em cada lateral) quando configurado com "2 Lados"
5. **Cotas**: Adaptadas para o tipo deslizante, com posicionamento específico:
   - Cota de altura localizada a 50px da borda da porta, do lado oposto ao puxador (ou à esquerda para puxadores em ambos os lados)
   - Cota de largura localizada a 50px acima ou abaixo da porta, dependendo da configuração

## Código Chave

### Detecção de Porta Deslizante
```javascript
// Verificar se é uma porta deslizante
const ehDeslizante = funcao === 'deslizante';
```

### Alternância da Interface
```javascript
function toggleFuncaoPorta(funcao) {
  const ehDeslizante = funcao === 'deslizante';
  
  const sectionDeslizante = document.getElementById('sectionDeslizante');
  const sectionDobradicas = document.getElementById('sectionDobradicas');
  
  if (sectionDeslizante) {
    sectionDeslizante.style.display = ehDeslizante ? 'block' : 'none';
  }
  
  if (sectionDobradicas) {
    sectionDobradicas.style.display = ehDeslizante ? 'none' : 'block';
  }
  
  // Configuração de campos de puxador
  if (puxadorPosicaoDiv && puxadorLadosDiv) {
    if (ehDeslizante) {
      puxadorPosicaoDiv.style.display = 'none';
      puxadorLadosDiv.style.display = 'block';
    }
    else {
      puxadorPosicaoDiv.style.display = 'block';
      puxadorLadosDiv.style.display = 'none';
    }
  }
}
```

### Renderização Específica
```javascript
export function desenharPorta(config) {
  // Verificar se é uma porta deslizante
  const ehDeslizante = config.funcao === 'deslizante';
  
  // Desenhar de acordo com o tipo de porta
  if (ehDeslizante) {
    return desenharPortaDeslizante(config);
  }
  else {
    return desenharPortaAbrir(config);
  }
}
```

## Persistência e Carregamento

Ao carregar uma configuração salva com porta deslizante, o sistema garante que a interface seja atualizada adequadamente:

```javascript
// Se for porta deslizante, garantir que os campos corretos estejam visíveis
if (dadosConfig.funcao === 'deslizante') {
  const sectionDobradicas = document.getElementById('sectionDobradicas');
  const sectionDeslizante = document.getElementById('sectionDeslizante');
  
  if (sectionDobradicas) sectionDobradicas.style.display = 'none';
  if (sectionDeslizante) sectionDeslizante.style.display = 'block';
}
```

## Considerações para Desenvolvimento

1. **Alterações no Sistema Deslizante**: Ao adicionar novos modelos ou tipos de trilhos, atualize tanto a interface no `index.html` quanto a lógica de renderização na função `desenharPortaDeslizante()`.

2. **Configurações de Puxador**: A implementação atual suporta três opções de lado do puxador:
   - Esquerdo: Puxador apenas no lado esquerdo
   - Direito: Puxador apenas no lado direito
   - 2 Lados: Puxadores em ambos os lados
   
   Qualquer modificação deve preservar esta lógica e o comportamento visual esperado.

3. **Posicionamento Visual**: Ao otimizar o posicionamento vertical da porta, respeite a fórmula de cálculo específica para as portas deslizantes.

4. **Cotas com Puxadores em Ambos os Lados**: Por padrão, quando a opção "2 Lados" está selecionada, a cota de altura é posicionada no lado esquerdo da porta.

## Atualização: Isolamento do Comportamento da Porta Deslizante

Foi implementada uma melhoria para garantir que as portas deslizantes tenham comportamento consistente, independente do tipo de porta selecionado anteriormente (basculante ou porta de abrir). As principais alterações incluem:

1. **Tratamento específico para seleção de porta deslizante**:
   ```javascript
   else if (novaFuncao === 'deslizante') {
     // Dimensões padrão otimizadas para portas deslizantes
     if (larguraInput) larguraInput.value = 900;
     if (alturaInput) alturaInput.value = 2100;
     
     // Definir valores padrão específicos para deslizante
     atualizarConfiguracao({ 
       funcao: novaFuncao,
       largura: 900,
       altura: 2100,
       modeloDeslizante: 'RO-654025',
       trilhoDeslizante: 'Embutir',
       puxador: {
         ...puxadorConfig,
         posicao: 'vertical',
         lados: 'direito',
         modelo: puxadorConfig.modelo || 'Cielo',
         medida: puxadorConfig.medida || '150'
       }
     });
     
     // Atualizar controles da interface
     if (modeloDeslizanteSelect) modeloDeslizanteSelect.value = 'RO-654025';
     if (trilhoDeslizanteSelect) trilhoDeslizanteSelect.value = 'Embutir';
     if (puxadorLadosSelect) puxadorLadosSelect.value = 'direito';
   }
   ```

2. **Benefícios da implementação**:
   - Garante que a porta deslizante tenha sempre dimensões adequadas (900x2100mm)
   - Preserva valores importantes para renderização correta (modelo, trilho, puxador)
   - Mantém a consistência da interface do usuário
   - Preserva todas as legendas, cotas e o desenho do puxador
   - Não interfere no comportamento de outros tipos de porta

## Atualização: Suporte a Puxador em Ambos os Lados

Foi implementado o suporte completo para a opção "2 Lados" para puxadores em portas deslizantes:

1. **Alterações no Código**:
   - Quando `config.puxador.lados === 'ambos'`, o sistema agora renderiza dois puxadores, um em cada lado da porta
   - Cada puxador mantém sua própria configuração (vertical, mesmo modelo e mesma medida)
   - As cotas são posicionadas adequadamente para evitar sobreposição com os puxadores

2. **Benefícios Técnicos**:
   - Representação mais precisa de portas deslizantes com puxadores em ambos os lados
   - Compatibilidade com as configurações de projeto existentes
   - Design consistente com as convenções de desenho técnico

3. **Localização no Código**:
   - A implementação principal está em `js/drawing/door-types.js` na função `desenharPortaDeslizante()`
   - A lógica de posicionamento das cotas está em `js/drawing/annotations.js` na função `desenharCotasSVG()`
