/**
 * Módulo principal de desenho SVG para o sistema de portas - VERSÃO MODULAR
 * Sistema de Portas e Perfis
 */

// Importar todos os submódulos
import { CONFIG, obterCorPerfil, obterCorVidro } from './config.js';
import { 
  inicializarCanvas, limparCanvas, criarElementoSVG, 
  getSvgContainer, capturarImagemCanvas, 
  aplicarFundoBranco, inicializarSVG, limparSVG 
} from './core.js';
import { 
  desenharDobradicaSVG, desenharPuxadorSVG, 
  aplicarEfeitosReflexoVidro, desenharDobradicasSVG 
} from './elements.js';
import { 
  desenharCotaSVG, desenharCotasSVG, desenharLegenda 
} from './annotations.js';
import { 
  desenharPorta, desenharPortaAbrir, desenharPortaDeslizante, 
  atualizarDesenho, desenharPortaSVG 
} from './door-types.js';
import * as DrawingUtils from './utils.js';

// Reexportar todas as funções que devem ser públicas
export {
  // Configurações
  CONFIG,
  obterCorPerfil,
  obterCorVidro,
  
  // Funções de core
  inicializarCanvas,
  limparCanvas,
  criarElementoSVG,
  capturarImagemCanvas,
  
  // Elementos gráficos
  desenharDobradicaSVG,
  desenharPuxadorSVG,
  desenharDobradicasSVG,
  
  // Anotações
  desenharCotaSVG,
  desenharCotasSVG,
  desenharLegenda,
  
  // Tipos de porta
  desenharPorta,
  desenharPortaAbrir,
  desenharPortaDeslizante,
  atualizarDesenho,
  
  // Utilitários
  DrawingUtils,
  
  // Aliases para compatibilidade
  inicializarSVG,
  limparSVG,
  desenharPortaSVG,
  atualizarDesenho as atualizarDesenhoSVG,
  capturarImagemCanvas as capturarImagemSVG
}; 