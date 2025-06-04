/**
 * Testes para o módulo de inicialização (initialize.js)
 */

// Importar funções a serem testadas
import { 
  inicializar, 
  verificarCompatibilidade, 
  obterConfiguracaoAtual, 
  atualizarConfiguracao, 
  configuracaoAtual 
} from '../../js/initialize.js';

// Mock global do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

// Configuração de teste
beforeEach(() => {
  // Limpar mocks antes de cada teste
  jest.clearAllMocks();
  
  // Configurar mocks globais
  global.localStorage = localStorageMock;
  
  // Redefinir a configuração para o estado padrão antes de cada teste
  jest.spyOn(global.console, 'log').mockImplementation(() => {});
  jest.spyOn(global.console, 'warn').mockImplementation(() => {});
  jest.spyOn(global.console, 'error').mockImplementation(() => {});
});

// Testes para a função inicializar
describe('inicializar()', () => {
  test('deve retornar true quando inicializado com sucesso', () => {
    const resultado = inicializar();
    expect(resultado).toBe(true);
  });

  test('deve chamar verificarCompatibilidade', () => {
    const spy = jest.spyOn(global, 'verificarCompatibilidade');
    inicializar();
    expect(spy).toHaveBeenCalled();
  });

  test('deve expor funções globalmente', () => {
    inicializar();
    expect(window.obterConfiguracaoAtual).toBeDefined();
    expect(window.atualizarConfiguracao).toBeDefined();
  });
});

// Testes para a função verificarCompatibilidade
describe('verificarCompatibilidade()', () => {
  test('deve verificar suporte a SVG', () => {
    document.createElementNS = jest.fn(() => ({
      createSVGRect: jest.fn()
    }));
    verificarCompatibilidade();
    expect(document.createElementNS).toHaveBeenCalled();
  });

  test('deve verificar localStorage', () => {
    verificarCompatibilidade();
    expect(localStorage.setItem).toHaveBeenCalledWith('teste', 'teste');
    expect(localStorage.removeItem).toHaveBeenCalledWith('teste');
  });
});

// Testes para a função obterConfiguracaoAtual
describe('obterConfiguracaoAtual()', () => {
  test('deve retornar um objeto de configuração', () => {
    const config = obterConfiguracaoAtual();
    expect(config).toEqual(expect.objectContaining({
      largura: expect.any(Number),
      altura: expect.any(Number),
      puxador: expect.any(Object)
    }));
  });

  test('deve obter valores dos campos do formulário', () => {
    // Configurar mocks para elementos do DOM
    document.getElementById.mockImplementation((id) => {
      const elements = {
        'larguraInput': { value: '800' },
        'alturaInput': { value: '2200' },
        'vidroTipo': { value: 'Fumê' },
        'perfilModelo': { value: 'RM-120' }
      };
      return elements[id];
    });

    const config = obterConfiguracaoAtual();
    
    // Verificar se os valores foram corretamente extraídos
    expect(config.largura).toBe(800);
    expect(config.altura).toBe(2200);
    expect(config.vidro).toBe('Fumê');
    expect(config.perfilModelo).toBe('RM-120');
  });
});

// Testes para a função atualizarConfiguracao
describe('atualizarConfiguracao()', () => {
  test('deve mesclar novas configurações com as existentes', () => {
    const novasConfigs = {
      largura: 850,
      altura: 2250
    };
    
    const resultado = atualizarConfiguracao(novasConfigs);
    
    expect(resultado.largura).toBe(850);
    expect(resultado.altura).toBe(2250);
    // Valores antigos devem ser mantidos
    expect(resultado.vidro).toBe(configuracaoAtual.vidro);
  });

  test('deve mesclar corretamente o objeto puxador', () => {
    const novasConfigs = {
      puxador: {
        modelo: 'SLIM',
        medida: '200'
      }
    };
    
    const resultado = atualizarConfiguracao(novasConfigs);
    
    expect(resultado.puxador.modelo).toBe('SLIM');
    expect(resultado.puxador.medida).toBe('200');
    // Valores antigos do puxador devem ser mantidos
    expect(resultado.puxador.posicao).toBe(configuracaoAtual.puxador.posicao);
  });

  test('deve atualizar o array de dobradiças', () => {
    const novasConfigs = {
      dobradicas: [150, 550, 1050, 2050]
    };
    
    const resultado = atualizarConfiguracao(novasConfigs);
    
    expect(resultado.dobradicas).toEqual([150, 550, 1050, 2050]);
    expect(resultado.dobradicas).not.toBe(novasConfigs.dobradicas); // Deve ser uma cópia
  });
}); 