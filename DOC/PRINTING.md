"# Documentação Técnica: Sistema de Impressão

## Visão Geral do Sistema de Impressão

O sistema de impressão do Conecta Portas foi projetado para converter os desenhos SVG interativos em documentos de impressão otimizados. Esse processo envolve várias etapas de transformação e otimização para garantir que a saída impressa seja de alta qualidade e represente corretamente os elementos visuais.

## Fluxo de Impressão

1. **Captura do SVG Original**: O SVG renderizado na tela é capturado.
2. **Clonagem e Ajuste**: Uma cópia profunda do SVG é criada e ajustada para impressão.
3. **Tratamento Especial de Elementos**: Diferentes elementos SVG recebem tratamentos específicos.
4. **Formatação para A4**: O SVG é redimensionado para caber em uma folha A4.
5. **Geração da Página de Impressão**: Um documento HTML específico para impressão é criado.

## Tratamento de Elementos Visuais

### Gradientes e Efeitos de Vidro

Os gradientes usados para simular o vidro recebem um tratamento especial durante o processo de impressão:

1. **Preservação de Definições de Gradientes**:
   ```javascript
   // Verificar se o SVG original tem elementos defs
   const originalDefs = svgOriginal.querySelector('defs');
   const cloneDefs = svgClone.querySelector('defs');
   
   if (originalDefs && (!cloneDefs || cloneDefs.children.length === 0)) {
     // Transferir definições de gradientes para o SVG clonado
     // ...
   }
   ```

2. **Mapeamento de IDs de Gradientes**:
   ```javascript
   // Mapear IDs originais para novos IDs
   const idMapping = {};
   gradients.forEach(gradient => {
     const id = gradient.getAttribute('id');
     if (id && id.startsWith('print_')) {
       const originalId = id.replace('print_', '');
       idMapping[originalId] = id;
     }
   });
   
   // Atualizar referências de URL
   const elementsWithFill = svgAjustado.querySelectorAll('[fill^="url(#"]');
   elementsWithFill.forEach(el => {
     // Atualizar referências
     // ...
   });
   ```

### Remoção de Linhas Horizontais do Vidro

Diferentemente da visualização na tela, a versão para impressão não inclui as linhas horizontais finas que fazem parte do efeito visual do vidro. Isso é implementado da seguinte forma:

```javascript
/**
 * REMOÇÃO DE LINHAS HORIZONTAIS DO VIDRO PARA IMPRESSÃO
 */
const todosRetangulos = svgAjustado.querySelectorAll('rect');
todosRetangulos.forEach(rect => {
  const altura = rect.getAttribute('height');
  const fill = rect.getAttribute('fill');
  const opacity = rect.getAttribute('opacity');
  const stroke = rect.getAttribute('stroke');
  
  if (altura && parseFloat(altura) <= 0.75 && 
      fill === 'white' && 
      opacity && parseFloat(opacity) < 0.3 &&
      (!stroke || stroke === 'none')) {
    rect.remove();
  }
});
```

Essas linhas são removidas para evitar que sejam confundidas com riscos ou imperfeições no vidro quando visualizadas em forma impressa.

### Por que duas representações diferentes?

Utilizamos diferentes representações visuais entre a tela e a impressão porque:

1. **Na tela**: Os efeitos visuais completos (incluindo linhas sutis) ajudam a criar uma representação mais realista e interativa do vidro.

2. **Na impressão**: A versão mais limpa, sem as linhas horizontais, evita confusão e proporciona um resultado profissional e claro em papel.

## Ajuste Automático para A4

O sistema ajusta automaticamente o SVG para caber em uma folha A4, preservando as proporções:

```javascript
function ajustarEscalaParaA4(svg, config) {
  // Dimensões do A4 em mm (convertidas para a mesma unidade do SVG)
  const a4Largura = 210; // mm
  const a4Altura = 297;  // mm
  
  // Converter para pixels usando fator de escala adequado
  // ...
  
  // Calcular fator de escala para caber na página
  // ...
  
  // Aplicar dimensões finais
  svg.setAttribute('width', `${larguraFinal}mm`);
  svg.setAttribute('height', `${alturaFinal}mm`);
  
  return svg;
}
```

## Solução de Problemas

### Gradientes não aparecem na impressão

Verifique:
1. Se as definições de gradientes estão sendo corretamente transferidas
2. Se os IDs dos gradientes estão sendo mapeados corretamente
3. Se todas as referências `url(#id)` foram atualizadas

### Elementos aparecem muito claros ou invisíveis

Verifique:
1. Se as opacidades mínimas estão sendo aplicadas (atualmente 0.1 para elementos gerais)
2. Se elementos com `fill="none"` estão sendo tratados corretamente

### Linhas horizontais ainda visíveis na impressão

Verifique os critérios de identificação no código de remoção de linhas horizontais:
- Altura (≤ 0.75px)
- Preenchimento (branco)
- Opacidade (< 0.3)
- Ausência de stroke 