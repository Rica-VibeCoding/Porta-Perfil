# Conecta Portas - Sistema de Desenho

Sistema para configuração, visualização e impressão de portas de vidro e perfis de alumínio.

## Visão Geral

Este sistema permite a criação, personalização e impressão de desenhos técnicos de portas, com suporte a diferentes modelos, configurações de vidro, puxadores e acabamentos.

## Funcionalidades Principais

- Configuração das dimensões da porta (altura e largura)
- Seleção de tipo de vidro (Incolor, Fumê, Espelho, etc.)
- Configuração de puxadores (posição, tamanho, tipo e orientação horizontal/vertical)
- Suporte a puxador horizontal e vertical em portas de giro e deslizantes (conforme escolha do usuário)
- Puxador sempre horizontal em portas basculantes (por padrão técnico)
- Visualização em tempo real das alterações
- Impressão em formato A4 otimizada
- Definição de dobradiças e suas posições
- Sistema de cotas automáticas
- Legenda com informações técnicas

## Tecnologias Utilizadas

- JavaScript (ES6+)
- HTML5/CSS3
- SVG para renderização dos desenhos
- Bootstrap 5 para interface
- Sistema de módulos JavaScript
- LocalStorage para persistência de dados

## Estrutura do Projeto

- `js/` - Scripts JavaScript do sistema
  - `drawing/` - Módulos de desenho SVG
  - `modules/` - Módulos específicos para funcionalidades
  - `printing.js` - Módulo de impressão e exportação
  - `initialize.js` - Inicialização do sistema
  - `ui-controls.js` - Controles de interface
  - `form-handlers.js` - Manipuladores de formulários
  - `main.js` - Funções principais
- `css/` - Estilos CSS do sistema
- `img/` - Imagens e recursos gráficos
- `components/` - Componentes isolados

## Características de Visualização e Impressão

### Efeitos Visuais do Vidro

O sistema implementa efeitos visuais sofisticados para simular o vidro real, incluindo:

- **Degradês suaves** - Transições de opacidade que simulam a reflexão natural do vidro
- **Efeitos de brilho radial** - Pontos de luz concentrados para simular reflexos
- **Efeitos de borda** - Reflexos sutis nas bordas do vidro

### Otimizações para Impressão

O sistema trata o processo de impressão de forma especializada, com otimizações específicas:

1. **Preservação de gradientes** - Mantém os degradês principais durante o processo de impressão, garantindo que o vidro ainda pareça realista.

2. **Remoção de linhas horizontais** - A versão impressa remove automaticamente as linhas horizontais finas do vidro que estão presentes na visualização. Isso evita que estes elementos sejam confundidos com riscos ou falhas no vidro ao visualizar a impressão.

3. **Mapeamento de IDs de gradientes** - Garante que referências a gradientes SVG sejam preservadas corretamente ao clonar para impressão.

4. **Ajuste automático para A4** - Redimensiona o desenho para caber perfeitamente em uma folha A4, preservando as proporções.

## Instruções de Instalação

1. Clone este repositório
2. Instale as dependências com `npm install`
3. Execute em um servidor local com `npx http-server -p 3000`
4. Acesse através do navegador em `http://127.0.0.1:3000`

## Personalização e Extensão

O sistema foi projetado de forma modular para facilitar a extensão. Novos tipos de portas, vidros ou hardware podem ser adicionados através da extensão dos módulos existentes.

---

## Changelog

### Versão 1.2.0
- Correção: Agora portas de giro e deslizantes respeitam a escolha do usuário para puxador horizontal ou vertical
- Restrição: Portas basculantes continuam apenas com puxador horizontal
- Refatoração: Removida sobrescrita indevida da posição do puxador em funções de cálculo de cotas

### Versão 1.1.0
- Melhoria: Aprimoramento do tratamento de degradês para impressão
- Correção: Eliminação de linhas horizontais na versão impressa para evitar confusão com riscos
- Melhoria: Otimização da preservação de referências de gradientes SVG durante a clonagem para impressão
- Melhoria: Ajuste fino das opacidades dos elementos SVG para melhor visualização impressa

### Versão 1.0.0
- Lançamento inicial do sistema de desenho de portas 