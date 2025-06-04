# Relatório de Comportamento de Dobradiças por Tipo de Porta

## 1. Visão Geral

As dobradiças são elementos fundamentais no desenho técnico das portas, apresentando comportamentos específicos baseados no tipo de porta selecionado. Este documento detalha as regras, posicionamento e características das dobradiças para cada tipo de porta suportado pelo sistema.

## 2. Regras Gerais para Determinação do Número de Dobradiças

### 2.1. Portas de Giro (Abrir)
O número de dobradiças é determinado automaticamente com base na **altura** da porta:

| Altura da Porta      | Número de Dobradiças |
|----------------------|----------------------|
| 200mm a 900mm        | 2 dobradiças         |
| 901mm a 1500mm       | 3 dobradiças         |
| 1501mm a 2600mm      | 4 dobradiças         |
| 2601mm a 3000mm      | 5 dobradiças         |
| Outros valores       | 2 dobradiças (padrão)|

### 2.2. Portas Basculantes
O número de dobradiças é determinado automaticamente com base na **largura** da porta:

| Largura da Porta     | Número de Dobradiças |
|----------------------|----------------------|
| 200mm a 900mm        | 2 dobradiças         |
| 901mm a 1500mm       | 3 dobradiças         |
| 1501mm a 2600mm      | 4 dobradiças         |
| 2601mm a 3000mm      | 5 dobradiças         |
| Outros valores       | 2 dobradiças (padrão)|

### 2.3. Portas Deslizantes
As portas deslizantes não utilizam dobradiças, e os controles de dobradiças são completamente ocultados na interface quando este tipo é selecionado.

## 3. Posicionamento das Dobradiças por Tipo de Porta

### 3.1. Portas de Giro (Abrir)

#### 3.1.1. Posição Vertical
As dobradiças são posicionadas **verticalmente** no lado correspondente da porta com as seguintes características:

- **Posicionamento Inicial**: 
  - Primeira dobradiça: 100mm do topo (valor padrão inicial)
  - Última dobradiça: 100mm da base (valor padrão inicial)
  - Dobradiças intermediárias: distribuídas uniformemente entre a primeira e a última

- **Personalização Completa**:
  - O usuário pode ajustar livremente a posição de qualquer dobradiça, incluindo as extremidades
  - Única restrição: mínimo de 50mm das bordas por segurança
  - A interface permite edição direta dos valores através de campos numéricos

#### 3.1.2. Posição Lateral
A posição lateral depende do tipo específico de porta de giro:
- **Portas Direita** (superiorDireita/inferiorDireita): Dobradiças posicionadas no lado direito
- **Portas Esquerda** (superiorEsquerda/inferiorEsquerda): Dobradiças posicionadas no lado esquerdo

### 3.2. Portas Basculantes

#### 3.2.1. Posição Horizontal
As dobradiças são posicionadas **horizontalmente** no topo da porta com os seguintes parâmetros:

- **Posicionamento Inicial**:
  - Primeira dobradiça: 100mm da extremidade esquerda (valor padrão inicial)
  - Última dobradiça: 100mm da extremidade direita (valor padrão inicial)
  - Dobradiças intermediárias: distribuídas uniformemente entre a primeira e a última

- **Personalização Completa**:
  - Total flexibilidade para ajustar a posição de qualquer dobradiça horizontalmente
  - Limite mínimo de 50mm das bordas laterais
  - Interface idêntica às portas de giro, permitindo edição direta dos valores

O sistema armazena essas posições em `config.dobradicasBasculante` (separado do array usado para portas de giro).

### 3.3. Portas Deslizantes
Não aplicável - portas deslizantes não utilizam dobradiças.

## 4. Cálculo de Posições

### 4.1. Algoritmo de Cálculo Inicial
A função `calcularPosicaoDefaultDobradica()` é usada apenas para determinar as posições **iniciais** das dobradiças:

```javascript
function calcularPosicaoDefaultDobradica(total, alturaPorta = 2100) {
  // Distância padrão inicial das extremidades (topo e base)
  const distanciaExtremidade = 100;
  
  // Espaço disponível entre a primeira e a última dobradiça
  const espacoDisponivel = alturaPorta - (2 * distanciaExtremidade);
  
  // Calcular divisões do espaço disponível
  const numDivisoes = total - 1;
  const tamanhoDivisao = numDivisoes > 0 ? espacoDisponivel / numDivisoes : 0;
  
  // Calcular posições
  const posicoes = [];
  for (let i = 0; i < total; i++) {
    let posicao;
    if (i === 0) {
      posicao = distanciaExtremidade; // Valor inicial, pode ser alterado pelo usuário
    }
    else if (i === total - 1) {
      posicao = alturaPorta - distanciaExtremidade; // Valor inicial, pode ser alterado pelo usuário
    }
    else {
      posicao = Math.round(distanciaExtremidade + (i * tamanhoDivisao));
    }
    posicoes.push(posicao);
  }
  
  return posicoes;
}
```

> **Importante**: Esta função é utilizada apenas para calcular valores iniciais. Após a primeira renderização, o usuário pode modificar livremente as posições através da interface.

### 4.2. Preservação de Valores Personalizados
O sistema foi modificado para preservar os valores personalizados definidos pelo usuário:

- Não força mais o recálculo quando as dobradiças não estão a 100mm das extremidades
- Preserva a configuração manual mesmo após mudanças de altura ou tipo de porta
- Mantém os valores customizados entre sessões através do sistema de armazenamento

### 4.3. Proteção contra Problemas
O sistema implementa proteções contra falhas de cálculo:
- Verificação de entradas válidas
- Tratamento de casos extremos
- Limitação do número máximo de chamadas recursivas
- Valores seguros de fallback em caso de erro
- Distância mínima reduzida para 50mm das bordas

## 5. Comportamento de Interface

### 5.1. Campos de Posição
Os campos de posição das dobradiças são controlados pelos seguintes comportamentos:

- **Atualização Dinâmica**: Os campos são atualizados quando:
  - O tipo de porta é alterado
  - O número de dobradiças é modificado
  - A altura/largura da porta é modificada (dependendo do tipo)

- **Personalização Direta**: 
  - Cada dobradiça tem seu próprio campo numérico de entrada
  - O usuário pode editar livremente a posição de qualquer dobradiça
  - O sistema respeita os valores personalizados em todas as operações
  - Validação em tempo real impede valores inferiores a 50mm das bordas

### 5.2. Visibilidade
- Para portas de giro e basculantes: campos de dobradiças são exibidos
- Para portas deslizantes: campos de dobradiças são ocultados

### 5.3. Opção "S/Dobradiças"
O sistema permite a configuração "S/Dobradiças", que desativa completamente as dobradiças, definindo `numDobradicas` como "S/Dobradiças" e `dobradicas` como um array vazio.

## 6. Validação e Diagnóstico

### 6.1. Regras de Validação
- O número de dobradiças deve estar entre 2 e 5 (ou "S/Dobradiças")
- A distância mínima entre dobradiças deve ser de 100mm
- A primeira dobradiça deve estar a pelo menos 50mm da borda superior (reduzido de 100mm)
- A última dobradiça deve estar a pelo menos 50mm da borda inferior (reduzido de 100mm)

### 6.2. Diagnóstico Automático
O sistema implementa diagnóstico automático para:
- Detectar e corrigir configurações inválidas
- Prevenir loops infinitos em cálculos
- Fornecer valores seguros quando necessário
- Permitir máxima personalização enquanto mantém restrições mínimas de segurança

## 7. Relação com Outros Componentes

### 7.1. Puxadores
Os puxadores são posicionados em relação às dobradiças:
- **Portas de Giro**: Puxador vertical no lado oposto às dobradiças
- **Portas de Giro (Puxador Horizontal)**:
  - Para portas inferiores: Puxador na parte superior
  - Para portas superiores: Puxador na parte inferior
- **Portas Basculantes**: Puxador horizontal na parte inferior, centralizado

### 7.2. Cotas
As cotas das dobradiças são exibidas com cores distintas e acompanham automaticamente as posições personalizadas:
- **Portas de Giro**: Cotas verticais
- **Portas Basculantes**: Cotas horizontais

## 8. Inicialização e Configuração Padrão

### 8.1. Portas de Giro
Quando uma porta de giro é selecionada, o sistema define:
- Largura: 500mm
- Altura: 2450mm
- Número de dobradiças: 4
- Posições iniciais distribuídas uniformemente (100mm das bordas inicialmente, totalmente personalizáveis)

### 8.2. Portas Basculantes
Quando uma porta basculante é selecionada, o sistema define:
- Número de dobradiças: 2 (padrão)
- Posições iniciais distribuídas horizontalmente no topo (100mm das bordas inicialmente, totalmente personalizáveis)
- Configuração de puxador como horizontal
