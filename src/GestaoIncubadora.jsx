import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import * as API from './supabaseClient';

const GestaoIncubadora = () => {
  // ==================== STATES ====================
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [ativaPagina, setAtivaPagina] = useState('dashboard');
  const [empresas, setEmpresas] = useState([]);
  const [empresasDesativadas, setEmpresasDesativadas] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [tempoIncubadora, setTempoIncubadora] = useState([]);
  
  const [filtros, setFiltros] = useState({
    busca: '',
    atividade: '',
    statusPagamento: 'todos',
    tempoIncubadora: 'todos'
  });
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [empresaEmEdicao, setEmpresaEmEdicao] = useState(null);
  const [expandidoId, setExpandidoId] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '', visivel: false });

  const CORES = {
    principal: '#6366f1',
    secundaria: '#ec4899',
    sucesso: '#10b981',
    aviso: '#f59e0b',
    perigo: '#ef4444',
    roxo: '#a855f7',
    fundo: '#f8fafc',
    bordas: '#e2e8f0',
    texto: '#1e293b',
    textoSecundario: '#64748b'
  };

  const listaAtividades = [
    'Serviços de Serralheria',
    'Consultoria',
    'Tecnologia',
    'Design',
    'Alimentos',
    'Manutenção',
    'Limpeza',
    'Logística',
    'Educação',
    'Saúde',
    'Outro'
  ];

  // ==================== LIFECYCLE ====================
  useEffect(() => {
    inicializarAplicacao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (usuario && ativaPagina === 'empresas') {
      carregarEmpresas();
    }
  }, [ativaPagina, filtros]);

  const inicializarAplicacao = async () => {
    try {
      setCarregando(true);
      const { usuario: usuarioAtual } = await API.obterUsuarioAtual();
      
      if (usuarioAtual) {
        setUsuario(usuarioAtual);
        await carregarDados();
      } else {
        setAtivaPagina('login');
      }
    } catch (erro) {
      console.error('Erro ao inicializar:', erro);
      mostrarMensagem('erro', 'Erro ao inicializar aplicação');
    } finally {
      setCarregando(false);
    }
  };

  const carregarDados = async () => {
    try {
      const [resultKpis, resultTempo, resultEmpresas, resultDesativadas] = await Promise.all([
        API.obterKpis(),
        API.obterTempoIncubadora(),
        API.listarEmpresas(filtros),
        API.listarEmpresasDesativadas()
      ]);

      if (resultKpis.sucesso) setKpis(resultKpis.dados);
      if (resultTempo.sucesso) setTempoIncubadora(resultTempo.dados);
      if (resultEmpresas.sucesso) setEmpresas(resultEmpresas.dados);
      if (resultDesativadas.sucesso) setEmpresasDesativadas(resultDesativadas.dados);
    } catch (erro) {
      console.error('Erro ao carregar dados:', erro);
      mostrarMensagem('erro', 'Erro ao carregar dados');
    }
  };

  const carregarEmpresas = async () => {
    const resultado = await API.listarEmpresas(filtros);
    if (resultado.sucesso) {
      setEmpresas(resultado.dados);
    } else {
      mostrarMensagem('erro', 'Erro ao carregar empresas');
    }
  };

  const mostrarMensagem = (tipo, texto) => {
    setMensagem({ tipo, texto, visivel: true });
    setTimeout(() => setMensagem({ ...mensagem, visivel: false }), 3000);
  };

  const carregarEmpresas = useCallback(async () => {
    const resultado = await API.listarEmpresas(filtros);
    if (resultado.sucesso) {
      setEmpresas(resultado.dados);
    } else {
      mostrarMensagem('erro', 'Erro ao carregar empresas');
    }
  }, [filtros, mensagem]);

  // ==================== LIFECYCLE ====================
  useEffect(() => {
    if (usuario && ativaPagina === 'empresas') {
      carregarEmpresas();
    }
  }, [ativaPagina, usuario, carregarEmpresas]);

  // ==================== FUNÇÕES DE NEGÓCIO ====================
  const adicionarEmpresa = async (dados) => {
    try {
      setCarregando(true);
      const resultado = await API.criarEmpresa(dados, usuario.email);
      
      if (resultado.sucesso) {
        mostrarMensagem('sucesso', 'Empresa adicionada com sucesso');
        setMostrarFormulario(false);
        await carregarEmpresas();
        await carregarDados();
      } else {
        mostrarMensagem('erro', resultado.erro);
      }
    } catch (erro) {
      mostrarMensagem('erro', erro.message);
    } finally {
      setCarregando(false);
    }
  };

  const atualizarEmpresa = async (id, dados) => {
    try {
      setCarregando(true);
      const resultado = await API.atualizarEmpresa(id, dados, usuario.email);
      
      if (resultado.sucesso) {
        mostrarMensagem('sucesso', 'Empresa atualizada com sucesso');
        setEmpresaEmEdicao(null);
        await carregarEmpresas();
        await carregarDados();
      } else {
        mostrarMensagem('erro', resultado.erro);
      }
    } catch (erro) {
      mostrarMensagem('erro', erro.message);
    } finally {
      setCarregando(false);
    }
  };

  const desativarEmpresa = async (id) => {
    if (window.confirm('Tem certeza que deseja desativar esta empresa?')) {
      try {
        setCarregando(true);
        const resultado = await API.desativarEmpresa(id, usuario.email);
        
        if (resultado.sucesso) {
          mostrarMensagem('sucesso', 'Empresa desativada com sucesso');
          await carregarEmpresas();
          await carregarDados();
        } else {
          mostrarMensagem('erro', resultado.erro);
        }
      } catch (erro) {
        mostrarMensagem('erro', erro.message);
      } finally {
        setCarregando(false);
      }
    }
  };

  const reativarEmpresa = async (id) => {
    try {
      setCarregando(true);
      const resultado = await API.reativarEmpresa(id, usuario.email);
      
      if (resultado.sucesso) {
        mostrarMensagem('sucesso', 'Empresa reativada com sucesso');
        await carregarEmpresas();
        await carregarDados();
      } else {
        mostrarMensagem('erro', resultado.erro);
      }
    } catch (erro) {
      mostrarMensagem('erro', erro.message);
    } finally {
      setCarregando(false);
    }
  };

  const calcularTempoEmIncubadora = (dataEntrada) => {
    const entrada = new Date(dataEntrada);
    const agora = new Date();
    return Math.floor((agora - entrada) / (1000 * 60 * 60 * 24 * 365));
  };

  const temBandeiraRoxa = (empresa) => {
    return empresa.boxes_numeros && calcularTempoEmIncubadora(empresa.data_entrada_mais_antiga) >= 2;
  };

  // ==================== COMPONENTES ====================
  const Mensagem = () => {
    if (!mensagem.visivel) return null;

    const cores = {
      sucesso: CORES.sucesso,
      erro: CORES.perigo,
      aviso: CORES.aviso
    };

    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px',
        background: cores[mensagem.tipo],
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 2000,
        maxWidth: '300px'
      }}>
        {mensagem.texto}
      </div>
    );
  };

  const CardDashboard = ({ titulo, valor, subtitulo, cor = CORES.principal }) => (
    <div style={{
      background: CORES.fundo,
      border: `1px solid ${CORES.bordas}`,
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px'
    }}>
      <div style={{ fontSize: '12px', color: CORES.textoSecundario, marginBottom: '8px' }}>
        {titulo}
      </div>
      <div style={{ fontSize: '28px', fontWeight: '600', color: cor, marginBottom: '4px' }}>
        {valor}
      </div>
      {subtitulo && <div style={{ fontSize: '12px', color: CORES.textoSecundario }}>{subtitulo}</div>}
    </div>
  );

  const Bandeira = ({ tipo, mensagem: msg }) => {
    const cores = {
      vermelha: CORES.perigo,
      amarela: CORES.aviso,
      roxa: CORES.roxo
    };

    return (
      <div
        style={{
          display: 'inline-block',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: cores[tipo],
          cursor: 'help',
          marginRight: '8px'
        }}
        title={msg}
      />
    );
  };

  const FormularioEmpresa = ({ empresa = null, onSalvar, onCancelar }) => {
    const [form, setForm] = useState(empresa || {
      nomeEmpresa: '',
      cnpj: '',
      inscricaoMunicipal: '',
      telefonePrincipal: '',
      telefoneSecundario: '',
      numeroFuncionarios: '',
      atividade: '',
      boxes: [{ numero: '', dataEntrada: new Date().toISOString().split('T')[0] }],
      obrigacoes: []
    });

    const handleBoxChange = (index, campo, valor) => {
      const novoBoxes = [...(form.boxes || [])];
      novoBoxes[index] = { ...novoBoxes[index], [campo]: valor };
      setForm({ ...form, boxes: novoBoxes });
    };

    const adicionarBox = () => {
      setForm({
        ...form,
        boxes: [...(form.boxes || []), { numero: '', dataEntrada: new Date().toISOString().split('T')[0] }]
      });
    };

    const removerBox = (index) => {
      setForm({ ...form, boxes: form.boxes.filter((_, i) => i !== index) });
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              {empresa ? 'Editar Empresa' : 'Adicionar Empresa'}
            </h2>
            <button onClick={onCancelar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>
              ✕
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: CORES.principal }}>
              Dados Básicos
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Nome da Empresa"
                value={form.nomeEmpresa}
                onChange={(e) => setForm({ ...form, nomeEmpresa: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${CORES.bordas}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                placeholder="CNPJ"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${CORES.bordas}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                placeholder="Inscrição Municipal"
                value={form.inscricaoMunicipal}
                onChange={(e) => setForm({ ...form, inscricaoMunicipal: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${CORES.bordas}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <select
                value={form.atividade}
                onChange={(e) => setForm({ ...form, atividade: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${CORES.bordas}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Selecione Atividade</option>
                {listaAtividades.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <input
                type="tel"
                placeholder="Telefone Principal"
                value={form.telefonePrincipal}
                onChange={(e) => setForm({ ...form, telefonePrincipal: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${CORES.bordas}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <input
                type="tel"
                placeholder="Telefone Secundário"
                value={form.telefoneSecundario}
                onChange={(e) => setForm({ ...form, telefoneSecundario: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${CORES.bordas}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <input
                type="number"
                placeholder="Número de Funcionários"
                value={form.numeroFuncionarios}
                onChange={(e) => setForm({ ...form, numeroFuncionarios: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${CORES.bordas}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: CORES.principal }}>
                Boxes
              </h3>
              <button
                onClick={adicionarBox}
                style={{
                  background: CORES.principal,
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                + Adicionar
              </button>
            </div>
            {form.boxes.map((box, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="number"
                  placeholder="Nº Box"
                  value={box.numero}
                  onChange={(e) => handleBoxChange(idx, 'numero', e.target.value)}
                  style={{
                    padding: '8px',
                    border: `1px solid ${CORES.bordas}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    flex: '0 0 80px'
                  }}
                />
                <input
                  type="date"
                  value={box.dataEntrada}
                  onChange={(e) => handleBoxChange(idx, 'dataEntrada', e.target.value)}
                  style={{
                    padding: '8px',
                    border: `1px solid ${CORES.bordas}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    flex: 1
                  }}
                />
                {form.boxes.length > 1 && (
                  <button
                    onClick={() => removerBox(idx)}
                    style={{
                      background: CORES.perigo,
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onCancelar}
              style={{
                background: CORES.fundo,
                color: CORES.principal,
                border: `1px solid ${CORES.bordas}`,
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onSalvar(form);
              }}
              disabled={carregando}
              style={{
                background: carregando ? CORES.textoSecundario : CORES.principal,
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: carregando ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              {carregando ? 'Salvando...' : empresa ? 'Salvar Alterações' : 'Adicionar Empresa'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== TELAS ====================
  const Dashboard = () => {
    if (!kpis || !tempoIncubadora) {
      return <div style={{ textAlign: 'center', padding: '32px' }}>Carregando dados...</div>;
    }

    const tempoIncubadoraContagem = {
      ate_1_ano: tempoIncubadora.filter(e => e.faixa_tempo === 'ate_1_ano').length,
      ate_2_anos: tempoIncubadora.filter(e => e.faixa_tempo === 'ate_2_anos').length,
      ate_5_anos: tempoIncubadora.filter(e => e.faixa_tempo === 'ate_5_anos').length,
      ate_10_anos: tempoIncubadora.filter(e => e.faixa_tempo === 'ate_10_anos').length,
      mais_10_anos: tempoIncubadora.filter(e => e.faixa_tempo === 'mais_10_anos').length
    };

    return (
      <div>
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>Dashboard</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <CardDashboard titulo="Boxes Ocupados" valor={`${kpis.boxes_ocupados}/40`} cor={CORES.principal} />
          <CardDashboard titulo="Boxes Livres" valor={kpis.boxes_livres} cor={CORES.sucesso} />
          <CardDashboard titulo="Total de Empresas" valor={kpis.total_empresas} cor={CORES.principal} />
          <CardDashboard titulo="Pagamentos Vencidos" valor={kpis.total_pagamentos_vencidos} cor={CORES.perigo} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: CORES.fundo, border: `1px solid ${CORES.bordas}`, borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', margin: '0 0 12px 0' }}>
              Tempo na Incubadora
            </h3>
            <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}>Até 1 ano: <strong style={{ color: CORES.principal }}>{tempoIncubadoraContagem.ate_1_ano}</strong></div>
              <div style={{ marginBottom: '8px' }}>1-2 anos: <strong style={{ color: CORES.principal }}>{tempoIncubadoraContagem.ate_2_anos}</strong></div>
              <div style={{ marginBottom: '8px' }}>2-5 anos: <strong style={{ color: CORES.principal }}>{tempoIncubadoraContagem.ate_5_anos}</strong></div>
              <div style={{ marginBottom: '8px' }}>5-10 anos: <strong style={{ color: CORES.principal }}>{tempoIncubadoraContagem.ate_10_anos}</strong></div>
              <div>Mais de 10 anos: <strong style={{ color: CORES.roxo }}>{tempoIncubadoraContagem.mais_10_anos}</strong></div>
            </div>
          </div>

          <div style={{ background: CORES.fundo, border: `1px solid ${CORES.bordas}`, borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', margin: '0 0 12px 0' }}>
              Informações Gerais
            </h3>
            <div style={{ fontSize: '13px', color: CORES.textoSecundario, lineHeight: '1.8' }}>
              <p style={{ margin: '0 0 8px 0' }}>Empresas novas este mês: {kpis.empresas_novo_mes}</p>
              <p style={{ margin: '0 0 8px 0' }}>Empresas com pagamentos vencidos: {kpis.empresas_com_pagamento_vencido}</p>
              <p style={{ margin: 0 }}>Taxa de ocupação: {Math.round((kpis.boxes_ocupados / 40) * 100)}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ListaEmpresas = () => {
    const empresasFiltradas = empresas;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Empresas</h1>
          <button
            onClick={() => setMostrarFormulario(true)}
            disabled={carregando}
            style={{
              background: carregando ? CORES.textoSecundario : CORES.principal,
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: carregando ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            + Adicionar Empresa
          </button>
        </div>

        {/* Filtros */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setFilterVisible(!filterVisible)}
            style={{
              background: filterVisible ? CORES.principal : CORES.fundo,
              color: filterVisible ? 'white' : CORES.principal,
              border: `1px solid ${CORES.bordas}`,
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              marginBottom: '12px'
            }}
          >
            🔍 Filtros
          </button>

          {filterVisible && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: '12px',
              padding: '12px',
              background: CORES.fundo,
              borderRadius: '4px',
              border: `1px solid ${CORES.bordas}`
            }}>
              <input
                type="text"
                placeholder="Buscar por nome ou CNPJ"
                value={filtros.busca}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${CORES.bordas}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <select
                value={filtros.atividade}
                onChange={(e) => setFiltros({ ...filtros, atividade: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${CORES.bordas}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Todas Atividades</option>
                {listaAtividades.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Lista */}
        <div>
          {empresasFiltradas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: CORES.textoSecundario,
              background: CORES.fundo,
              borderRadius: '8px'
            }}>
              Nenhuma empresa encontrada
            </div>
          ) : (
            empresasFiltradas.map(empresa => (
              <div
                key={empresa.id}
                style={{
                  background: 'white',
                  border: `1px solid ${CORES.bordas}`,
                  borderRadius: '8px',
                  marginBottom: '12px',
                  overflow: 'hidden'
                }}
              >
                <div
                  onClick={() => setExpandidoId(expandidoId === empresa.id ? null : empresa.id)}
                  style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    background: expandidoId === empresa.id ? CORES.fundo : 'white',
                    borderBottom: expandidoId === empresa.id ? `1px solid ${CORES.bordas}` : 'none'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {temBandeiraRoxa(empresa) && <Bandeira tipo="roxa" mensagem="Empresa há mais de 2 anos na incubadora" />}
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{empresa.nome_empresa}</h3>
                    </div>
                    <div style={{ fontSize: '13px', color: CORES.textoSecundario }}>
                      CNPJ: {empresa.cnpj} | Atividade: {empresa.atividade} | Boxes: {empresa.boxes_numeros || 'N/A'}
                    </div>
                  </div>
                  <ChevronDown
                    size={20}
                    color={CORES.principal}
                    style={{
                      transform: expandidoId === empresa.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                </div>

                {expandidoId === empresa.id && (
                  <div style={{ padding: '16px', borderTop: `1px solid ${CORES.bordas}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: CORES.textoSecundario, marginBottom: '4px' }}>Telefones</div>
                        <div style={{ fontSize: '14px' }}>{empresa.telefone_principal}</div>
                        {empresa.telefone_secundario && <div style={{ fontSize: '14px' }}>{empresa.telefone_secundario}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: CORES.textoSecundario, marginBottom: '4px' }}>Funcionários</div>
                        <div style={{ fontSize: '14px' }}>{empresa.numero_funcionarios || 'N/A'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setEmpresaEmEdicao(empresa)}
                        style={{
                          flex: 1,
                          background: CORES.principal,
                          color: 'white',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => desativarEmpresa(empresa.id)}
                        disabled={carregando}
                        style={{
                          flex: 1,
                          background: carregando ? CORES.textoSecundario : CORES.perigo,
                          color: 'white',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '4px',
                          cursor: carregando ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        Desativar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const EmpresasDesativadas = () => {
    return (
      <div>
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>Empresas Desativadas</h1>

        {empresasDesativadas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            color: CORES.textoSecundario,
            background: CORES.fundo,
            borderRadius: '8px'
          }}>
            Nenhuma empresa desativada
          </div>
        ) : (
          <div>
            {empresasDesativadas.map(empresa => (
              <div
                key={empresa.id}
                style={{
                  background: 'white',
                  border: `1px solid ${CORES.bordas}`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                    {empresa.nome_empresa}
                  </h3>
                  <div style={{ fontSize: '13px', color: CORES.textoSecundario }}>
                    CNPJ: {empresa.cnpj} | Data Saída: {new Date(empresa.data_saida).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <button
                  onClick={() => reativarEmpresa(empresa.empresa_id)}
                  disabled={carregando}
                  style={{
                    background: carregando ? CORES.textoSecundario : CORES.sucesso,
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: carregando ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  Reativar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ==================== RENDER ====================
  if (carregando && !usuario) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: CORES.fundo
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: CORES.texto }}>
            Carregando Gestão Incubadora...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: CORES.fundo, minHeight: '100vh' }}>
      <Mensagem />

      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: `1px solid ${CORES.bordas}`,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: CORES.principal }}>
          📦 Gestão Incubadora
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '13px', color: CORES.textoSecundario }}>
            {usuario?.email}
          </div>
          <button
            onClick={() => API.logout()}
            style={{
              background: CORES.perigo,
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)' }}>
        {/* Sidebar */}
        <div style={{
          width: '200px',
          background: 'white',
          borderRight: `1px solid ${CORES.bordas}`,
          padding: '24px 0'
        }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'empresas', label: 'Empresas', icon: '🏢' },
            { id: 'desativadas', label: 'Desativadas', icon: '📁' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setAtivaPagina(item.id)}
              style={{
                width: '100%',
                background: ativaPagina === item.id ? CORES.fundo : 'transparent',
                color: ativaPagina === item.id ? CORES.principal : CORES.textoSecundario,
                border: 'none',
                padding: '12px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: ativaPagina === item.id ? '600' : '400',
                borderLeft: ativaPagina === item.id ? `3px solid ${CORES.principal}` : 'none'
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, padding: '32px' }}>
          {ativaPagina === 'dashboard' && <Dashboard />}
          {ativaPagina === 'empresas' && <ListaEmpresas />}
          {ativaPagina === 'desativadas' && <EmpresasDesativadas />}
        </div>
      </div>

      {/* Modais */}
      {mostrarFormulario && (
        <FormularioEmpresa
          onSalvar={adicionarEmpresa}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      {empresaEmEdicao && (
        <FormularioEmpresa
          empresa={empresaEmEdicao}
          onSalvar={(dados) => atualizarEmpresa(empresaEmEdicao.id, dados)}
          onCancelar={() => setEmpresaEmEdicao(null)}
        />
      )}
    </div>
  );
};

export default GestaoIncubadora;
