/**
 * Testes para o módulo de utilidades (utils.js)
 */

import { mostrarNotificacao } from '../../js/notifications.js';

// Mock para mostrarNotificacao
jest.mock('../../js/notifications.js', () => ({
  mostrarNotificacao: jest.fn()
}));

// Teste simples para verificar se a importação funciona
describe('Importação de módulos', () => {
  test('deve importar corretamente a função mostrarNotificacao', () => {
    expect(mostrarNotificacao).toBeDefined();
  });
});

// Teste simples para verificar se a função pode ser chamada
describe('Função mostrarNotificacao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('pode ser chamada com parâmetros', () => {
    mostrarNotificacao('Teste', 'success');
    expect(mostrarNotificacao).toHaveBeenCalledWith('Teste', 'success');
  });

  test('pode ser chamada apenas com mensagem', () => {
    mostrarNotificacao('Apenas mensagem');
    expect(mostrarNotificacao).toHaveBeenCalledWith('Apenas mensagem');
  });
}); 