// Mock das APIs do navegador
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

// Criar mocks para as funções globais usadas nos testes
global.verificarCompatibilidade = jest.fn().mockReturnValue(true);
global.atualizarDesenho = jest.fn();
global.svgContainer = {};

// Mock do objeto document
global.document = {
  getElementById: jest.fn().mockImplementation(() => ({
    value: 'test',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    removeAttribute: jest.fn(),
    style: {},
    dispatchEvent: jest.fn()
  })),
  createElement: jest.fn().mockImplementation(() => ({
    id: '',
    style: {},
    appendChild: jest.fn()
  })),
  createElementNS: jest.fn().mockImplementation(() => ({
    setAttribute: jest.fn(),
    style: {},
    appendChild: jest.fn()
  })),
  querySelector: jest.fn().mockImplementation(() => ({
    innerHTML: '',
    appendChild: jest.fn(),
    style: {}
  })),
  querySelectorAll: jest.fn().mockImplementation(() => []),
  addEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  documentElement: { style: {}, lang: 'pt-BR' }
};

// Bootstrap mock
global.bootstrap = {
  Modal: class {
    constructor() {
      this.show = jest.fn();
      this.hide = jest.fn();
    }
    static getInstance() {
      return {
        show: jest.fn(),
        hide: jest.fn()
      };
    }
  }
};

// Event mock
global.Event = class {
  constructor(name) {
    this.name = name;
  }
};

// Element mock
global.HTMLElement = class {
  constructor() {
    this.style = {};
    this.innerHTML = '';
  }
  addEventListener() {}
  appendChild() {}
};

// Console global
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock da API html2canvas
global.html2canvas = jest.fn().mockResolvedValue({
  toDataURL: jest.fn().mockReturnValue('data:image/png;base64,test')
});

// Mock da API html2pdf
global.html2pdf = {
  from: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnThis(),
    save: jest.fn()
  })
};

// Mock do Canvas
class CanvasMock {
  getContext() {
    return {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn()
    };
  }
}

// Mock do LocalStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};

global.HTMLCanvasElement = CanvasMock;
global.localStorage = localStorageMock;

// Limpa todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
}); 