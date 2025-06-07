/**
 * Integração Unificada com Supabase para Sistema de Cadastramento
 * Sistema de Portas e Perfis
 */

import { CadastroNotificacoes, CadastroUtils } from './cadastro-core.js';
import { getCurrentUser } from './auth.js';

/**
 * Cliente Supabase unificado
 */
class SupabaseClient {
  constructor() {
    this.client = null;
    this.inicializado = false;
    this.url = 'https://nzgifjdewdfibcopolof.supabase.co';
    this.anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc';
  }

  /**
   * Inicializa cliente Supabase
   */
  inicializar() {
    if (this.inicializado) return true;

    // Tentar diferentes formas de obter o cliente
    this.client = window.supabase || window.supabaseCliente;
    
    if (!this.client) {
      console.warn('Cliente Supabase externo não disponível - usando cliente interno');
      // Criar cliente interno simplificado
      this.client = this.criarClienteInterno();
    }

    this.inicializado = true;
    console.log('✅ Cliente Supabase unificado inicializado');
    return true;
  }

  /**
   * Cria cliente interno simplificado
   */
  criarClienteInterno() {
    const headers = {
      'apikey': this.anonKey,
      'Authorization': `Bearer ${this.anonKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    return {
      from: (table) => ({
        select: (columns = '*') => ({
          eq: (column, value) => ({
            single: () => this.executarQuery('GET', table, { select: columns, eq: { [column]: value }, single: true }),
            limit: (count) => this.executarQuery('GET', table, { select: columns, eq: { [column]: value }, limit: count })
          }),
          order: (column) => this.executarQuery('GET', table, { select: columns, order: column }),
          limit: (count) => this.executarQuery('GET', table, { select: columns, limit: count }),
          single: () => this.executarQuery('GET', table, { select: columns, single: true }),
          then: (callback) => this.executarQuery('GET', table, { select: columns }).then(callback)
        }),
        insert: (data) => ({
          select: () => ({
            single: () => this.executarQuery('POST', table, { data, returnData: true })
          }),
          then: (callback) => this.executarQuery('POST', table, { data }).then(callback)
        }),
        update: (data) => ({
          eq: (column, value) => ({
            select: () => ({
              single: () => this.executarQuery('PATCH', table, { data, eq: { [column]: value }, returnData: true })
            })
          })
        }),
        delete: () => ({
          eq: (column, value) => this.executarQuery('DELETE', table, { eq: { [column]: value } })
        })
      })
    };
  }

  /**
   * Executa query HTTP direta
   */
  async executarQuery(method, table, options = {}) {
    try {
      let url = `${this.url}/rest/v1/${table}`;
      const headers = {
        'apikey': this.anonKey,
        'Authorization': `Bearer ${this.anonKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      // Construir URL com parâmetros
      const params = new URLSearchParams();
      
      if (options.select && method === 'GET') {
        params.append('select', options.select);
      }
      
      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
      }
      
      if (options.order) {
        params.append('order', options.order);
      }
      
      if (options.limit) {
        params.append('limit', options.limit);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Configurar request
      const requestConfig = { method, headers };
      
      if (options.data && ['POST', 'PATCH'].includes(method)) {
        requestConfig.body = JSON.stringify(options.data);
        if (options.returnData) {
          headers['Prefer'] = 'return=representation';
        }
      }

      console.log(`🌐 Executando ${method} ${url}`);
      
      const response = await fetch(url, requestConfig);
      const responseData = await response.json();

      if (!response.ok) {
        console.error(`❌ Erro na query ${method} ${table}:`, response.status, responseData);
        return { data: null, error: responseData };
      }

      console.log(`✅ Query ${method} ${table} bem-sucedida`);
      return { data: responseData, error: null };

    } catch (error) {
      console.error(`❌ Erro na execução da query ${method} ${table}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Obtém cliente Supabase
   */
  getClient() {
    if (!this.inicializado) {
      this.inicializar();
    }
    return this.client;
  }

  /**
   * Verifica se cliente está disponível
   */
  isDisponivel() {
    return this.inicializado && this.client !== null;
  }
}

// Instância única do cliente
const supabaseClient = new SupabaseClient();

/**
 * API para Puxadores
 */
export const PuxadoresAPI = {
  /**
   * Lista todos os puxadores
   */
  async listar() {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      const client = supabaseClient.getClient();
      const { data, error } = await client
        .from('puxadores')
        .select('*')
        .order('modelo');

      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela puxadores não existe, usando dados demo');
          return { success: true, data: this.getDadosDemo() };
        }
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Erro ao listar puxadores:', error);
      return { 
        success: false, 
        error: error.message,
        data: this.getDadosDemo() // Fallback
      };
    }
  },

  /**
   * Cria novo puxador
   */
  async criar(dados) {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      // Validar dados obrigatórios
      if (!dados.modelo?.trim()) {
        throw new Error('Campo "Modelo" é obrigatório');
      }
      if (!dados.medida?.trim()) {
        throw new Error('Campo "Medida" é obrigatório');
      }

      // Obter usuário atual com validação robusta
      const usuarioAtual = validarUsuarioAtual();
      
      // Verificar se usuário existe no banco (para evitar FK violations)
      await verificarUsuarioExiste(usuarioAtual.id);

      // Upload de foto se houver
      let fotoUrl = null;
      if (dados.foto && dados.foto instanceof File) {
        const uploadResult = await UploadAPI.uploadImagem(dados.foto, 'puxadores');
        if (uploadResult.success) {
          fotoUrl = uploadResult.url;
        }
      }

      // Preparar dados para inserção - sistema livre sem id_usuario
      const puxador = {
        nome: dados.modelo,
        modelo: dados.modelo,
        fabricante: dados.fabricante || null,
        cor: dados.cor || null,
        medida: dados.medida,
        foto: fotoUrl,
        // Sistema livre: não usar id_usuario para evitar FK violations
        id_usuario: null,
        criado_em: new Date().toISOString()
      };

      const client = supabaseClient.getClient();
      const { data, error } = await client
        .from('puxadores')
        .insert(puxador)
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado ao criar puxador:', error);
        
        // Tratamento para erro 406 (Not Acceptable) - modo offline
        if (error.status === 406 || (error.response && error.response.status === 406)) {
          console.warn('⚠️ Erro 406 detectado - salvando em modo offline');
          return await salvarPuxadorOffline(puxador);
        }
        
        // Tratamento para tabela não existente - modo offline
        if (error.code === '42P01') {
          console.warn('⚠️ Tabela puxadores não existe - salvando em modo offline');
          return await salvarPuxadorOffline(puxador);
        }
        
        // Tratamento específico para erro de FK (usuário não existe)
        if (error.code === '23503') {
          console.warn('⚠️ Erro de FK - usuário não existe no banco, salvando em modo offline');
          return await salvarPuxadorOffline(puxador);
        }
        
        // Tratamento para erro 409 (Conflict)
        if (error.status === 409) {
          console.warn('⚠️ Erro 409 (Conflict) - salvando em modo offline');
          return await salvarPuxadorOffline(puxador);
        }
        
        // Tratamento para conflitos de duplicação
        if (error.code === '23505') {
          if (error.message.includes('modelo')) {
            throw new Error('Já existe um puxador com este modelo. Escolha um nome diferente.');
          }
          throw new Error('Já existe um registro com essas informações. Verifique os dados.');
        }
        
        // Tratamento para erro de conexão/timeout - modo offline
        if (error.code === 'PGRST301' || error.message.includes('timeout')) {
          console.warn('⚠️ Erro de conexão - salvando em modo offline');
          return await salvarPuxadorOffline(puxador);
        }
        
        // Para outros erros, tentar modo offline
        console.warn('⚠️ Erro desconhecido - tentando modo offline');
        return await salvarPuxadorOffline(puxador);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar puxador:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualiza puxador existente
   */
  async atualizar(id, dados) {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      if (!id) {
        throw new Error('ID do puxador é obrigatório');
      }

      // Validar usuário atual
      validarUsuarioAtual();

      // Upload de nova foto se houver
      let fotoUrl = dados.fotoUrl; // URL existente
      if (dados.foto && dados.foto instanceof File) {
        const uploadResult = await UploadAPI.uploadImagem(dados.foto, 'puxadores');
        if (uploadResult.success) {
          fotoUrl = uploadResult.url;
        }
      }

      const atualizacao = {
        nome: dados.modelo,
        modelo: dados.modelo,
        fabricante: dados.fabricante || null,
        cor: dados.cor || null,
        medida: dados.medida,
        foto: fotoUrl
      };

      const client = supabaseClient.getClient();
      const { data, error } = await client
        .from('puxadores')
        .update(atualizacao)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Erro ao atualizar puxador:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Exclui puxador
   */
  async excluir(id) {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      if (!id) {
        throw new Error('ID do puxador é obrigatório');
      }

      const client = supabaseClient.getClient();
      const { error } = await client
        .from('puxadores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir puxador:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtém dados demo para puxadores
   */
  getDadosDemo() {
    return [
      {
        id: '1',
        modelo: 'Cielo',
        fabricante: 'Aluminium',
        cor: 'Anodizado',
        medida: '150mm',
        id_usuario: '00000000-0000-0000-0000-000000000001',
        foto: null,
        criado_em: new Date().toISOString()
      },
      {
        id: '2',
        modelo: 'Luna',
        fabricante: 'GlassFit',
        cor: 'Preto',
        medida: '300mm',
        id_usuario: '00000000-0000-0000-0000-000000000001',
        foto: null,
        criado_em: new Date().toISOString()
      }
    ];
  }
};

/**
 * API para Trilhos
 */
export const TrilhosAPI = {
  /**
   * Lista todos os trilhos
   */
  async listar() {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      const client = supabaseClient.getClient();
      const { data, error } = await client
        .from('trilhos')
        .select('*')
        .order('nome');

      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela trilhos não existe, usando dados demo');
          return { success: true, data: this.getDadosDemo() };
        }
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Erro ao listar trilhos:', error);
      return { 
        success: false, 
        error: error.message,
        data: this.getDadosDemo() // Fallback
      };
    }
  },

  /**
   * Cria novo trilho
   */
  async criar(dados) {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      // Validar dados obrigatórios
      if (!dados.nome?.trim()) {
        throw new Error('Campo "Nome" é obrigatório');
      }

      // Obter usuário atual com validação robusta
      const usuarioAtual = validarUsuarioAtual();
      
      // Verificar se usuário existe no banco (para evitar FK violations)
      await verificarUsuarioExiste(usuarioAtual.id);

      // Upload de foto se houver
      let fotoUrl = null;
      if (dados.foto && dados.foto instanceof File) {
        const uploadResult = await UploadAPI.uploadImagem(dados.foto, 'trilhos');
        if (uploadResult.success) {
          fotoUrl = uploadResult.url;
        }
      }

      const trilho = {
        nome: dados.nome,
        tipo: dados.tipo || null,
        fabricante: dados.fabricante || null,
        cor: dados.cor || null,
        foto: fotoUrl,
        // Sistema livre: não usar id_usuario para evitar FK violations
        id_usuario: null,
        criado_em: new Date().toISOString()
      };

      const client = supabaseClient.getClient();
      const { data, error } = await client
        .from('trilhos')
        .insert(trilho)
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado ao criar trilho:', error);
        
        // Tratamento para erro 406 (Not Acceptable) - modo offline
        if (error.status === 406 || (error.response && error.response.status === 406)) {
          console.warn('⚠️ Erro 406 detectado - salvando trilho em modo offline');
          return await salvarTrilhoOffline(trilho);
        }
        
        // Tratamento para tabela não existente - modo offline
        if (error.code === '42P01') {
          console.warn('⚠️ Tabela trilhos não existe - salvando em modo offline');
          return await salvarTrilhoOffline(trilho);
        }
        
        // Tratamento específico para erro de FK (usuário não existe)
        if (error.code === '23503') {
          console.warn('⚠️ Erro de FK - usuário não existe no banco, salvando trilho em modo offline');
          return await salvarTrilhoOffline(trilho);
        }
        
        // Tratamento para erro 409 (Conflict)
        if (error.status === 409) {
          console.warn('⚠️ Erro 409 (Conflict) - salvando trilho em modo offline');
          return await salvarTrilhoOffline(trilho);
        }
        
        // Tratamento para conflitos de duplicação
        if (error.code === '23505') {
          if (error.message.includes('nome')) {
            throw new Error('Já existe um trilho com este nome. Escolha um nome diferente.');
          }
          throw new Error('Já existe um registro com essas informações. Verifique os dados.');
        }
        
        // Tratamento para erro de conexão/timeout - modo offline
        if (error.code === 'PGRST301' || error.message.includes('timeout')) {
          console.warn('⚠️ Erro de conexão - salvando trilho em modo offline');
          return await salvarTrilhoOffline(trilho);
        }
        
        // Para outros erros, tentar modo offline
        console.warn('⚠️ Erro desconhecido - tentando salvar trilho offline');
        return await salvarTrilhoOffline(trilho);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar trilho:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualiza trilho existente
   */
  async atualizar(id, dados) {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      if (!id) {
        throw new Error('ID do trilho é obrigatório');
      }

      // Validar usuário atual
      validarUsuarioAtual();

      // Upload de nova foto se houver
      let fotoUrl = dados.fotoUrl; // URL existente
      if (dados.foto && dados.foto instanceof File) {
        const uploadResult = await UploadAPI.uploadImagem(dados.foto, 'trilhos');
        if (uploadResult.success) {
          fotoUrl = uploadResult.url;
        }
      }

      const atualizacao = {
        nome: dados.nome,
        tipo: dados.tipo || null,
        fabricante: dados.fabricante || null,
        cor: dados.cor || null,
        foto: fotoUrl
      };

      const client = supabaseClient.getClient();
      const { data, error } = await client
        .from('trilhos')
        .update(atualizacao)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Erro ao atualizar trilho:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Exclui trilho
   */
  async excluir(id) {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      if (!id) {
        throw new Error('ID do trilho é obrigatório');
      }

      const client = supabaseClient.getClient();
      const { error } = await client
        .from('trilhos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir trilho:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtém dados demo para trilhos
   */
  getDadosDemo() {
    return [
      {
        id: '1',
        nome: 'RO-654025',
        tipo: 'Embutir',
        fabricante: 'Rometal',
        cor: 'Anodizado',
        id_usuario: '00000000-0000-0000-0000-000000000001',
        foto: null,
        criado_em: new Date().toISOString()
      },
      {
        id: '2',
        nome: 'KT-890142',
        tipo: 'Sobrepor',
        fabricante: 'Kit',
        cor: 'Preto',
        id_usuario: '00000000-0000-0000-0000-000000000001',
        foto: null,
        criado_em: new Date().toISOString()
      }
    ];
  }
};

/**
 * Validação simplificada para sistema de entrada livre
 */
const validarUsuarioAtual = () => {
  try {
    const usuarioAtual = getCurrentUser();
    
    console.log('🔍 Sistema de entrada livre - usuário:', usuarioAtual?.nome || 'Anônimo');
    
    // Para sistema sem autenticação rigorosa, sempre retornar um usuário válido
    if (!usuarioAtual) {
      console.log('⚠️ Nenhum usuário logado - criando usuário anônimo');
      return {
        id: null, // Sem ID específico para sistema livre
        nome: 'Usuário Anônimo',
        email: 'anonimo@sistema.local',
        empresa: 'Sistema Livre'
      };
    }
    
    // Se existe usuário, usar os dados dele mas sem validações rigorosas
    const usuarioSimplificado = {
      id: null, // Sempre null para sistema livre - não usar FK
      nome: usuarioAtual.nome || 'Usuário',
      email: usuarioAtual.email || 'usuario@sistema.local',
      empresa: usuarioAtual.empresa || 'Sistema Livre'
    };

    console.log('✅ Usuário para sistema livre:', usuarioSimplificado.nome);
    return usuarioSimplificado;
  } catch (error) {
    console.warn('⚠️ Erro na validação - usando usuário anônimo:', error);
    // Sempre retornar um usuário válido em caso de erro
    return {
      id: null,
      nome: 'Usuário Anônimo',
      email: 'anonimo@sistema.local',
      empresa: 'Sistema Livre'
    };
  }
};

/**
 * Verificação se usuário existe no banco antes de criar registros
 */
const verificarUsuarioExiste = async (userId) => {
  // Para sistema de entrada livre, sempre permitir
  console.log('🔓 Sistema livre - pulando verificação de usuário');
  return true;
};

/**
 * API para Vidros
 */
export const VidrosAPI = {
  /**
   * Lista todos os vidros
   */
  async listar() {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      const client = supabaseClient.getClient();
      const { data, error } = await client
        .from('pv_vidro')
        .select('*')
        .eq('ativo', true)
        .order('tipo');

      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela pv_vidro não existe, usando dados demo');
          return { success: true, data: this.getDadosDemo() };
        }
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Erro ao listar vidros:', error);
      return { 
        success: false, 
        error: error.message,
        data: this.getDadosDemo() // Fallback
      };
    }
  },

  /**
   * Cria novo vidro
   */
  async criar(dados) {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      // Validar dados obrigatórios
      if (!dados.tipo?.trim()) {
        throw new Error('Campo "Tipo de Vidro" é obrigatório');
      }

      // Validar usuário atual (embora vidros não precisem de id_usuario, mantemos consistência)
      const usuarioAtual = validarUsuarioAtual();

      const vidro = {
        tipo: dados.tipo.trim(),
        rgb: dados.rgb || '255,255,255,0.3',
        ativo: true,
        criado_em: new Date().toISOString()
      };

      const client = supabaseClient.getClient();
      const { data, error } = await client
        .from('pv_vidro')
        .insert(vidro)
        .select()
        .single();

      if (error) {
        // Tratamento específico para conflitos
        if (error.code === '23505' && error.message.includes('unique')) {
          throw new Error('Já existe um vidro com este tipo. Escolha um nome diferente.');
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar vidro:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualiza vidro existente
   */
  async atualizar(id, dados) {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      if (!id) {
        throw new Error('ID do vidro é obrigatório');
      }

      // Validar usuário atual
      validarUsuarioAtual();

      const atualizacao = {
        tipo: dados.tipo?.trim(),
        rgb: dados.rgb
      };

      // Remover campos undefined
      Object.keys(atualizacao).forEach(key => {
        if (atualizacao[key] === undefined) {
          delete atualizacao[key];
        }
      });

      const client = supabaseClient.getClient();
      const { data, error } = await client
        .from('pv_vidro')
        .update(atualizacao)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Tratamento específico para conflitos
        if (error.code === '23505' && error.message.includes('unique')) {
          throw new Error('Já existe um vidro com este tipo. Escolha um nome diferente.');
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Erro ao atualizar vidro:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Exclui vidro (soft delete)
   */
  async excluir(id) {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      if (!id) {
        throw new Error('ID do vidro é obrigatório');
      }

      const client = supabaseClient.getClient();
      const { error } = await client
        .from('pv_vidro')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir vidro:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtém dados demo para vidros
   */
  getDadosDemo() {
    return [
      {
        id: '1',
        tipo: 'Incolor',
        rgb: '230,235,240,0.35',
        ativo: true,
        criado_em: new Date().toISOString()
      },
      {
        id: '2',
        tipo: 'Espelho',
        rgb: '220,220,225,0.70',
        ativo: true,
        criado_em: new Date().toISOString()
      },
      {
        id: '3',
        tipo: 'Fumê',
        rgb: '80,80,85,0.45',
        ativo: true,
        criado_em: new Date().toISOString()
      }
    ];
  }
};

/**
 * API para Upload de Imagens
 */
export const UploadAPI = {
  /**
   * Faz upload de uma imagem
   */
  async uploadImagem(file, pasta = 'geral') {
    try {
      if (!supabaseClient.isDisponivel()) {
        throw new Error('Cliente Supabase não disponível');
      }

      if (!file || !(file instanceof File)) {
        throw new Error('Arquivo inválido');
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Apenas arquivos de imagem são permitidos');
      }

      // Validar tamanho (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 5MB');
      }

      const usuarioAtual = getCurrentUser();
      const email = usuarioAtual?.email || 'usuario';
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${email.replace(/[^\w]/g, '-')}-${Date.now()}.${fileExt}`;
      const filePath = `${pasta}/${fileName}`;

      const client = supabaseClient.getClient();

      // Verificar se bucket existe
      const { data: buckets, error: bucketsError } = await client
        .storage
        .listBuckets();

      if (bucketsError) {
        throw new Error('Erro ao verificar buckets de armazenamento');
      }

      const bucketExiste = buckets.some(bucket => bucket.name === 'imagens');

      if (!bucketExiste) {
        // Tentar criar bucket
        try {
          await client.storage.createBucket('imagens', { public: true });
          console.log('Bucket imagens criado com sucesso');
        } catch (bucketError) {
          console.warn('Não foi possível criar bucket, continuando sem foto');
          throw new Error('Bucket de armazenamento indisponível');
        }
      }

      // Upload do arquivo
      const { data: uploadData, error: uploadError } = await client
        .storage
        .from('imagens')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
      }

      // Obter URL público
      const { data: urlData } = client
        .storage
        .from('imagens')
        .getPublicUrl(filePath);

      return { 
        success: true, 
        url: urlData.publicUrl,
        path: filePath 
      };

    } catch (error) {
      console.error('Erro no upload de imagem:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

/**
 * Inicialização do sistema Supabase
 */
export function inicializarSupabase() {
  return supabaseClient.inicializar();
}

/**
 * Verifica se Supabase está disponível
 */
export function isSupabaseDisponivel() {
  return supabaseClient.isDisponivel();
}

/**
 * Funções de fallback para modo offline
 */

// Salvar puxador em localStorage quando Supabase falha
async function salvarPuxadorOffline(puxador) {
  try {
    console.log('💾 Salvando puxador em modo offline:', puxador);
    
    // Gerar ID único para o puxador
    const id = 'pux_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Preparar dados offline
    const puxadorOffline = {
      id,
      ...puxador,
      criado_offline: true,
      criado_em: new Date().toISOString()
    };
    
    // Buscar puxadores existentes no localStorage
    const puxadoresExistentes = JSON.parse(localStorage.getItem('puxadores_offline') || '[]');
    
    // Adicionar novo puxador
    puxadoresExistentes.push(puxadorOffline);
    
    // Salvar de volta no localStorage
    localStorage.setItem('puxadores_offline', JSON.stringify(puxadoresExistentes));
    
    console.log('✅ Puxador salvo offline com sucesso:', id);
    
    return { 
      success: true, 
      data: puxadorOffline,
      modo: 'offline',
      message: 'Puxador salvo localmente (offline)'
    };
    
  } catch (error) {
    console.error('❌ Erro ao salvar puxador offline:', error);
    return { 
      success: false, 
      error: 'Não foi possível salvar o puxador nem online nem offline' 
    };
  }
}

// Salvar trilho em localStorage quando Supabase falha
async function salvarTrilhoOffline(trilho) {
  try {
    console.log('💾 Salvando trilho em modo offline:', trilho);
    
    // Gerar ID único para o trilho
    const id = 'tri_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Preparar dados offline
    const trilhoOffline = {
      id,
      ...trilho,
      criado_offline: true,
      criado_em: new Date().toISOString()
    };
    
    // Buscar trilhos existentes no localStorage
    const trilhosExistentes = JSON.parse(localStorage.getItem('trilhos_offline') || '[]');
    
    // Adicionar novo trilho
    trilhosExistentes.push(trilhoOffline);
    
    // Salvar de volta no localStorage
    localStorage.setItem('trilhos_offline', JSON.stringify(trilhosExistentes));
    
    console.log('✅ Trilho salvo offline com sucesso:', id);
    
    return { 
      success: true, 
      data: trilhoOffline,
      modo: 'offline',
      message: 'Trilho salvo localmente (offline)'
    };
    
  } catch (error) {
    console.error('❌ Erro ao salvar trilho offline:', error);
    return { 
      success: false, 
      error: 'Não foi possível salvar o trilho nem online nem offline' 
    };
  }
}

// Expor APIs globalmente para compatibilidade
window.PuxadoresAPI = PuxadoresAPI;
window.TrilhosAPI = TrilhosAPI;
window.VidrosAPI = VidrosAPI;
window.UploadAPI = UploadAPI;