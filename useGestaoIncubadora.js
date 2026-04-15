// useGestaoIncubadora.js
import { useState, useCallback, useEffect } from 'react';
import * as API from './supabaseClient';

/**
 * Hook para gerenciar empresas
 */
export const useEmpresas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (filtros = {}) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.listarEmpresas(filtros);
      if (resultado.sucesso) {
        setEmpresas(resultado.dados);
      } else {
        setErro(resultado.erro);
      }
    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  const criar = useCallback(async (dados, usuarioEmail) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.criarEmpresa(dados, usuarioEmail);
      if (resultado.sucesso) {
        await carregar();
        return resultado.dados;
      } else {
        setErro(resultado.erro);
        return null;
      }
    } catch (erro) {
      setErro(erro.message);
      return null;
    } finally {
      setCarregando(false);
    }
  }, [carregar]);

  const atualizar = useCallback(async (id, dados, usuarioEmail) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.atualizarEmpresa(id, dados, usuarioEmail);
      if (resultado.sucesso) {
        await carregar();
        return true;
      } else {
        setErro(resultado.erro);
        return false;
      }
    } catch (erro) {
      setErro(erro.message);
      return false;
    } finally {
      setCarregando(false);
    }
  }, [carregar]);

  const desativar = useCallback(async (id, usuarioEmail) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.desativarEmpresa(id, usuarioEmail);
      if (resultado.sucesso) {
        await carregar();
        return true;
      } else {
        setErro(resultado.erro);
        return false;
      }
    } catch (erro) {
      setErro(erro.message);
      return false;
    } finally {
      setCarregando(false);
    }
  }, [carregar]);

  return { empresas, carregando, erro, carregar, criar, atualizar, desativar };
};

/**
 * Hook para gerenciar obrigações
 */
export const useObrigacoes = () => {
  const [obrigacoes, setObrigacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (empresaId = null) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.obterObrigacoes(empresaId);
      if (resultado.sucesso) {
        setObrigacoes(resultado.dados);
      } else {
        setErro(resultado.erro);
      }
    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  const criar = useCallback(async (dados, usuarioEmail) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.criarObrigacao(dados, usuarioEmail);
      if (resultado.sucesso) {
        await carregar(dados.empresaId);
        return true;
      } else {
        setErro(resultado.erro);
        return false;
      }
    } catch (erro) {
      setErro(erro.message);
      return false;
    } finally {
      setCarregando(false);
    }
  }, [carregar]);

  const atualizar = useCallback(async (id, dados, usuarioEmail) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.atualizarObrigacao(id, dados, usuarioEmail);
      if (resultado.sucesso) {
        return true;
      } else {
        setErro(resultado.erro);
        return false;
      }
    } catch (erro) {
      setErro(erro.message);
      return false;
    } finally {
      setCarregando(false);
    }
  }, []);

  return { obrigacoes, carregando, erro, carregar, criar, atualizar };
};

/**
 * Hook para gerenciar documentos
 */
export const useDocumentos = () => {
  const [documentos, setDocumentos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (empresaId) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.listarDocumentos(empresaId);
      if (resultado.sucesso) {
        setDocumentos(resultado.dados);
      } else {
        setErro(resultado.erro);
      }
    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  const upload = useCallback(async (empresaId, file, usuarioEmail) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.uploadDocumento(empresaId, file, usuarioEmail);
      if (resultado.sucesso) {
        await carregar(empresaId);
        return resultado.dados;
      } else {
        setErro(resultado.erro);
        return null;
      }
    } catch (erro) {
      setErro(erro.message);
      return null;
    } finally {
      setCarregando(false);
    }
  }, [carregar]);

  const deletar = useCallback(async (id, caminhoStorage) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.deletarDocumento(id, caminhoStorage);
      if (resultado.sucesso) {
        return true;
      } else {
        setErro(resultado.erro);
        return false;
      }
    } catch (erro) {
      setErro(erro.message);
      return false;
    } finally {
      setCarregando(false);
    }
  }, []);

  return { documentos, carregando, erro, carregar, upload, deletar };
};

/**
 * Hook para gerenciar dashboard
 */
export const useDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [tempoIncubadora, setTempoIncubadora] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [resultKpis, resultTempo] = await Promise.all([
        API.obterKpis(),
        API.obterTempoIncubadora()
      ]);

      if (resultKpis.sucesso) {
        setKpis(resultKpis.dados);
      } else {
        setErro(resultKpis.erro);
      }

      if (resultTempo.sucesso) {
        setTempoIncubadora(resultTempo.dados);
      }
    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { kpis, tempoIncubadora, carregando, erro, carregar };
};

/**
 * Hook para autenticação
 */
export const useAutenticacao = () => {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    obterUsuarioAtual();
  }, []);

  const obterUsuarioAtual = async () => {
    try {
      const resultado = await API.obterUsuarioAtual();
      if (resultado.sucesso) {
        setUsuario(resultado.usuario);
      } else {
        setUsuario(null);
      }
    } catch (erro) {
      setErro(erro.message);
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  };

  const login = async (email, senha) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.autenticar(email, senha);
      if (resultado.sucesso) {
        setUsuario(resultado.usuario);
        return true;
      } else {
        setErro(resultado.erro);
        return false;
      }
    } catch (erro) {
      setErro(erro.message);
      return false;
    } finally {
      setCarregando(false);
    }
  };

  const registrar = async (email, senha, nome) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.registrar(email, senha, nome);
      if (resultado.sucesso) {
        setUsuario(resultado.usuario);
        return true;
      } else {
        setErro(resultado.erro);
        return false;
      }
    } catch (erro) {
      setErro(erro.message);
      return false;
    } finally {
      setCarregando(false);
    }
  };

  const logout = async () => {
    setCarregando(true);
    try {
      await API.logout();
      setUsuario(null);
      return true;
    } catch (erro) {
      setErro(erro.message);
      return false;
    } finally {
      setCarregando(false);
    }
  };

  return { usuario, carregando, erro, login, registrar, logout, obterUsuarioAtual };
};

/**
 * Hook para gerenciar empresas desativadas
 */
export const useEmpresasDesativadas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.listarEmpresasDesativadas();
      if (resultado.sucesso) {
        setEmpresas(resultado.dados);
      } else {
        setErro(resultado.erro);
      }
    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  const reativar = useCallback(async (id, usuarioEmail) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.reativarEmpresa(id, usuarioEmail);
      if (resultado.sucesso) {
        await carregar();
        return true;
      } else {
        setErro(resultado.erro);
        return false;
      }
    } catch (erro) {
      setErro(erro.message);
      return false;
    } finally {
      setCarregando(false);
    }
  }, [carregar]);

  return { empresas, carregando, erro, carregar, reativar };
};

/**
 * Hook para realtime updates
 */
export const useRealtimeEmpresas = (callback) => {
  useEffect(() => {
    const subscription = API.inscreverEmpresasAtualizacoes((payload) => {
      callback(payload);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [callback]);
};

export const useRealtimeObrigacoes = (callback) => {
  useEffect(() => {
    const subscription = API.inscreverObrigacoesAtualizacoes((payload) => {
      callback(payload);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [callback]);
};

/**
 * Hook para auditoria
 */
export const useAuditoria = () => {
  const [auditoria, setAuditoria] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (filtros = {}) => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await API.obterAuditoria(filtros);
      if (resultado.sucesso) {
        setAuditoria(resultado.dados);
      } else {
        setErro(resultado.erro);
      }
    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  return { auditoria, carregando, erro, carregar };
};
