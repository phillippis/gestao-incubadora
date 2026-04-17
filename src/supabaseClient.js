// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Substitua com suas credenciais do Supabase
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sua-chave-anonima';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== FUNÇÕES DE AUTENTICAÇÃO ====================

export const autenticar = async (email, senha) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    console.log('data:', data);
    console.log('error:', error);

    if (error) throw error;
    return { sucesso: true, usuario: data.user, erro: null };
  } catch (erro) {
    console.log('erro catch:', erro);
    return { sucesso: false, usuario: null, erro: erro.message };
  }
};

export const registrar = async (email, senha, nome) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });
    
    if (error) throw error;

    // Criar registro na tabela usuarios_sistema
    const { error: erroUsuario } = await supabase
      .from('usuarios_sistema')
      .insert([
        {
          email,
          nome,
          role: 'operador',
          ativo: true,
        },
      ]);

    if (erroUsuario) throw erroUsuario;

    return { sucesso: true, usuario: data.user, erro: null };
  } catch (erro) {
    return { sucesso: false, usuario: null, erro: erro.message };
  }
};

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const obterUsuarioAtual = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { sucesso: true, usuario: data.user, erro: null };
  } catch (erro) {
    return { sucesso: false, usuario: null, erro: erro.message };
  }
};

// ==================== FUNÇÕES DE EMPRESAS ====================

export const listarEmpresas = async (filtros = {}) => {
  try {
    let query = supabase
      .from('empresas_com_boxes')
      .select('*');

    if (filtros.atividade) {
      query = query.eq('atividade', filtros.atividade);
    }

    if (filtros.busca) {
      query = query.or(`nome_empresa.ilike.%${filtros.busca}%,cnpj.ilike.%${filtros.busca}%`);
    }

    const { data, error } = await query.order('nome_empresa');

    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const obterEmpresa = async (id) => {
  try {
    // Obter dados da empresa
    const { data: empresa, error: erroEmpresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();

    if (erroEmpresa) throw erroEmpresa;

    // Obter boxes
    const { data: boxes, error: erroBoxes } = await supabase
      .from('boxes')
      .select('*')
      .eq('empresa_id', id);

    if (erroBoxes) throw erroBoxes;

    // Obter documentos
    const { data: documentos, error: erroDoc } = await supabase
      .from('documentos')
      .select('*')
      .eq('empresa_id', id);

    if (erroDoc) throw erroDoc;

    // Obter obrigações
    const { data: obrigacoes, error: erroObr } = await supabase
      .from('obrigacoes')
      .select('*')
      .eq('empresa_id', id);

    if (erroObr) throw erroObr;

    return {
      sucesso: true,
      dados: {
        ...empresa,
        boxes,
        documentos,
        obrigacoes,
      },
      erro: null,
    };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const criarEmpresa = async (empresaData, usuarioEmail) => {
  try {
    // Inserir empresa
    const { data: empresa, error: erroEmpresa } = await supabase
      .from('empresas')
      .insert([
        {
          nome_empresa: empresaData.nomeEmpresa,
          cnpj: empresaData.cnpj,
          inscricao_municipal: empresaData.inscricaoMunicipal,
          telefone_principal: empresaData.telefonePrincipal,
          telefone_secundario: empresaData.telefoneSecundario,
          numero_funcionarios: empresaData.numeroFuncionarios,
          atividade: empresaData.atividade,
          email_empresa: empresaData.email || null,
          porte: empresaData.porte || null,
          email_ultima_manutencao: usuarioEmail,
        },
      ])
      .select()
      .single();

    if (erroEmpresa) throw erroEmpresa;

    // Inserir boxes
    if (empresaData.boxes && empresaData.boxes.length > 0) {
      const boxesInsert = empresaData.boxes.map((box) => ({
        numero: parseInt(box.numero),
        empresa_id: empresa.id,
        data_entrada: box.dataEntrada,
        ativo: true,
      }));

      const { error: erroBoxes } = await supabase
        .from('boxes')
        .insert(boxesInsert);

      if (erroBoxes) throw erroBoxes;
    }

    // Inserir obrigações padrão se forem passadas
    if (empresaData.obrigacoes && empresaData.obrigacoes.length > 0) {
      const obrigacoesInsert = empresaData.obrigacoes.map((obr) => ({
        empresa_id: empresa.id,
        descricao: obr.descricao,
        tipo: obr.tipo,
        status: false,
        usuario_email_criacao: usuarioEmail,
      }));

      const { error: erroObr } = await supabase
        .from('obrigacoes')
        .insert(obrigacoesInsert);

      if (erroObr) throw erroObr;
    }

    return { sucesso: true, dados: empresa, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const atualizarEmpresa = async (id, empresaData, usuarioEmail) => {
  try {
    const { error } = await supabase
      .from('empresas')
      .update({
        nome_empresa: empresaData.nomeEmpresa,
        cnpj: empresaData.cnpj,
        inscricao_municipal: empresaData.inscricaoMunicipal,
        telefone_principal: empresaData.telefonePrincipal,
        telefone_secundario: empresaData.telefoneSecundario,
        numero_funcionarios: empresaData.numeroFuncionarios,
        atividade: empresaData.atividade,
        email_empresa: empresaData.email || null,
        porte: empresaData.porte || null,
        email_ultima_manutencao: usuarioEmail,
      })
      .eq('id', id);

    if (error) throw error;

    // Atualizar boxes se fornecidos
    if (empresaData.boxes) {
      // Deletar boxes antigos
      const { error: erroDel } = await supabase
        .from('boxes')
        .delete()
        .eq('empresa_id', id);

      if (erroDel) throw erroDel;

      // Inserir novos boxes
      const boxesInsert = empresaData.boxes.map((box) => ({
        numero: parseInt(box.numero),
        empresa_id: id,
        data_entrada: box.dataEntrada,
        ativo: true,
      }));

      const { error: erroBoxes } = await supabase
        .from('boxes')
        .insert(boxesInsert);

      if (erroBoxes) throw erroBoxes;
    }

    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const desativarEmpresa = async (id, usuarioEmail, motivo = '') => {
  try {
    // Obter empresa antes de desativar (para snapshot)
    const { data: empresa, error: erroObter } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();

    if (erroObter) throw erroObter;

    // Obter boxes da empresa
    const { data: boxes, error: erroBoxes } = await supabase
      .from('boxes')
      .select('numero')
      .eq('empresa_id', id)
      .eq('ativo', true);

    if (erroBoxes) throw erroBoxes;

    // Atualizar empresa para ativa = false
    const { error: erroAtualizacao } = await supabase
      .from('empresas')
      .update({
        ativa: false,
        email_ultima_manutencao: usuarioEmail,
      })
      .eq('id', id);

    if (erroAtualizacao) throw erroAtualizacao;

    // Desativar boxes
    const { error: erroDesativarBoxes } = await supabase
      .from('boxes')
      .update({
        ativo: false,
        data_saida: new Date().toISOString().split('T')[0],
      })
      .eq('empresa_id', id);

    if (erroDesativarBoxes) throw erroDesativarBoxes;

    // Registrar na tabela de desativadas
    const { error: erroDesativada } = await supabase
      .from('empresas_desativadas')
      .insert([
        {
          empresa_id: id,
          nome_empresa: empresa.nome_empresa,
          cnpj: empresa.cnpj,
          data_saida: new Date().toISOString().split('T')[0],
          usuario_email: usuarioEmail,
          motivo_desativacao: motivo,
          boxes_ocupados: boxes.map((b) => b.numero).join(', '),
          dados_empresa: empresa,
        },
      ]);

    if (erroDesativada) throw erroDesativada;

    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const reativarEmpresa = async (id, usuarioEmail) => {
  try {
    // Obter dados da empresa desativada
    const { error: erroObter } = await supabase
      .from('empresas_desativadas')
      .select('dados_empresa')
      .eq('empresa_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (erroObter) throw erroObter;

    // Reativar empresa
    const { error: erroReativar } = await supabase
      .from('empresas')
      .update({
        ativa: true,
        email_ultima_manutencao: usuarioEmail,
      })
      .eq('id', id);

    if (erroReativar) throw erroReativar;

    // Reativar boxes
    const { error: erroBoxes } = await supabase
      .from('boxes')
      .update({
        ativo: true,
        data_saida: null,
      })
      .eq('empresa_id', id);

    if (erroBoxes) throw erroBoxes;

    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const listarEmpresasDesativadas = async () => {
  try {
    const { data, error } = await supabase
      .from('empresas_desativadas')
      .select('*')
      .order('data_desativacao', { ascending: false });

    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

// ==================== FUNÇÕES DE OBRIGAÇÕES ====================

export const criarObrigacao = async (obrigacaoData, usuarioEmail) => {
  try {
    const { error } = await supabase
      .from('obrigacoes')
      .insert([
        {
          empresa_id: obrigacaoData.empresaId,
          descricao: obrigacaoData.descricao,
          tipo: obrigacaoData.tipo,
          subtipo: obrigacaoData.subtipo,
          data_vencimento: obrigacaoData.dataVencimento,
          mes_referencia: obrigacaoData.mesReferencia,
          ano_referencia: obrigacaoData.anoReferencia,
          usuario_email_criacao: usuarioEmail,
          aplicavel_todas_empresas: obrigacaoData.aplicavelTodas || false,
        },
      ]);

    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const atualizarObrigacao = async (id, obrigacaoData, usuarioEmail) => {
  try {
    const updateData = {
      descricao: obrigacaoData.descricao,
      tipo: obrigacaoData.tipo,
      subtipo: obrigacaoData.subtipo,
      data_vencimento: obrigacaoData.dataVencimento,
      status: obrigacaoData.status,
    };

    if (obrigacaoData.status && !obrigacaoData.dataCumprimento) {
      updateData.data_cumprimento = new Date().toISOString();
      updateData.usuario_email_cumprimento = usuarioEmail;
    }

    const { error } = await supabase
      .from('obrigacoes')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const obterObrigacoes = async (empresaId = null) => {
  try {
    let query = supabase.from('obrigacoes').select('*');

    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }

    const { data, error } = await query.order('data_vencimento');

    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

// ==================== FUNÇÕES DE DOCUMENTOS ====================

export const uploadDocumento = async (empresaId, file, usuarioEmail) => {
  try {
    const nomeArquivo = `${empresaId}/${Date.now()}_${file.name}`;

    // Upload para storage
    const { error: erroUpload } = await supabase.storage
      .from('documentos-incubadora')
      .upload(nomeArquivo, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (erroUpload) throw erroUpload;

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('documentos-incubadora')
      .getPublicUrl(nomeArquivo);

    // Registrar no banco de dados
    const { data, error: erroDb } = await supabase
      .from('documentos')
      .insert([
        {
          empresa_id: empresaId,
          nome_arquivo: file.name,
          tipo: file.type,
          url_storage: urlData.publicUrl,
          bucket_path: nomeArquivo,
          tamanho_bytes: file.size,
          usuario_email: usuarioEmail,
        },
      ])
      .select()
      .single();

    if (erroDb) throw erroDb;

    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const listarDocumentos = async (empresaId) => {
  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data_upload', { ascending: false });

    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const deletarDocumento = async (id, caminhoStorage) => {
  try {
    // Deletar do storage
    const { error: erroDel } = await supabase.storage
      .from('documentos-incubadora')
      .remove([caminhoStorage]);

    if (erroDel) throw erroDel;

    // Deletar do banco de dados
    const { error: erroDb } = await supabase
      .from('documentos')
      .delete()
      .eq('id', id);

    if (erroDb) throw erroDb;

    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

// ==================== FUNÇÕES DE DASHBOARD ====================

export const obterKpis = async () => {
  try {
    const { data, error } = await supabase
      .from('dashboard_kpis')
      .select('*')
      .single();

    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const obterTempoIncubadora = async () => {
  try {
    const { data, error } = await supabase
      .from('empresas_tempo_incubadora')
      .select('*');

    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const obterEmpresasPorAtividade = async () => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('atividade, COUNT(*)')
      .eq('ativa', true)
      .group_by('atividade')
      .order('count', { ascending: false });

    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

// ==================== FUNÇÕES DE AUDITORIA ====================

export const obterAuditoria = async (filtros = {}) => {
  try {
    let query = supabase.from('auditoria').select('*');

    if (filtros.usuarioEmail) {
      query = query.eq('usuario_email', filtros.usuarioEmail);
    }

    if (filtros.tabela) {
      query = query.eq('tabela', filtros.tabela);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

// ==================== FUNÇÕES DE REALTIME ====================

export const inscreverEmpresasAtualizacoes = (callback) => {
  return supabase
    .channel('empresas-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'empresas' },
      (payload) => callback(payload)
    )
    .subscribe();
};

export const inscreverObrigacoesAtualizacoes = (callback) => {
  return supabase
    .channel('obrigacoes-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'obrigacoes' },
      (payload) => callback(payload)
    )
    .subscribe();
};

// ==================== FUNÇÕES DE BOXES CADASTRO ====================

export const listarBoxesCadastro = async () => {
  try {
    const { data, error } = await supabase
      .from('boxes_cadastro')
      .select('*')
      .eq('ativo', true)
      .order('numero');
    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: [], erro: erro.message };
  }
};

export const criarBoxCadastro = async (dados) => {
  try {
    const { data, error } = await supabase
      .from('boxes_cadastro')
      .insert([{ numero: dados.numero, endereco: dados.endereco, observacoes: dados.observacoes, incubadora_id: dados.incubadoraId || null, ativo: true }])
      .select().single();
    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const atualizarBoxCadastro = async (id, dados) => {
  try {
    const { error } = await supabase
      .from('boxes_cadastro')
      .update({ numero: dados.numero, endereco: dados.endereco, observacoes: dados.observacoes, incubadora_id: dados.incubadoraId || null })
      .eq('id', id);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const excluirBoxCadastro = async (id) => {
  try {
    const { error } = await supabase
      .from('boxes_cadastro')
      .update({ ativo: false })
      .eq('id', id);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

// ==================== FUNÇÕES DE CONTROLES ====================

export const listarControlesTipos = async () => {
  try {
    const { data, error } = await supabase
      .from('controles_tipos')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: [], erro: erro.message };
  }
};

export const criarControleTipo = async (dados, usuarioEmail) => {
  try {
    const { data, error } = await supabase
      .from('controles_tipos')
      .insert([{
        categoria: dados.categoria,
        nome: dados.nome,
        mes_referencia: dados.mesReferencia || null,
        nome_capacitacao: dados.nomeCapacitacao || null,
        tipo_notificacao: dados.tipoNotificacao || null,
        para_todos: dados.paraTodos || false,
        ativo: true,
        criado_por: usuarioEmail,
      }])
      .select().single();
    if (error) throw error;

    // Se for para todos, criar controle_empresa para cada empresa ativa
    if (dados.paraTodos) {
      const { data: empresas } = await supabase
        .from('empresas')
        .select('id')
        .eq('ativa', true);
      if (empresas && empresas.length > 0) {
        const inserts = empresas.map(e => ({
          empresa_id: e.id,
          controle_tipo_id: data.id,
          status: 'pendente',
        }));
        await supabase.from('controles_empresas').insert(inserts);
      }
    }

    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const excluirControleTipo = async (id) => {
  try {
    // Excluir controles de empresas vinculados
    await supabase.from('controles_empresas').delete().eq('controle_tipo_id', id);
    const { error } = await supabase
      .from('controles_tipos')
      .update({ ativo: false })
      .eq('id', id);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const listarControlesEmpresa = async (empresaId) => {
  try {
    const { data, error } = await supabase
      .from('controles_empresas')
      .select('*, controles_tipos(*)')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: [], erro: erro.message };
  }
};

export const adicionarControleEmpresa = async (empresaId, controleTipoId, usuarioEmail) => {
  try {
    const { data, error } = await supabase
      .from('controles_empresas')
      .insert([{ empresa_id: empresaId, controle_tipo_id: controleTipoId, status: 'pendente', atualizado_por: usuarioEmail }])
      .select('*, controles_tipos(*)').single();
    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const atualizarStatusControle = async (id, status, usuarioEmail) => {
  try {
    const { error } = await supabase
      .from('controles_empresas')
      .update({ status, atualizado_por: usuarioEmail, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const excluirControleEmpresa = async (id) => {
  try {
    const { error } = await supabase.from('controles_empresas').delete().eq('id', id);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const listarEmpresasComPendencias = async () => {
  try {
    const { data, error } = await supabase
      .from('controles_empresas')
      .select('empresa_id')
      .eq('status', 'pendente');
    if (error) throw error;
    const ids = [...new Set((data || []).map(d => d.empresa_id))];
    return { sucesso: true, dados: ids, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: [], erro: erro.message };
  }
};

export const listarControlesEmpresaPorTipo = async (controleTipoId) => {
  try {
    const { data, error } = await supabase
      .from('controles_empresas')
      .select('*, empresas(nome_empresa, boxes_numeros)')
      .eq('controle_tipo_id', controleTipoId)
      .order('created_at');
    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: [], erro: erro.message };
  }
};

// ==================== FUNÇÕES DE INCUBADORAS ====================

export const listarIncubadoras = async () => {
  try {
    const { data, error } = await supabase
      .from('incubadoras')
      .select('*')
      .eq('ativo', true)
      .order('numero');
    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: [], erro: erro.message };
  }
};

export const criarIncubadora = async (dados) => {
  try {
    const { data, error } = await supabase
      .from('incubadoras')
      .insert([{ numero: dados.numero, endereco: dados.endereco, observacoes: dados.observacoes, ativo: true }])
      .select().single();
    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const atualizarIncubadora = async (id, dados) => {
  try {
    const { error } = await supabase
      .from('incubadoras')
      .update({ numero: dados.numero, endereco: dados.endereco, observacoes: dados.observacoes })
      .eq('id', id);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const excluirIncubadora = async (id) => {
  try {
    const { error } = await supabase
      .from('incubadoras')
      .update({ ativo: false })
      .eq('id', id);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

// ==================== GESTÃO DE BOXES DA EMPRESA ====================

export const listarBoxesDeEmpresa = async (empresaId) => {
  try {
    const { data, error } = await supabase
      .from('boxes')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('numero');
    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: [], erro: erro.message };
  }
};

export const alterarBoxEmpresa = async (boxId, novoNumero) => {
  try {
    const { error } = await supabase
      .from('boxes')
      .update({ numero: novoNumero })
      .eq('id', boxId);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const removerBoxEmpresa = async (boxId) => {
  try {
    const { error } = await supabase
      .from('boxes')
      .update({ ativo: false, data_saida: new Date().toISOString().split('T')[0] })
      .eq('id', boxId);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const adicionarBoxEmpresa = async (empresaId, numero) => {
  try {
    const { error } = await supabase
      .from('boxes')
      .insert([{ empresa_id: empresaId, numero, data_entrada: new Date().toISOString().split('T')[0], ativo: true }]);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

// ==================== FUNÇÕES DE FILA DE ESPERA ====================

export const listarFilaEspera = async () => {
  try {
    const { data, error } = await supabase
      .from('fila_espera')
      .select('*')
      .eq('status', 'aguardando')
      .order('data_entrada_fila');
    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: [], erro: erro.message };
  }
};

export const criarFilaEspera = async (dados, usuarioEmail) => {
  try {
    const { data, error } = await supabase
      .from('fila_espera')
      .insert([{
        nome_empresa: dados.nomeEmpresa,
        cnpj: dados.cnpj || null,
        telefone_principal: dados.telefonePrincipal || null,
        telefone_secundario: dados.telefoneSecundario || null,
        email_empresa: dados.email || null,
        atividade: dados.atividade || null,
        porte: dados.porte || null,
        numero_funcionarios: dados.numeroFuncionarios ? parseInt(dados.numeroFuncionarios) : null,
        inscricao_municipal: dados.inscricaoMunicipal || null,
        data_entrada_fila: dados.dataEntradaFila,
        observacoes: dados.observacoes || null,
        status: 'aguardando',
        criado_por: usuarioEmail,
      }])
      .select().single();
    if (error) throw error;
    return { sucesso: true, dados: data, erro: null };
  } catch (erro) {
    return { sucesso: false, dados: null, erro: erro.message };
  }
};

export const atualizarFilaEspera = async (id, dados, usuarioEmail) => {
  try {
    const { error } = await supabase
      .from('fila_espera')
      .update({
        nome_empresa: dados.nomeEmpresa,
        cnpj: dados.cnpj || null,
        telefone_principal: dados.telefonePrincipal || null,
        telefone_secundario: dados.telefoneSecundario || null,
        email_empresa: dados.email || null,
        atividade: dados.atividade || null,
        porte: dados.porte || null,
        numero_funcionarios: dados.numeroFuncionarios ? parseInt(dados.numeroFuncionarios) : null,
        inscricao_municipal: dados.inscricaoMunicipal || null,
        data_entrada_fila: dados.dataEntradaFila,
        observacoes: dados.observacoes || null,
      })
      .eq('id', id);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};

export const excluirFilaEspera = async (id) => {
  try {
    const { error } = await supabase
      .from('fila_espera')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { sucesso: true, erro: null };
  } catch (erro) {
    return { sucesso: false, erro: erro.message };
  }
};
