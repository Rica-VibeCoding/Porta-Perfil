/**
 * Testes para o módulo de controles de UI (ui-controls.js)
 */

import { 
  inicializarControles, 
  inicializarModais, 
  inicializarSeletorLogo, 
  toggleFuncaoPorta 
} from '../../js/ui-controls.js';

// Mock das dependências
jest.mock('../../js/notifications.js', () => ({
  mostrarNotificacao: jest.fn()
}));

jest.mock('../../js/initialize.js', () => ({
  obterConfiguracaoAtual: jest.fn().mockReturnValue({
    largura: 700,
    altura: 2100,
    puxador: { modelo: 'CIELO', posicao: 'vertical' }
  }),
  atualizarConfiguracao: jest.fn(config => config)
}));

jest.mock('../../js/drawing.js', () => ({
  desenharPorta: jest.fn(),
  atualizarDesenho: jest.fn()
}));

// Configuração de teste
beforeEach(() => {
  // Limpar mocks antes de cada teste
  jest.clearAllMocks();
  
  // Configurar mocks do DOM
  document.getElementById = jest.fn().mockImplementation(id => {
    const elements = {
      'larguraInput': { value: '700', addEventListener: jest.fn() },
      'alturaInput': { value: '2100', addEventListener: jest.fn() },
      'vidroTipo': { value: 'Incolor', addEventListener: jest.fn() },
      'perfilModelo': { value: 'RM-114', addEventListener: jest.fn() },
      'funcaoPorta': { value: 'superiorDireita', addEventListener: jest.fn() },
      'puxadorModelo': { value: 'CIELO', addEventListener: jest.fn() },
      'puxadorPosicao': { value: 'vertical', addEventListener: jest.fn() },
      'puxadorLados': { value: 'direito', addEventListener: jest.fn() },
      'sectionDobradicas': { style: { display: 'block' } },
      'sectionDeslizante': { style: { display: 'none' } },
      'logoSelectorBtn': { addEventListener: jest.fn() },
      'logoFileInput': { addEventListener: jest.fn(), files: [] }
    };
    return elements[id] || { value: '', addEventListener: jest.fn() };
  });
  
  document.querySelector = jest.fn().mockImplementation(selector => {
    if (selector === '.canvas-container') {
      return { clientWidth: 1000, clientHeight: 800 };
    }
    return null;
  });
  
  document.querySelectorAll = jest.fn().mockImplementation(selector => {
    if (selector === '.modal-trigger') {
      return [{ 
        dataset: { bsTarget: '#testModal' }, 
        addEventListener: jest.fn() 
      }];
    }
    return [];
  });
});

// Testes para a função toggleFuncaoPorta
describe('toggleFuncaoPorta()', () => {
  test('deve exibir seção de dobradiças para porta de abrir', () => {
    const sectionDobradicas = { style: { display: 'none' } };
    const sectionDeslizante = { style: { display: 'block' } };
    
    document.getElementById = jest.fn().mockImplementation(id => {
      if (id === 'sectionDobradicas') return sectionDobradicas;
      if (id === 'sectionDeslizante') return sectionDeslizante;
      return null;
    });
    
    toggleFuncaoPorta('superiorDireita');
    
    expect(sectionDobradicas.style.display).toBe('block');
    expect(sectionDeslizante.style.display).toBe('none');
  });
  
  test('deve exibir seção deslizante para porta deslizante', () => {
    const sectionDobradicas = { style: { display: 'block' } };
    const sectionDeslizante = { style: { display: 'none' } };
    
    document.getElementById = jest.fn().mockImplementation(id => {
      if (id === 'sectionDobradicas') return sectionDobradicas;
      if (id === 'sectionDeslizante') return sectionDeslizante;
      return null;
    });
    
    toggleFuncaoPorta('deslizante');
    
    expect(sectionDobradicas.style.display).toBe('none');
    expect(sectionDeslizante.style.display).toBe('block');
  });
  
  test('não deve fazer nada se as seções não existirem', () => {
    document.getElementById = jest.fn().mockReturnValue(null);
    
    // Não deve lançar erro
    expect(() => toggleFuncaoPorta('superiorDireita')).not.toThrow();
  });
});

// Testes para a função inicializarControles
describe('inicializarControles()', () => {
  test('deve chamar as funções de inicialização dos controles', () => {
    // Mock das funções de inicialização
    const inicializarCamposGeraisMock = jest.fn();
    const inicializarControlesMedidasMock = jest.fn();
    const inicializarControlesMateriaisMock = jest.fn();
    const inicializarControlesFuncaoMock = jest.fn();
    const inicializarControlesPuxadorMock = jest.fn();
    const inicializarControlesDobradicasQtdMock = jest.fn();
    const configurarValidacaoFormularioMock = jest.fn();
    
    // Substituir temporariamente as funções
    const originalFuncs = {
      inicializarCamposGerais: global.inicializarCamposGerais,
      inicializarControlesMedidas: global.inicializarControlesMedidas,
      inicializarControlesMateriais: global.inicializarControlesMateriais,
      inicializarControlesFuncao: global.inicializarControlesFuncao,
      inicializarControlesPuxador: global.inicializarControlesPuxador,
      inicializarControlesDobradicasQtd: global.inicializarControlesDobradicasQtd,
      configurarValidacaoFormulario: global.configurarValidacaoFormulario
    };
    
    global.inicializarCamposGerais = inicializarCamposGeraisMock;
    global.inicializarControlesMedidas = inicializarControlesMedidasMock;
    global.inicializarControlesMateriais = inicializarControlesMateriaisMock;
    global.inicializarControlesFuncao = inicializarControlesFuncaoMock;
    global.inicializarControlesPuxador = inicializarControlesPuxadorMock;
    global.inicializarControlesDobradicasQtd = inicializarControlesDobradicasQtdMock;
    global.configurarValidacaoFormulario = configurarValidacaoFormularioMock;
    
    // Executar a função
    inicializarControles();
    
    // Restaurar funções originais
    Object.assign(global, originalFuncs);
    
    // Verificações
    const atualizarDesenho = require('../../js/drawing.js').atualizarDesenho;
    const obterConfiguracaoAtual = require('../../js/initialize.js').obterConfiguracaoAtual;
    
    expect(obterConfiguracaoAtual).toHaveBeenCalled();
    expect(atualizarDesenho).toHaveBeenCalled();
  });
});

// Testes para a função inicializarModais
describe('inicializarModais()', () => {
  test('deve adicionar event listeners aos botões modais', () => {
    const mockModalTrigger = { 
      dataset: { bsTarget: '#testModal' }, 
      addEventListener: jest.fn() 
    };
    
    document.querySelectorAll.mockReturnValue([mockModalTrigger]);
    
    inicializarModais();
    
    expect(document.querySelectorAll).toHaveBeenCalledWith('.modal-trigger');
    expect(mockModalTrigger.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
});

// Testes para a função inicializarSeletorLogo
describe('inicializarSeletorLogo()', () => {
  test('deve configurar event listeners para o seletor de logo', () => {
    const logoSelectorBtn = { addEventListener: jest.fn() };
    const logoFileInput = { addEventListener: jest.fn(), click: jest.fn() };
    
    document.getElementById.mockImplementation(id => {
      if (id === 'logoSelectorBtn') return logoSelectorBtn;
      if (id === 'logoFileInput') return logoFileInput;
      return null;
    });
    
    inicializarSeletorLogo();
    
    expect(logoSelectorBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(logoFileInput.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
}); 