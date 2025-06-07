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
  }

  /**
   * Inicializa cliente Supabase
   */
  inicializar() {
    if (this.inicializado) return true;

    // Tentar diferentes formas de obter o cliente
    this.client = window.supabase || window.supabaseCliente;
    
    if (!this.client) {
      console.warn('Cliente Supabase não disponível');
      return false;
    }

    this.inicializado = true;
    console.log('✅ Cliente Supabase unificado inicializado');
    return true;
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

      // Preparar dados para inserção
      const puxador = {
        nome: dados.modelo,
        modelo: dados.modelo,
        fabricante: dados.fabricante || null,
        cor: dados.cor || null,
        medida: dados.medida,
        foto: fotoUrl,
        id_usuario: usuarioAtual.id,
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
        
        // Tratamento específico para erro de FK
        if (error.code === '23503' && error.message.includes('puxadores_id_usuario_fkey')) {
          throw new Error('Seu usuário não foi encontrado no sistema. Faça logout e login novamente.');
        }
        
        // Tratamento para conflitos de duplicação
        if (error.code === '23505') {
          if (error.message.includes('modelo')) {
            throw new Error('Já existe um puxador com este modelo. Escolha um nome diferente.');
          }
          throw new Error('Já existe um registro com essas informações. Verifique os dados.');
        }
        
        // Tratamento para erro de conexão/timeout
        if (error.code === 'PGRST301' || error.message.includes('timeout')) {
          throw new Error('Erro de conexão com o servidor. Tente novamente.');
        }
        
        throw error;
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
        id_usuario: usuarioAtual.id,
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
        
        // Tratamento específico para erro de FK
        if (error.code === '23503' && error.message.includes('trilhos_id_usuario_fkey')) {
          throw new Error('Seu usuário não foi encontrado no sistema. Faça logout e login novamente.');
        }
        
        // Tratamento para conflitos de duplicação
        if (error.code === '23505') {
          if (error.message.includes('nome')) {
            throw new Error('Já existe um trilho com este nome. Escolha um nome diferente.');
          }
          throw new Error('Já existe um registro com essas informações. Verifique os dados.');
        }
        
        // Tratamento para erro de conexão/timeout
        if (error.code === 'PGRST301' || error.message.includes('timeout')) {
          throw new Error('Erro de conexão com o servidor. Tente novamente.');
        }
        
        throw error;
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
 * Validação robusta de usuário para todas as APIs
 */
const validarUsuarioAtual = () => {
  const usuarioAtual = getCurrentUser();
  
  console.log('🔍 Validando usuário:', {
    usuario: usuarioAtual,
    id: usuarioAtual?.id,
    tipo: typeof usuarioAtual?.id
  });
  
  // Validações robustas do usuário para corrigir erro de constraint
  if (!usuarioAtual) {
    console.error('❌ Usuário não encontrado');
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }
  
  if (!usuarioAtual.id) {
    console.error('❌ ID de usuário ausente');
    throw new Error('ID de usuário inválido. Faça logout e login novamente.');
  }
  
  // Verificar se é ID temporário (causa comum do erro)
  if (usuarioAtual.id.toString().startsWith('temp-')) {
    console.error('❌ ID temporário detectado:', usuarioAtual.id);
    throw new Error('ID de usuário temporário. Faça logout e login novamente.');
  }
  
  // Verificar formato UUID básico (para evitar violação de FK)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(usuarioAtual.id)) {
    console.error('❌ Formato UUID inválido:', usuarioAtual.id);
    throw new Error('Formato de ID de usuário inválido. Faça logout e login novamente.');
  }

  console.log('✅ Usuário validado com sucesso:', usuarioAtual.id);
  return usuarioAtual;
};

/**
 * Verificação se usuário existe no banco antes de criar registros
 */
const verificarUsuarioExiste = async (userId) => {
  try {
    console.log('🔍 Verificando se usuário existe no banco:', userId);
    
    const client = supabaseClient.getClient();
    const { data, error } = await client
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .single();

    console.log('📊 Resultado da verificação:', { data, error });

    if (error) {
      if (error.code === 'PGRST116') {
        console.error('❌ Usuário não encontrado na tabela usuarios');
        throw new Error('Usuário não encontrado no sistema. Faça logout e login novamente.');
      }
      throw error;
    }

    if (!data) {
      console.error('❌ Nenhum dado retornado para o usuário');
      throw new Error('Usuário não encontrado no sistema. Faça logout e login novamente.');
    }

    console.log('✅ Usuário existe no banco:', data.id);
    return true;
  } catch (error) {
    console.error('💥 Erro ao verificar usuário:', error);
    throw new Error(`Não foi possível verificar usuário no sistema: ${error.message}`);
  }
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

// Expor APIs globalmente para compatibilidade
window.PuxadoresAPI = PuxadoresAPI;
window.TrilhosAPI = TrilhosAPI;
window.VidrosAPI = VidrosAPI;
window.UploadAPI = UploadAPI;