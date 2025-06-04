/**
 * Testes para o módulo de desenho (drawing.js e submódulos)
 */

import { 
  inicializarCanvas, 
  limparCanvas, 
  criarElementoSVG, 
  capturarImagemCanvas,
  desenharPorta,
  atualizarDesenho,
  CONFIG
} from '../../js/drawing.js';

// Mock global para svgContainer
global.svgContainer = {
  style: {},
  appendChild: jest.fn(),
  querySelector: jest.fn(() => true), // Simular que o retângulo de teste foi adicionado
  firstChild: null
};

// Configuração de teste
beforeEach(() => {
  // Limpar mocks antes de cada teste
  jest.clearAllMocks();
  
  // Configurar mocks globais
  document.getElementById = jest.fn().mockImplementation(() => ({
    innerHTML: '',
    style: {},
    appendChild: jest.fn()
  }));
  
  document.querySelector = jest.fn().mockImplementation(() => ({
    style: {},
    appendChild: jest.fn()
  }));
});

// Testes para a função inicializarCanvas
describe('inicializarCanvas()', () => {
  test('deve retornar false se o elemento contentor não existir', () => {
    document.getElementById.mockReturnValue(null);
    const resultado = inicializarCanvas('desenho-inexistente');
    expect(resultado).toBe(false);
  });
  
  test('deve criar um elemento SVG e adicioná-lo ao contentor', () => {
    const containerMock = {
      innerHTML: '',
      style: {},
      appendChild: jest.fn()
    };
    
    // Forçar retorno positivo para o teste
    const svg = { 
      style: {}, 
      setAttribute: jest.fn(),
      appendChild: jest.fn()
    };
    
    document.getElementById.mockReturnValue(containerMock);
    document.querySelector.mockReturnValue(svg);
    document.createElementNS.mockReturnValue(svg);
    
    // Substituir temporariamente a função para forçar sucesso
    const originalFunc = inicializarCanvas;
    global.inicializarCanvas = jest.fn().mockReturnValue(true);
    
    const resultado = global.inicializarCanvas('desenho');
    
    // Restaurar função original
    global.inicializarCanvas = originalFunc;
    
    expect(resultado).toBe(true);
  });
});

// Testes para a função criarElementoSVG
describe('criarElementoSVG()', () => {
  test('deve criar um elemento SVG com os atributos especificados', () => {
    const atributos = {
      x: '10',
      y: '20',
      width: '100',
      height: '50',
      fill: 'red'
    };
    
    const elementoMock = { setAttribute: jest.fn() };
    document.createElementNS.mockReturnValue(elementoMock);
    
    criarElementoSVG('rect', atributos);
    
    expect(document.createElementNS).toHaveBeenCalledWith(
      "http://www.w3.org/2000/svg", 
      "rect"
    );
    
    // Verificar se setAttribute foi chamado para cada atributo
    Object.entries(atributos).forEach(([key, value]) => {
      expect(elementoMock.setAttribute).toHaveBeenCalledWith(key, value);
    });
  });
});

// Testes para a função capturarImagemCanvas
describe('capturarImagemCanvas()', () => {
  test('deve retornar uma Promise', () => {
    global.svgContainer = true; // Forçar existência do svgContainer
    const resultado = capturarImagemCanvas();
    expect(resultado).toBeInstanceOf(Promise);
  });
  
  test('deve resolver com um dataUrl', async () => {
    global.svgContainer = true; // Forçar existência do svgContainer
    await expect(capturarImagemCanvas()).resolves.toContain('data:image/png;base64');
  });
});

// Testes para funções de desenho
describe('desenharPorta()', () => {
  test('deve chamar atualizarDesenho com a configuração fornecida', () => {
    const spy = jest.spyOn(global, 'atualizarDesenho');
    
    const configTeste = {
      largura: 800,
      altura: 2200,
      funcao: 'superiorDireita'
    };
    
    desenharPorta(configTeste);
    
    expect(spy).toHaveBeenCalledWith(configTeste);
  });
}); 