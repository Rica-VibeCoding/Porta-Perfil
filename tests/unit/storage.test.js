/**
 * Testes para o módulo de armazenamento (storage.js)
 */

// Importar funções a serem testadas
import { 
  inicializarArmazenamento,
  carregarUltimaConfiguracao,
  obterTodasConfiguracoes,
  salvarConfiguracao
} from '../../js/storage.js';

// Mock das dependências
jest.mock('../../js/initialize.js', () => ({
  obterConfiguracaoAtual: jest.fn().mockReturnValue({ 
    largura: 700, 
    altura: 2100,
    puxador: { modelo: 'CIELO' } 
  }),
  atualizarConfiguracao: jest.fn(config => config)
}));

jest.mock('../../js/drawing.js', () => ({
  atualizarDesenho: jest.fn()
}));

jest.mock('../../js/notifications.js', () => ({
  mostrarNotificacao: jest.fn()
}));

jest.mock('../../js/form-handlers.js', () => ({
  updateDobradicaInputs: jest.fn()
}));

// Configuração de teste
beforeEach(() => {
  // Limpar mocks antes de cada teste
  jest.clearAllMocks();
  
  // Mock para elementos do DOM
  document.getElementById.mockImplementation(id => {
    if (id === 'savedConfigs') {
      return {
        innerHTML: '',
        appendChild: jest.fn()
      };
    }
    if (id === 'configName') {
      return { value: 'Test Config' };
    }
    if (id === 'configModal') {
      return { style: { display: 'none' } };
    }
    return null;
  });
  
  document.createElement.mockImplementation(tag => {
    return {
      className: '',
      textContent: '',
      style: {},
      appendChild: jest.fn(),
      addEventListener: jest.fn()
    };
  });
  
  document.querySelector.mockImplementation(selector => {
    if (selector === '.modal-content button') {
      return {
        addEventListener: jest.fn()
      };
    }
    return null;
  });
});

// Testes para a função inicializarArmazenamento
describe('inicializarArmazenamento()', () => {
  test('deve chamar carregarUltimaConfiguracao quando carregarUltima=true', () => {
    const spy = jest.spyOn(global, 'carregarUltimaConfiguracao');
    inicializarArmazenamento(true);
    expect(spy).toHaveBeenCalled();
  });
  
  test('não deve chamar carregarUltimaConfiguracao quando carregarUltima=false', () => {
    const spy = jest.spyOn(global, 'carregarUltimaConfiguracao');
    inicializarArmazenamento(false);
    expect(spy).not.toHaveBeenCalled();
  });
  
  test('deve configurar evento para o botão de salvar', () => {
    const btnElement = { addEventListener: jest.fn() };
    document.querySelector.mockReturnValue(btnElement);
    
    inicializarArmazenamento();
    expect(document.querySelector).toHaveBeenCalledWith('.modal-content button');
    expect(btnElement.addEventListener).toHaveBeenCalled();
  });
});

// Testes para a função obterTodasConfiguracoes
describe('obterTodasConfiguracoes()', () => {
  test('deve retornar um array vazio quando não houver configurações', () => {
    localStorage.getItem.mockReturnValue(null);
    const configs = obterTodasConfiguracoes();
    expect(configs).toEqual([]);
  });
  
  test('deve retornar configurações armazenadas', () => {
    const mockConfigs = [
      { id: '1', nome: 'Config 1', dados: { largura: 800 } },
      { id: '2', nome: 'Config 2', dados: { largura: 900 } }
    ];
    localStorage.getItem.mockReturnValue(JSON.stringify(mockConfigs));
    
    const configs = obterTodasConfiguracoes();
    expect(configs).toEqual(mockConfigs);
  });
  
  test('deve retornar array vazio se o formato for inválido', () => {
    localStorage.getItem.mockReturnValue('invalid-json');
    const configs = obterTodasConfiguracoes();
    expect(configs).toEqual([]);
  });
});

// Testes para a função salvarConfiguracao
describe('salvarConfiguracao()', () => {
  test('deve salvar configuração no localStorage', () => {
    const mockConfig = { largura: 800, altura: 2200 };
    
    salvarConfiguracao(mockConfig);
    
    // Verificar se algo foi salvo no localStorage
    expect(localStorage.setItem).toHaveBeenCalled();
  });
  
  test('deve retornar true quando salvou com sucesso', () => {
    const result = salvarConfiguracao({ test: true });
    expect(result).toBe(true);
  });
  
  test('deve salvar última configuração usada', () => {
    salvarConfiguracao({ test: true });
    
    // Verificar se a última configuração foi salva
    expect(localStorage.setItem).toHaveBeenCalledWith('conecta_ultima_config', expect.any(String));
  });
});

// Testes para a função carregarUltimaConfiguracao
describe('carregarUltimaConfiguracao()', () => {
  test('deve carregar a última configuração do localStorage', () => {
    // Configurar dados de teste
    const mockConfig = { 
      id: '123', 
      data: new Date().toISOString(),
      nome: 'Última Config',
      dados: { largura: 850, altura: 2250 } 
    };
    
    localStorage.getItem.mockReturnValue(JSON.stringify(mockConfig));
    
    // Espiona as dependências
    const atualizarDesenho = require('../../js/drawing.js').atualizarDesenho;
    
    // Executa a função
    carregarUltimaConfiguracao();
    
    // Verificar se a configuração foi aplicada
    expect(atualizarDesenho).toHaveBeenCalledWith(mockConfig.dados);
  });
  
  test('não deve causar erro quando não houver última configuração', () => {
    localStorage.getItem.mockReturnValue(null);
    expect(() => carregarUltimaConfiguracao()).not.toThrow();
  });
}); 