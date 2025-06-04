# Documentação de Portas Basculantes

## Visão Geral
As portas basculantes são um tipo especial de porta que abre por meio de um movimento de rotação vertical, geralmente tendo as dobradiças no topo da porta. Este documento descreve a implementação e o funcionamento das portas basculantes no sistema SVG.

## Características Principais

### Dobradiças
- Posicionadas horizontalmente no topo da porta
- Número variável baseado na largura da porta (ver regras abaixo)
- Distribuição automática com 100mm de distância das extremidades
- As posições são armazenadas em `config.dobradicasBasculante`
- **Novo**: O usuário pode modificar manualmente o número de dobradiças, sobrescrevendo o valor calculado automaticamente

### Regras de Número de Dobradiças
O número de dobradiças em uma porta basculante é determinado automaticamente com base na largura:

| Largura da Porta    | Número de Dobradiças |
|---------------------|----------------------|
| 200mm a 900mm       | 2 dobradiças         |
| 901mm a 1500mm      | 3 dobradiças         |
| 1501mm a 2600mm     | 4 dobradiças         |
| 2601mm a 3000mm     | 5 dobradiças         |
| Outros valores      | 2 dobradiças (padrão)|

Esta regra segue o mesmo padrão das portas de giro (que usam a altura), mas aplicada à largura da porta basculante.

### Puxadores
- Posicionados na parte inferior da porta
- Podem ser de tamanho configurável ou ocupar toda a largura da porta
- Opções de configuração:
  - **Porta Inteira**: Ocupa toda a largura da porta
  - **Medida personalizada**: Tamanho específico em mm (padrão: 150mm)

## Implementação Técnica

### Determinação do Número de Dobradiças
O sistema determina o número de dobradiças com base na largura da porta:

```javascript
// Em ui-controls.js - Função para determinar o número de dobradiças
function definirNumeroDobradicasBasculante(largura) {
  console.log('Definindo número de dobradiças para porta basculante com base na largura:', largura);
  
  let numDobradicasNovo;
  
  if (largura >= 200 && largura <= 900) {
    numDobradicasNovo = 2;
  } else if (largura > 900 && largura <= 1500) {
    numDobradicasNovo = 3;
  } else if (largura > 1500 && largura <= 2600) {
    numDobradicasNovo = 4;
  } else if (largura > 2600 && largura <= 3000) {
    numDobradicasNovo = 5;
  } else {
    // Para larguras fora dos intervalos definidos, usar 2 dobradiças como padrão
    numDobradicasNovo = 2;
  }
  
  return numDobradicasNovo;
}
```

### Tratamento Especial para Portas Basculantes
Quando uma porta é configurada como basculante, o sistema verifica a largura e ajusta o número de dobradiças:

```javascript
// Em definirNumeroDobradicas() - Tratamento especial para porta basculante
if (configAtual && configAtual.funcao === 'basculante') {
  console.log('Porta basculante: definindo dobradiças com base na largura');
  
  // Usar a largura da porta para determinar o número de dobradiças
  const largura = configAtual.largura || 800;
  const numDobradicasNovo = definirNumeroDobradicasBasculante(largura);
  
  // Atualizar o input no formulário e configuração
  atualizarConfiguracao({ numDobradicas: numDobradicasNovo });
  window.atualizarCamposPosicoesDobradicasQtd(numDobradicasNovo);
  return;
}
```

### Desenho de Dobradiças
```javascript
// Para porta basculante, as dobradiças ficam no topo (horizontalmente)
if (ehBasculante) {
  const larguraPorta = config.largura * CONFIG.escala;
  const distanciaExtremidade = 100;
  
  // Posição Y fixada no topo da porta
  const posYDobradicaBasculante = posY + (CONFIG.espessuraPerfil * CONFIG.escala / 2);
  
  // Distribuir dobradiças horizontalmente
  for (let i = 0; i < numDobradicas; i++) {
    const posicaoMm = i === 0 ? distanciaExtremidade : 
        i === numDobradicas - 1 ? larguraMm - distanciaExtremidade :
        Math.round(distanciaExtremidade + (i * ((larguraMm - 2 * distanciaExtremidade) / (numDobradicas - 1))));
    
    const xPos = posX + (posicaoMm * CONFIG.escala);
    desenharDobradicaSVG(xPos, posYDobradicaBasculante);
    // ...
  }
}
```

### Desenho de Puxadores
O puxador da porta basculante é sempre desenhado na parte inferior horizontal:

```javascript
// Para portas basculantes, o puxador vai na parte inferior e na horizontal
if (ehBasculante) {
  // Se for porta inteira para puxador basculante, ocupar toda a largura da porta
  if (ehPortaInteira) {
    // Posição Y na parte inferior da porta
    const posYInferior = y + altura - (CONFIG.espessuraPerfil * CONFIG.escala / 2) - (espessuraPuxador * CONFIG.escala);
    
    // Desenhar puxador horizontal ocupando toda a largura
    // ...
  } else {
    // Para puxador normal basculante (não porta inteira)
    let medida = parseInt(config.puxador.medida || '150', 10);
    
    // Posição horizontal centralizada
    const posXCentralizado = x + (larguraPorta / 2) - (medida / 2 * CONFIG.escala);
    
    // Posição Y na parte inferior da porta
    const posYInferior = y + altura - (CONFIG.espessuraPerfil * CONFIG.escala / 2) - (espessuraPuxador * CONFIG.escala);
    
    // ...
  }
}
```

## Cotas e Dimensões

### Cotas de Dobradiças
- As cotas horizontais das dobradiças são mostradas acima da porta
- São exibidas três tipos de cotas:
  1. Da extremidade esquerda até a primeira dobradiça
  2. Entre dobradiças consecutivas
  3. Da última dobradiça até a extremidade direita

### Cotas de Puxadores
- Para puxadores de tamanho personalizado:
  - Cota do comprimento do puxador
  - Cotas das distâncias às extremidades laterais da porta

## Eventos e Interação do Usuário
- Ao alterar a largura de uma porta basculante, o sistema:
  1. Verifica se é uma porta do tipo basculante
  2. Calcula o número apropriado de dobradiças baseado na nova largura
  3. Atualiza o formulário e a configuração SOMENTE se o usuário não alterou manualmente o valor
  4. Redesenha a porta com o número correto de dobradiças

```javascript
// Listener do campo de largura no index.html
larguraInput.addEventListener('change', function() {
  const novaLargura = parseInt(this.value, 10);
  if (!isNaN(novaLargura) && novaLargura >= 200 && novaLargura <= 3000) {
    // Verificar se é uma porta basculante
    const configAtual = window.obterConfiguracaoAtual();
    if (configAtual && configAtual.funcao === 'basculante') {
      // Verificar se o usuário alterou manualmente o número de dobradiças
      const numDobradicasInput = document.getElementById('numDobradicasInput');
      const valorAtual = parseInt(numDobradicasInput.value, 10);
      const valorAnterior = window.definirNumeroDobradicasBasculante(configAtual.largura);
      
      // Só atualiza automaticamente se o valor não foi alterado manualmente
      if (isNaN(valorAtual) || valorAtual === valorAnterior) {
        const numDobradicasNovo = window.definirNumeroDobradicasBasculante(novaLargura);
        numDobradicasInput.value = numDobradicasNovo.toString();
        window.atualizarConfiguracao({ numDobradicas: numDobradicasNovo });
        window.atualizarCamposPosicoesDobradicasQtd(numDobradicasNovo);
      }
    }
  }
});
```

## Modificação Manual do Número de Dobradiças

### Nova Funcionalidade
A partir da atualização mais recente, o usuário pode modificar manualmente o número de dobradiças em portas basculantes:

1. **Edição Manual**: O usuário pode selecionar manualmente o número de dobradiças no dropdown, mesmo quando o tipo de porta é basculante.

2. **Persistência da Escolha**: Uma vez que o usuário modificou manualmente o número de dobradiças, o sistema irá:
   - Respeitar essa escolha, mesmo quando a largura da porta é alterada
   - Não substituir o valor escolhido ao alternar para outro tipo de porta e voltar para basculante
   - Manter o valor escolhido durante o redesenho da porta

3. **Retorno ao Automático**: O sistema volta a calcular automaticamente o número de dobradiças apenas se:
   - O usuário selecionar um valor que corresponde ao calculado automaticamente
   - O campo for deixado vazio ou com valor inválido

### Implementação Técnica
A implementação envolve:

1. Removendo quaisquer atributos `disabled` ou `readonly` do campo de dobradiças:
```javascript
numDobradicasInput.removeAttribute('disabled');
numDobradicasInput.removeAttribute('readonly');
```

2. Detectando modificações manuais comparando o valor atual com o esperado:
```javascript
const valorAtual = parseInt(numDobradicasInput.value, 10);
const valorCalculado = definirNumeroDobradicasBasculante(largura);
if (valorAtual !== valorCalculado) {
  // O usuário modificou manualmente - manter o valor
}
```

3. Respeitando a escolha do usuário ao atualizar a configuração:
```javascript
// Apenas atualizamos automaticamente se o valor não foi modificado pelo usuário
if (!numDobradicasInput || isNaN(valorAtual) || valorAtual === valorCalculado) {
  numDobradicasInput.value = valorCalculado.toString();
  atualizarConfiguracao({ numDobradicas: valorCalculado });
}
```

## Considerações de Uso
1. **Número de Dobradiças**: Para portas basculantes, o sistema calcula automaticamente o número de dobradiças com base na largura, mas o usuário pode modificar manualmente se necessário
2. **Posição do Puxador**: Para melhor ergonomia, o puxador deve estar posicionado na parte inferior
3. **Distribuição das Dobradiças**: Para maior resistência, as dobradiças devem estar bem distribuídas horizontalmente

## Renderização do Vidro
- O vidro é renderizado com gradientes para simular reflexos
- Os mesmos efeitos visuais das portas convencionais são aplicados
- O tipo de vidro (Incolor, Fumê, etc.) pode ser configurado normalmente

## Diferenças com Portas de Giro
- **Orientação**: Porta basculante gira ao redor de um eixo horizontal, não vertical
- **Dobradiças**: Posicionamento horizontal vs. vertical em portas de giro
- **Puxador**: Sempre na parte inferior vs. lateral em portas de giro
- **Determinação de Dobradiças**: 
  - **Portas de giro**: Número baseado na ALTURA da porta
  - **Portas basculantes**: Número baseado na LARGURA da porta, com possibilidade de ajuste manual

## Aspectos Programáticos
1. **Detecção de Tipo**: `config.funcao === 'basculante'` é usado para identificar portas basculantes
2. **Armazenamento de Posições**: Usa `config.dobradicasBasculante` em vez de `config.dobradicas`
3. **Interface**: A interface se adapta para mostrar cotas horizontais adequadas para dobradiças no topo
4. **Validação de Configuração**: O sistema valida o número de dobradiças com base na largura atual, mas respeita escolhas manuais
