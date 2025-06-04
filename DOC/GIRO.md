# Documentação Técnica: Portas de Giro

## Visão Geral

As portas de giro (também chamadas de portas de abrir) são identificadas pelos seguintes tipos:
- `superiorDireita`: Abrir Superior Direita
- `superiorEsquerda`: Abrir Superior Esquerda
- `inferiorDireita`: Abrir Inferior Direita
- `inferiorEsquerda`: Abrir Inferior Esquerda

Esta documentação serve como referência para a implementação destas portas no sistema, incluindo as configurações padrão e comportamentos específicos.

## Configurações Padrão

Quando qualquer tipo de porta de giro é selecionado, o sistema automaticamente configura:

| Parâmetro        | Valor                | Observações                            |
|------------------|----------------------|----------------------------------------|
| Largura          | 500mm                | Largura fixa para todas portas de giro |
| Altura           | 2450mm               | Altura fixa para todas portas de giro  |
| Número dobradiças| 4                    | Quantidade padrão de dobradiças        |
| Cota inferior    | 1000mm (puxador)     | Posição fixa do puxador               |

## Posicionamento das Dobradiças

As dobradiças são posicionadas uniformemente com a seguinte lógica:
- Primeira dobradiça: 100mm do topo
- Última dobradiça: 100mm da base
- Dobradiças intermediárias: distribuídas uniformemente entre a primeira e a última

Para uma porta com altura de 2450mm e 4 dobradiças, as posições aproximadas são:
- Dobradiça 1: 100mm (do topo)
- Dobradiça 2: 750mm
- Dobradiça 3: 1400mm
- Dobradiça 4: 2350mm (100mm da base)

## Puxador

Para portas de giro, o puxador é configurado automaticamente:
- Posição vertical (por padrão)
- Cota inferior fixa de 1000mm
- Cota superior calculada com base na altura da porta e medida do puxador

Cálculo da cota superior: `cotaSuperior = altura - (alturaPuxador + cotaInferior)`

### Puxador Horizontal em Portas de Giro

Quando a opção de puxador horizontal é selecionada para portas de giro, o posicionamento segue estas regras:

1. **Posição Vertical (Y)**:
   - **Portas superiores** (superiorDireita/superiorEsquerda): O puxador é posicionado na parte inferior da porta.
   - **Portas inferiores** (inferiorDireita/inferiorEsquerda): O puxador é posicionado rente à borda superior da porta.
     - Implementação: `const deslocamentoSuperior = 0; posY = y + (deslocamentoSuperior * CONFIG.escala);`

2. **Posição Horizontal (X)**:
   - Para portas com dobradiças à direita: O puxador começa na extremidade esquerda da porta.
   - Para portas com dobradiças à esquerda: O puxador termina na extremidade direita da porta.

3. **Diferenças em relação ao puxador em portas basculantes**:
   - Nas portas basculantes, o puxador é centralizado horizontalmente.
   - Nas portas de giro, o puxador é alinhado ao lado oposto das dobradiças.

Este comportamento é implementado na função `desenharPuxadorSVG()` em `js/drawing/elements.js`, onde o deslocamento superior para portas inferiores é definido como zero para posicionar o puxador rente à borda superior.

## Implementação no Código

A lógica de configuração está implementada na função `inicializarControlesFuncao()` em `js/ui-controls.js`:

```javascript
// Se for um dos tipos de porta de abrir (superior/inferior direita/esquerda)
else if (novaFuncao.includes('superior') || novaFuncao.includes('inferior')) {
  // Atualizar os inputs no formulário
  const larguraInput = document.getElementById('larguraInput');
  const alturaInput = document.getElementById('alturaInput');
  const numDobradicasInput = document.getElementById('numDobradicasInput');
  
  if (larguraInput) larguraInput.value = 500;
  if (alturaInput) alturaInput.value = 2450;
  if (numDobradicasInput) numDobradicasInput.value = '4';
  
  // Calcular posições uniformes para as 4 dobradiças
  const altura = 2450;
  const distanciaExtremidade = 100; // Distância fixa das extremidades (topo e base)
  const espacoDisponivel = altura - (2 * distanciaExtremidade);
  const numDivisoes = 4 - 1; // 3 divisões para 4 dobradiças
  const tamanhoDivisao = espacoDisponivel / numDivisoes;
  
  // Array para armazenar as posições uniformes
  const posicoesUniformes = [
    distanciaExtremidade, // Primeira dobradiça a 100mm do topo
    Math.round(distanciaExtremidade + tamanhoDivisao), // Segunda dobradiça
    Math.round(distanciaExtremidade + 2 * tamanhoDivisao), // Terceira dobradiça
    altura - distanciaExtremidade // Última dobradiça a 100mm da base
  ];
  
  // Configurar o puxador com cota inferior fixa em 1000mm
  const configAtual = obterConfiguracaoAtual();
  const puxadorConfig = configAtual.puxador || {};
  const medidaPuxador = puxadorConfig.medida || '150';
  const alturaPuxador = parseInt(medidaPuxador, 10);
  const cotaInferior = 1000;
  const cotaSuperior = Math.max(0, altura - (alturaPuxador + cotaInferior));
  
  // Atualizar configuração completa
  atualizarConfiguracao({ 
    funcao: novaFuncao,
    largura: 500,
    altura: 2450,
    numDobradicas: 4,
    dobradicas: posicoesUniformes,
    puxador: {
      ...puxadorConfig,
      cotaSuperior: cotaSuperior,
      cotaInferior: cotaInferior
    }
  });
}
```

## Diferenças Entre os Tipos de Porta de Giro

As principais diferenças entre os quatro tipos de porta de giro estão no posicionamento das dobradiças e do puxador:

1. **superiorDireita**: 
   - Dobradiças: Lado direito, na parte superior
   - Puxador: Lado esquerdo, vertical

2. **superiorEsquerda**: 
   - Dobradiças: Lado esquerdo, na parte superior
   - Puxador: Lado direito, vertical

3. **inferiorDireita**: 
   - Dobradiças: Lado direito, na parte inferior
   - Puxador: Lado esquerdo, vertical

4. **inferiorEsquerda**: 
   - Dobradiças: Lado esquerdo, na parte inferior
   - Puxador: Lado direito, vertical

O posicionamento visual das cotas também varia dependendo do tipo:
- Para portas inferiores: cotas de largura na parte superior
- Para portas superiores: cotas de largura na parte inferior

## Restauração em Caso de Problemas

Se for necessário restaurar a funcionalidade das portas de giro:

1. Verificar a função `inicializarControlesFuncao()` em `js/ui-controls.js`
2. Garantir que os valores padrão estejam corretos:
   - Largura: 500mm
   - Altura: 2450mm
   - Número de dobradiças: 4
   - Distância das dobradiças das extremidades: 100mm
   - Cota inferior do puxador: 1000mm

3. Para o cálculo das posições das dobradiças, use a fórmula:
   ```javascript
   const distanciaExtremidade = 100;
   const espacoDisponivel = altura - (2 * distanciaExtremidade);
   const numDivisoes = numDobradicas - 1;
   const tamanhoDivisao = espacoDisponivel / numDivisoes;
   ```

4. As posições são calculadas com:
   ```javascript
   const posicoesUniformes = [
     distanciaExtremidade,
     Math.round(distanciaExtremidade + tamanhoDivisao),
     Math.round(distanciaExtremidade + 2 * tamanhoDivisao),
     altura - distanciaExtremidade
   ];
   ```
