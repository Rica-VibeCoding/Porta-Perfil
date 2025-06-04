/**
 * Funções utilitárias para o desenho de portas e perfis
 * Sistema de Portas e Perfis
 */

import { CONFIG } from './config.js';

/**
 * Converte uma medida de milímetros para pixels com base na escala atual
 * @param {number} medidaMm - Medida em milímetros
 * @returns {number} - Medida em pixels
 */
export function mmParaPixels(medidaMm) {
  // Validar entrada
  if (medidaMm === undefined || medidaMm === null || isNaN(Number(medidaMm))) {
    console.warn(`Valor inválido para conversão mm->px: ${medidaMm}`);
    return 0;
  }
  
  // Converter para número e multiplicar pela escala
  return Number(medidaMm) * CONFIG.escala;
}

/**
 * Converte uma medida de pixels para milímetros com base na escala atual
 * @param {number} medidaPx - Medida em pixels
 * @returns {number} - Medida em milímetros
 */
export function pixelsParaMm(medidaPx) {
  // Validar entrada
  if (medidaPx === undefined || medidaPx === null || isNaN(Number(medidaPx))) {
    console.warn(`Valor inválido para conversão px->mm: ${medidaPx}`);
    return 0;
  }
  
  // Converter para número e dividir pela escala
  return Number(medidaPx) / CONFIG.escala;
}

/**
 * Converte uma medida de pixels para milímetros arredondando para inteiro
 * @param {number} medidaPx - Medida em pixels
 * @returns {number} - Medida em milímetros arredondada para inteiro
 */
export function pixelsParaMmInteiro(medidaPx) {
  return Math.round(pixelsParaMm(medidaPx));
}

/**
 * Converte uma medida de pixels para milímetros com precisão específica
 * @param {number} medidaPx - Medida em pixels
 * @param {number} casasDecimais - Número de casas decimais (padrão: 1)
 * @returns {number} - Medida em milímetros com precisão específica
 */
export function pixelsParaMmPreciso(medidaPx, casasDecimais = 1) {
  const fator = Math.pow(10, casasDecimais);
  return Math.round(pixelsParaMm(medidaPx) * fator) / fator;
}

/**
 * Formata um valor numérico para exibição em cotas
 * @param {number} valor - Valor a ser formatado
 * @param {boolean} incluirUnidade - Se deve incluir "mm" no final
 * @returns {string} - Valor formatado para exibição
 */
export function formatarValorCota(valor, incluirUnidade = false) {
  if (valor === undefined || valor === null || isNaN(Number(valor))) {
    return incluirUnidade ? '0 mm' : '0';
  }
  
  // Arredondar para inteiro
  const valorInteiro = Math.round(Number(valor));
  return incluirUnidade ? `${valorInteiro} mm` : `${valorInteiro}`;
}

/**
 * Calcula o centro de um retângulo
 * @param {number} x - Posição X do retângulo
 * @param {number} y - Posição Y do retângulo
 * @param {number} largura - Largura do retângulo
 * @param {number} altura - Altura do retângulo
 * @returns {Object} - Objeto com as coordenadas centrais {x, y}
 */
export function calcularCentroRetangulo(x, y, largura, altura) {
  return {
    x: x + largura / 2,
    y: y + altura / 2
  };
}

/**
 * Calcula as coordenadas de um ponto com base no ângulo e distância a partir de um ponto de origem
 * @param {number} x - Posição X de origem
 * @param {number} y - Posição Y de origem
 * @param {number} angulo - Ângulo em graus
 * @param {number} distancia - Distância em pixels
 * @returns {Object} - Coordenadas do novo ponto {x, y}
 */
export function calcularPontoPolar(x, y, angulo, distancia) {
  const anguloRadianos = (angulo * Math.PI) / 180;
  return {
    x: x + distancia * Math.cos(anguloRadianos),
    y: y + distancia * Math.sin(anguloRadianos)
  };
}

/**
 * Distribui pontos uniformemente ao longo de uma linha
 * @param {number} x1 - Coordenada X inicial
 * @param {number} y1 - Coordenada Y inicial
 * @param {number} x2 - Coordenada X final
 * @param {number} y2 - Coordenada Y final
 * @param {number} numPontos - Número de pontos a distribuir
 * @returns {Array} - Array de objetos {x, y} representando os pontos
 */
export function distribuirPontosLinha(x1, y1, x2, y2, numPontos) {
  const pontos = [];
  
  if (numPontos <= 1) {
    // Se houver apenas um ponto, retornar o ponto médio
    pontos.push({ x: (x1 + x2) / 2, y: (y1 + y2) / 2 });
    return pontos;
  }
  
  // Distribuir os pontos uniformemente
  for (let i = 0; i < numPontos; i++) {
    const fator = i / (numPontos - 1);
    pontos.push({
      x: x1 + (x2 - x1) * fator,
      y: y1 + (y2 - y1) * fator
    });
  }
  
  return pontos;
}

/**
 * Verifica se um ponto está dentro de um retângulo
 * @param {number} px - Coordenada X do ponto
 * @param {number} py - Coordenada Y do ponto
 * @param {number} rx - Coordenada X do retângulo (canto superior esquerdo)
 * @param {number} ry - Coordenada Y do retângulo (canto superior esquerdo)
 * @param {number} largura - Largura do retângulo
 * @param {number} altura - Altura do retângulo
 * @returns {boolean} - true se o ponto estiver dentro do retângulo
 */
export function pontoDentroRetangulo(px, py, rx, ry, largura, altura) {
  return px >= rx && px <= rx + largura && py >= ry && py <= ry + altura;
}

/**
 * Calcula a distância entre dois pontos
 * @param {number} x1 - Coordenada X do primeiro ponto
 * @param {number} y1 - Coordenada Y do primeiro ponto
 * @param {number} x2 - Coordenada X do segundo ponto
 * @param {number} y2 - Coordenada Y do segundo ponto
 * @returns {number} - Distância entre os pontos
 */
export function calcularDistancia(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
} 