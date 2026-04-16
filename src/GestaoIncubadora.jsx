import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Plus, Trash2, CheckCircle, AlertTriangle, X } from 'lucide-react';
import * as API from './supabaseClient';

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

// ==================== HELPERS ====================
const calcularTempoIncubadora = (dataEntrada) => {
  if (!dataEntrada) return null;
  const entrada = new Date(dataEntrada);
  const agora = new Date();
  const totalMeses = (agora.getFullYear() - entrada.getFullYear()) * 12 + (agora.getMonth() - entrada.getMonth());
  const anos = Math.floor(totalMeses / 12);
  const meses = totalMeses % 12;
  return { anos, meses, totalMeses };
};

const formatarTempo = (tempo) => {
  if (!tempo) return 'N/A';
  const { anos, meses } = tempo;
  if (anos === 0) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  if (meses === 0) return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
};

const GestaoIncubadora = () => {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [ativaPagina, setAtivaPagina] = useState('dashboard');
  const [empresas, setEmpresas] = useState([]);
  const [empresasDesativadas, setEmpresasDesativadas] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [tempoIncubadora, setTempoIncubadora] = useState([]);
  const [boxesCadastro, setBoxesCadastro] = useState([]);
  const [controlesTipos, setControlesTipos] = useState([]);
  const [empresasComPendencias, setEmpresasComPendencias] = useState([]);
  const [filtros, setFiltros] = useState({ busca: '', atividade: '', apenasPendentes: false });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [empresaEmEdicao, setEmpresaEmEdicao] = useState(null);
  const [expandidoId, setExpandidoId] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '', visivel: false });
  const [empresaControlesAberta, setEmpresaControlesAberta] = useState(null);

  const listaAtividades = [
    'Serviços de Serralheria','Consultoria','Tecnologia','Design','Alimentos',
    'Manutenção','Limpeza','Logística','Educação','Saúde','Outro'
  ];

  // ==================== LIFECYCLE ====================
  const carregarEmpresas = useCallback(async () => {
    const resultado = await API.listarEmpresas(filtros);
    if (resultado.sucesso) setEmpresas(resultado.dados);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  useEffect(() => { inicializarAplicacao(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (usuario && ativaPagina === 'empresas') carregarEmpresas();
  }, [ativaPagina, usuario, carregarEmpresas]);

  useEffect(() => {
    if (usuario && ativaPagina === 'boxes') carregarBoxes();
  }, [ativaPagina, usuario]);

  useEffect(() => {
    if (usuario && ativaPagina === 'controles') carregarControlesTipos();
  }, [ativaPagina, usuario]);

  const inicializarAplicacao = async () => {
    try {
      setCarregando(true);
      const { usuario: u } = await API.obterUsuarioAtual();
      if (u) {
        setUsuario(u);
        await Promise.all([carregarDados(), carregarBoxes(), carregarControlesTipos(), carregarPendencias()]);
      } else {
        setAtivaPagina('login');
      }
    } catch { setAtivaPagina('login'); }
    finally { setCarregando(false); }
  };

  const carregarDados = async () => {
    try {
      const [rKpis, rTempo, rEmpresas, rDesativadas] = await Promise.all([
        API.obterKpis(), API.obterTempoIncubadora(),
        API.listarEmpresas(filtros), API.listarEmpresasDesativadas()
      ]);
      if (rKpis.sucesso) setKpis(rKpis.dados);
      if (rTempo.sucesso) setTempoIncubadora(rTempo.dados);
      if (rEmpresas.sucesso) setEmpresas(rEmpresas.dados);
      if (rDesativadas.sucesso) setEmpresasDesativadas(rDesativadas.dados);
    } catch (e) { mostrarMsg('erro', 'Erro ao carregar dados'); }
  };

  const carregarBoxes = async () => {
    const r = await API.listarBoxesCadastro();
    if (r.sucesso) setBoxesCadastro(r.dados);
  };

  const carregarControlesTipos = async () => {
    const r = await API.listarControlesTipos();
    if (r.sucesso) setControlesTipos(r.dados);
  };

  const carregarPendencias = async () => {
    const r = await API.listarEmpresasComPendencias();
    if (r.sucesso) setEmpresasComPendencias(r.dados);
  };

  const mostrarMsg = (tipo, texto) => {
    setMensagem({ tipo, texto, visivel: true });
    setTimeout(() => setMensagem(p => ({ ...p, visivel: false })), 3500);
  };

  const handleLogout = async () => {
    await API.logout();
    setUsuario(null);
    setAtivaPagina('login');
  };

  // ==================== NEGÓCIO EMPRESAS ====================
  const adicionarEmpresa = async (dados) => {
    setCarregando(true);
    const r = await API.criarEmpresa(dados, usuario.email);
    if (r.sucesso) { mostrarMsg('sucesso', 'Empresa adicionada'); setMostrarFormulario(false); await carregarEmpresas(); await carregarDados(); }
    else mostrarMsg('erro', r.erro);
    setCarregando(false);
  };

  const atualizarEmpresa = async (id, dados) => {
    setCarregando(true);
    const r = await API.atualizarEmpresa(id, dados, usuario.email);
    if (r.sucesso) { mostrarMsg('sucesso', 'Empresa atualizada'); setEmpresaEmEdicao(null); await carregarEmpresas(); await carregarDados(); }
    else mostrarMsg('erro', r.erro);
    setCarregando(false);
  };

  const desativarEmpresa = async (id) => {
    if (!window.confirm('Desativar esta empresa?')) return;
    setCarregando(true);
    const r = await API.desativarEmpresa(id, usuario.email);
    if (r.sucesso) { mostrarMsg('sucesso', 'Empresa desativada'); await carregarEmpresas(); await carregarDados(); }
    else mostrarMsg('erro', r.erro);
    setCarregando(false);
  };

  const reativarEmpresa = async (id) => {
    setCarregando(true);
    const r = await API.reativarEmpresa(id, usuario.email);
    if (r.sucesso) { mostrarMsg('sucesso', 'Empresa reativada'); await carregarDados(); }
    else mostrarMsg('erro', r.erro);
    setCarregando(false);
  };

  // ==================== NEGÓCIO BOXES ====================
  const salvarBox = async (dados, id = null) => {
    const r = id ? await API.atualizarBoxCadastro(id, dados) : await API.criarBoxCadastro(dados);
    if (r.sucesso) { mostrarMsg('sucesso', id ? 'Box atualizado' : 'Box criado'); await carregarBoxes(); }
    else mostrarMsg('erro', r.erro);
  };

  const excluirBox = async (id) => {
    if (!window.confirm('Excluir este box?')) return;
    const r = await API.excluirBoxCadastro(id);
    if (r.sucesso) { mostrarMsg('sucesso', 'Box excluído'); await carregarBoxes(); }
    else mostrarMsg('erro', r.erro);
  };

  // ==================== NEGÓCIO CONTROLES ====================
  const salvarControleTipo = async (dados) => {
    const r = await API.criarControleTipo(dados, usuario.email);
    if (r.sucesso) { mostrarMsg('sucesso', 'Controle criado' + (dados.paraTodos ? ' e aplicado a todas as empresas' : '')); await carregarControlesTipos(); await carregarPendencias(); }
    else mostrarMsg('erro', r.erro);
  };

  const excluirControleTipo = async (id) => {
    if (!window.confirm('Excluir este controle? Será removido de todas as empresas.')) return;
    const r = await API.excluirControleTipo(id);
    if (r.sucesso) { mostrarMsg('sucesso', 'Controle excluído'); await carregarControlesTipos(); await carregarPendencias(); }
    else mostrarMsg('erro', r.erro);
  };

  // ==================== COMPONENTES BASE ====================
  const Mensagem = () => {
    if (!mensagem.visivel) return null;
    const bg = { sucesso: CORES.sucesso, erro: CORES.perigo, aviso: CORES.aviso }[mensagem.tipo];
    return (
      <div style={{ position: 'fixed', top: 20, right: 20, padding: '14px 18px', background: bg, color: 'white', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', zIndex: 3000, maxWidth: 320, fontWeight: 500 }}>
        {mensagem.texto}
      </div>
    );
  };

  const Input = ({ label, ...props }) => (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: CORES.textoSecundario, marginBottom: 4 }}>{label}</label>}
      <input {...props} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${CORES.bordas}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box', ...props.style }} />
    </div>
  );

  const Select = ({ label, children, ...props }) => (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: CORES.textoSecundario, marginBottom: 4 }}>{label}</label>}
      <select {...props} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${CORES.bordas}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box', background: 'white', ...props.style }}>
        {children}
      </select>
    </div>
  );

  const Btn = ({ children, cor = CORES.principal, outline, small, ...props }) => (
    <button {...props} style={{
      background: outline ? 'transparent' : (props.disabled ? CORES.textoSecundario : cor),
      color: outline ? cor : 'white',
      border: outline ? `1px solid ${cor}` : 'none',
      padding: small ? '5px 12px' : '9px 18px',
      borderRadius: 6, cursor: props.disabled ? 'not-allowed' : 'pointer',
      fontSize: small ? 12 : 14, fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      ...props.style
    }}>
      {children}
    </button>
  );

  const Modal = ({ titulo, onFechar, children, largura = 600 }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 10, width: '92%', maxWidth: largura, maxHeight: '92vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: CORES.texto }}>{titulo}</h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CORES.textoSecundario, padding: 4 }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );

  // ==================== TELA LOGIN ====================
  const TelaLogin = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
      if (!email || !senha) { setErro('Preencha e-mail e senha.'); return; }
      setErro(''); setLoading(true);
      const r = await API.autenticar(email, senha);
      if (r.sucesso) {
        setUsuario(r.usuario); setAtivaPagina('dashboard');
        await Promise.all([carregarDados(), carregarBoxes(), carregarControlesTipos(), carregarPendencias()]);
      } else { setErro('E-mail ou senha inválidos.'); }
      setLoading(false);
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
        <div style={{ background: 'white', borderRadius: 14, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>📦</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: CORES.texto }}>Gestão Incubadora</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: CORES.textoSecundario }}>Prefeitura Municipal de Penápolis</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="seu@email.com" />
            <Input label="Senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" />
          </div>
          {erro && <div style={{ background: '#fef2f2', border: `1px solid ${CORES.perigo}`, borderRadius: 6, padding: '10px 12px', marginTop: 14, fontSize: 13, color: CORES.perigo }}>{erro}</div>}
          <button onClick={handleLogin} disabled={loading} style={{ width: '100%', marginTop: 20, padding: 12, background: loading ? CORES.textoSecundario : CORES.principal, color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    );
  };

  // ==================== FORMULÁRIO EMPRESA ====================
  const FormularioEmpresa = ({ empresa = null, onSalvar, onCancelar }) => {
    const [form, setForm] = useState(empresa || {
      nomeEmpresa: '', cnpj: '', inscricaoMunicipal: '', telefonePrincipal: '',
      telefoneSecundario: '', numeroFuncionarios: '', atividade: '', email: '', porte: '',
      boxes: [{ numero: '', dataEntrada: new Date().toISOString().split('T')[0] }],
      obrigacoes: []
    });

    const handleBoxChange = (i, campo, val) => {
      const b = [...form.boxes]; b[i] = { ...b[i], [campo]: val }; setForm({ ...form, boxes: b });
    };

    return (
      <Modal titulo={empresa ? 'Editar Empresa' : 'Adicionar Empresa'} onFechar={onCancelar} largura={800}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <Input label="Nome da Empresa" value={form.nomeEmpresa} onChange={e => setForm({ ...form, nomeEmpresa: e.target.value })} />
          <Input label="CNPJ" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} />
          <Input label="Inscrição Municipal" value={form.inscricaoMunicipal} onChange={e => setForm({ ...form, inscricaoMunicipal: e.target.value })} />
          <Select label="Atividade" value={form.atividade} onChange={e => setForm({ ...form, atividade: e.target.value })}>
            <option value="">Selecione...</option>
            {listaAtividades.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Input label="Telefone Principal" type="tel" value={form.telefonePrincipal} onChange={e => setForm({ ...form, telefonePrincipal: e.target.value })} />
          <Input label="Telefone Secundário" type="tel" value={form.telefoneSecundario} onChange={e => setForm({ ...form, telefoneSecundario: e.target.value })} />
          <Input label="Nº de Funcionários" type="number" value={form.numeroFuncionarios} onChange={e => setForm({ ...form, numeroFuncionarios: e.target.value })} />
          <Input label="E-mail" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com.br" />
          <Select label="Porte da Empresa" value={form.porte || ''} onChange={e => setForm({ ...form, porte: e.target.value })}>
            <option value="">Selecione...</option>
            <option value="MEI">MEI</option>
            <option value="ME">ME — Microempresa</option>
            <option value="EPP">EPP — Empresa de Pequeno Porte</option>
            <option value="Médio">Médio Porte</option>
            <option value="Grande">Grande Porte</option>
          </Select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: CORES.principal }}>Boxes</span>
            <Btn small cor={CORES.principal} onClick={() => setForm({ ...form, boxes: [...form.boxes, { numero: '', dataEntrada: new Date().toISOString().split('T')[0] }] })}>
              <Plus size={14} /> Adicionar
            </Btn>
          </div>
          {form.boxes.map((box, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Select value={box.numero} onChange={e => handleBoxChange(i, 'numero', e.target.value)} style={{ flex: '0 0 160px' }}>
                <option value="">Box...</option>
                {boxesCadastro.map(b => <option key={b.id} value={b.numero}>Box {b.numero}{b.endereco ? ` — ${b.endereco}` : ''}</option>)}
              </Select>
              <Input type="date" value={box.dataEntrada} onChange={e => handleBoxChange(i, 'dataEntrada', e.target.value)} style={{ flex: 1 }} />
              {form.boxes.length > 1 && (
                <button onClick={() => setForm({ ...form, boxes: form.boxes.filter((_, j) => j !== i) })} style={{ background: CORES.perigo, color: 'white', border: 'none', padding: '0 10px', borderRadius: 6, cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn outline cor={CORES.principal} onClick={onCancelar}>Cancelar</Btn>
          <Btn onClick={() => onSalvar(form)} disabled={carregando}>{carregando ? 'Salvando...' : empresa ? 'Salvar Alterações' : 'Adicionar Empresa'}</Btn>
        </div>
      </Modal>
    );
  };

  // ==================== MODAL CONTROLES EMPRESA ====================
  const ModalControlesEmpresa = ({ empresa, onFechar }) => {
    const [controles, setControles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tipoSelecionado, setTipoSelecionado] = useState('');

    useEffect(() => { carregarControles(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const carregarControles = async () => {
      setLoading(true);
      const r = await API.listarControlesEmpresa(empresa.id);
      if (r.sucesso) setControles(r.dados);
      setLoading(false);
    };

    const adicionarControle = async () => {
      if (!tipoSelecionado) return;
      const r = await API.adicionarControleEmpresa(empresa.id, tipoSelecionado, usuario.email);
      if (r.sucesso) { mostrarMsg('sucesso', 'Controle adicionado'); setTipoSelecionado(''); await carregarControles(); await carregarPendencias(); }
      else mostrarMsg('erro', r.erro);
    };

    const alternarStatus = async (id, statusAtual) => {
      const novoStatus = statusAtual === 'ok' ? 'pendente' : 'ok';
      const r = await API.atualizarStatusControle(id, novoStatus, usuario.email);
      if (r.sucesso) { await carregarControles(); await carregarPendencias(); }
      else mostrarMsg('erro', r.erro);
    };

    const removerControle = async (id) => {
      if (!window.confirm('Remover este controle da empresa?')) return;
      const r = await API.excluirControleEmpresa(id);
      if (r.sucesso) { mostrarMsg('sucesso', 'Removido'); await carregarControles(); await carregarPendencias(); }
      else mostrarMsg('erro', r.erro);
    };

    const tiposJaAdicionados = controles.map(c => c.controle_tipo_id);
    const tiposDisponiveis = controlesTipos.filter(t => !tiposJaAdicionados.includes(t.id));

    const categoriaLabel = { conta: '💰 Conta', capacitacao: '📚 Capacitação', notificacao: '📄 Notificação' };

    return (
      <Modal titulo={`Controles — ${empresa.nome_empresa}`} onFechar={onFechar} largura={660}>
        {/* Adicionar controle */}
        <div style={{ background: CORES.fundo, border: `1px solid ${CORES.bordas}`, borderRadius: 8, padding: 14, marginBottom: 20 }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: CORES.textoSecundario }}>+ Novo Controle</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select value={tipoSelecionado} onChange={e => setTipoSelecionado(e.target.value)} style={{ flex: 1 }}>
              <option value="">Selecione um controle...</option>
              {tiposDisponiveis.map(t => (
                <option key={t.id} value={t.id}>{categoriaLabel[t.categoria] || t.categoria} — {t.nome}</option>
              ))}
            </Select>
            <Btn onClick={adicionarControle} disabled={!tipoSelecionado}><Plus size={14} /> Adicionar</Btn>
          </div>
        </div>

        {/* Lista controles com checkbox */}
        {loading ? (
          <p style={{ textAlign: 'center', color: CORES.textoSecundario }}>Carregando...</p>
        ) : controles.length === 0 ? (
          <p style={{ textAlign: 'center', color: CORES.textoSecundario, padding: 20 }}>Nenhum controle vinculado.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {controles.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: c.status === 'ok' ? '#f0fdf4' : 'white', border: `1px solid ${c.status === 'ok' ? '#86efac' : CORES.perigo}`, borderRadius: 8, transition: 'all 0.15s' }}>
                <input
                  type="checkbox"
                  checked={c.status === 'ok'}
                  onChange={() => alternarStatus(c.id, c.status)}
                  style={{ width: 20, height: 20, cursor: 'pointer', accentColor: CORES.sucesso, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: CORES.texto, textDecoration: c.status === 'ok' ? 'line-through' : 'none', opacity: c.status === 'ok' ? 0.6 : 1 }}>
                    {c.controles_tipos?.nome}
                  </div>
                  <div style={{ fontSize: 11, color: CORES.textoSecundario, marginTop: 1 }}>
                    {categoriaLabel[c.controles_tipos?.categoria]}
                    {c.controles_tipos?.mes_referencia && ` · ${c.controles_tipos.mes_referencia}`}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.status === 'ok' ? CORES.sucesso : CORES.perigo, background: c.status === 'ok' ? '#dcfce7' : '#fef2f2', padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>
                  {c.status === 'ok' ? '✓ OK' : 'Pendente'}
                </span>
                <button onClick={() => removerControle(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CORES.textoSecundario, padding: 4, flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    );
  };

  // ==================== DASHBOARD ====================
  const Dashboard = () => {
    if (!kpis) return <div style={{ textAlign: 'center', padding: 32, color: CORES.textoSecundario }}>Carregando dados...</div>;
    const contagem = {
      ate_1_ano: tempoIncubadora.filter(e => e.faixa_tempo === 'ate_1_ano').length,
      ate_2_anos: tempoIncubadora.filter(e => e.faixa_tempo === 'ate_2_anos').length,
      ate_5_anos: tempoIncubadora.filter(e => e.faixa_tempo === 'ate_5_anos').length,
      ate_10_anos: tempoIncubadora.filter(e => e.faixa_tempo === 'ate_10_anos').length,
      mais_10_anos: tempoIncubadora.filter(e => e.faixa_tempo === 'mais_10_anos').length,
    };
    const Card = ({ titulo, valor, cor }) => (
      <div style={{ background: 'white', border: `1px solid ${CORES.bordas}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 12, color: CORES.textoSecundario, marginBottom: 8 }}>{titulo}</div>
        <div style={{ fontSize: 30, fontWeight: 700, color: cor || CORES.principal }}>{valor}</div>
      </div>
    );
    return (
      <div>
        <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 700 }}>Dashboard</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <Card titulo="Boxes Ocupados" valor={`${kpis.boxes_ocupados}/40`} />
          <Card titulo="Boxes Livres" valor={kpis.boxes_livres} cor={CORES.sucesso} />
          <Card titulo="Total de Empresas" valor={kpis.total_empresas} />
          <Card titulo="Pagamentos Vencidos" valor={kpis.total_pagamentos_vencidos} cor={CORES.perigo} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: 'white', border: `1px solid ${CORES.bordas}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Tempo na Incubadora</h3>
            {[['Até 1 ano', contagem.ate_1_ano], ['1-2 anos', contagem.ate_2_anos], ['2-5 anos', contagem.ate_5_anos], ['5-10 anos', contagem.ate_10_anos], ['Mais de 10 anos', contagem.mais_10_anos]].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: CORES.textoSecundario }}>{label}</span>
                <strong style={{ color: CORES.principal }}>{val}</strong>
              </div>
            ))}
          </div>
          <div style={{ background: 'white', border: `1px solid ${CORES.bordas}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Informações Gerais</h3>
            <div style={{ fontSize: 13, color: CORES.textoSecundario, lineHeight: 2 }}>
              <div>Empresas novas este mês: <strong style={{ color: CORES.texto }}>{kpis.empresas_novo_mes}</strong></div>
              <div>Com pagamentos vencidos: <strong style={{ color: CORES.perigo }}>{kpis.empresas_com_pagamento_vencido}</strong></div>
              <div>Taxa de ocupação: <strong style={{ color: CORES.texto }}>{Math.round((kpis.boxes_ocupados / 40) * 100)}%</strong></div>
              <div>Com pendências: <strong style={{ color: CORES.perigo }}>{empresasComPendencias.length}</strong></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== LISTA EMPRESAS ====================
  const ListaEmpresas = () => {
    const empresasFiltradas = empresas.filter(e => {
      if (filtros.apenasPendentes && !empresasComPendencias.includes(e.id)) return false;
      return true;
    });

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Empresas</h1>
          <Btn onClick={() => setMostrarFormulario(true)}><Plus size={16} /> Adicionar Empresa</Btn>
        </div>

        {/* Filtros */}
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setFilterVisible(!filterVisible)} style={{ background: filterVisible ? CORES.principal : CORES.fundo, color: filterVisible ? 'white' : CORES.principal, border: `1px solid ${CORES.bordas}`, padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: 13, marginBottom: 10 }}>
            🔍 Filtros
          </button>
          {filterVisible && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, padding: 14, background: CORES.fundo, borderRadius: 8, border: `1px solid ${CORES.bordas}`, alignItems: 'end' }}>
              <Input label="Buscar por nome ou CNPJ" value={filtros.busca} onChange={e => setFiltros({ ...filtros, busca: e.target.value })} />
              <Select label="Atividade" value={filtros.atividade} onChange={e => setFiltros({ ...filtros, atividade: e.target.value })}>
                <option value="">Todas</option>
                {listaAtividades.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', paddingBottom: 2 }}>
                <input type="checkbox" checked={filtros.apenasPendentes} onChange={e => setFiltros({ ...filtros, apenasPendentes: e.target.checked })} />
                Apenas com pendências
              </label>
            </div>
          )}
        </div>

        {/* Lista */}
        {empresasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: CORES.textoSecundario, background: CORES.fundo, borderRadius: 10 }}>Nenhuma empresa encontrada</div>
        ) : empresasFiltradas.map(empresa => {
          const tempo = calcularTempoIncubadora(empresa.data_entrada_mais_antiga);
          const tempoStr = formatarTempo(tempo);
          const acima2anos = tempo && tempo.totalMeses > 24;
          const temPendencia = empresasComPendencias.includes(empresa.id);

          return (
            <div key={empresa.id} style={{ background: 'white', border: `1px solid ${temPendencia ? CORES.perigo : CORES.bordas}`, borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
              <div onClick={() => setExpandidoId(expandidoId === empresa.id ? null : empresa.id)} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: expandidoId === empresa.id ? CORES.fundo : 'white' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{empresa.nome_empresa}</h3>
                    {temPendencia && (
                      <span style={{ background: '#fef2f2', color: CORES.perigo, border: `1px solid ${CORES.perigo}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={11} /> PENDÊNCIA
                      </span>
                    )}
                    {/* Tempo na incubadora em destaque */}
                    {tempo && (
                      <span style={{ background: acima2anos ? '#fef2f2' : '#f0f9ff', color: acima2anos ? CORES.perigo : CORES.principal, border: `1px solid ${acima2anos ? CORES.perigo : '#bae6fd'}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                        ⏱ {tempoStr}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: CORES.textoSecundario }}>
                    CNPJ: {empresa.cnpj} · {empresa.atividade} · Boxes: {empresa.boxes_numeros || 'N/A'}
                  </div>
                </div>
                <ChevronDown size={18} color={CORES.principal} style={{ transform: expandidoId === empresa.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </div>

              {expandidoId === empresa.id && (
                <div style={{ padding: 16, borderTop: `1px solid ${CORES.bordas}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: CORES.textoSecundario, marginBottom: 3 }}>Telefones</div>
                      <div style={{ fontSize: 14 }}>{empresa.telefone_principal}</div>
                      {empresa.telefone_secundario && <div style={{ fontSize: 14 }}>{empresa.telefone_secundario}</div>}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: CORES.textoSecundario, marginBottom: 3 }}>Funcionários</div>
                      <div style={{ fontSize: 14 }}>{empresa.numero_funcionarios || 'N/A'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Btn small onClick={() => setEmpresaControlesAberta(empresa)} cor={CORES.aviso}>
                      <CheckCircle size={13} /> Controles
                    </Btn>
                    <Btn small onClick={() => setEmpresaEmEdicao(empresa)}>Editar</Btn>
                    <Btn small cor={CORES.perigo} onClick={() => desativarEmpresa(empresa.id)} disabled={carregando}>Desativar</Btn>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ==================== EMPRESAS DESATIVADAS ====================
  const EmpresasDesativadas = () => (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 700 }}>Empresas Desativadas</h1>
      {empresasDesativadas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: CORES.textoSecundario, background: CORES.fundo, borderRadius: 10 }}>Nenhuma empresa desativada</div>
      ) : empresasDesativadas.map(e => (
        <div key={e.id} style={{ background: 'white', border: `1px solid ${CORES.bordas}`, borderRadius: 10, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{e.nome_empresa}</div>
            <div style={{ fontSize: 12, color: CORES.textoSecundario }}>CNPJ: {e.cnpj} · Saída: {new Date(e.data_saida).toLocaleDateString('pt-BR')}</div>
          </div>
          <Btn cor={CORES.sucesso} small onClick={() => reativarEmpresa(e.empresa_id)} disabled={carregando}>Reativar</Btn>
        </div>
      ))}
    </div>
  );

  // ==================== GESTÃO DE BOXES ====================
  const GestaoBoxes = () => {
    const [mostrarForm, setMostrarForm] = useState(false);
    const [boxEmEdicao, setBoxEmEdicao] = useState(null);
    const [form, setForm] = useState({ numero: '', endereco: '', observacoes: '' });

    const abrirNovo = () => { setForm({ numero: '', endereco: '', observacoes: '' }); setBoxEmEdicao(null); setMostrarForm(true); };
    const abrirEdicao = (b) => { setForm({ numero: b.numero, endereco: b.endereco || '', observacoes: b.observacoes || '' }); setBoxEmEdicao(b); setMostrarForm(true); };
    const salvar = async () => {
      if (!form.numero) { mostrarMsg('erro', 'Número do box é obrigatório'); return; }
      await salvarBox(form, boxEmEdicao?.id);
      setMostrarForm(false);
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Boxes</h1>
          <Btn onClick={abrirNovo}><Plus size={16} /> Novo Box</Btn>
        </div>

        {mostrarForm && (
          <Modal titulo={boxEmEdicao ? 'Editar Box' : 'Novo Box'} onFechar={() => setMostrarForm(false)} largura={480}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Número do Box *" type="number" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="Ex: 1, 2, 3..." />
              <Input label="Endereço" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} placeholder="Ex: Rua das Flores, 123" />
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: CORES.textoSecundario, marginBottom: 4 }}>Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${CORES.bordas}`, borderRadius: 6, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <Btn outline cor={CORES.principal} onClick={() => setMostrarForm(false)}>Cancelar</Btn>
              <Btn onClick={salvar}>{boxEmEdicao ? 'Salvar' : 'Criar Box'}</Btn>
            </div>
          </Modal>
        )}

        {boxesCadastro.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: CORES.textoSecundario, background: CORES.fundo, borderRadius: 10 }}>
            Nenhum box cadastrado. Clique em "Novo Box" para começar.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {boxesCadastro.map(b => (
              <div key={b.id} style={{ background: 'white', border: `1px solid ${CORES.bordas}`, borderRadius: 10, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ background: CORES.principal, color: 'white', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 18 }}>
                    Box {b.numero}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn small outline cor={CORES.principal} onClick={() => abrirEdicao(b)}>Editar</Btn>
                    <Btn small cor={CORES.perigo} onClick={() => excluirBox(b.id)}><Trash2 size={13} /></Btn>
                  </div>
                </div>
                {b.endereco && <div style={{ fontSize: 13, color: CORES.textoSecundario, marginBottom: 6 }}>📍 {b.endereco}</div>}
                {b.observacoes && <div style={{ fontSize: 12, color: CORES.textoSecundario, fontStyle: 'italic' }}>{b.observacoes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ==================== CONTROLE EXPANSÍVEL (menu Controles) ====================
  const ControleExpandivel = ({ controle, onExcluir }) => {
    const [expandido, setExpandido] = useState(false);
    const [empresasControle, setEmpresasControle] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos' | 'ok' | 'pendente'

    const categoriaLabel = { conta: '💰', capacitacao: '📚', notificacao: '📄' };

    const carregarEmpresas = async () => {
      if (empresasControle.length > 0) return; // já carregado
      setLoading(true);
      const r = await API.listarControlesEmpresaPorTipo(controle.id);
      if (r.sucesso) setEmpresasControle(r.dados);
      setLoading(false);
    };

    const handleExpandir = () => {
      if (!expandido) carregarEmpresas();
      setExpandido(!expandido);
    };

    const alternarStatus = async (ceId, statusAtual) => {
      const novoStatus = statusAtual === 'ok' ? 'pendente' : 'ok';
      const r = await API.atualizarStatusControle(ceId, novoStatus, '');
      if (r.sucesso) {
        setEmpresasControle(prev => prev.map(e => e.id === ceId ? { ...e, status: novoStatus } : e));
        await carregarPendencias();
      } else mostrarMsg('erro', r.erro);
    };

    const marcarTodos = async (novoStatus) => {
      const alvos = empresasControle.filter(e => e.status !== novoStatus);
      for (const e of alvos) {
        await API.atualizarStatusControle(e.id, novoStatus, '');
      }
      setEmpresasControle(prev => prev.map(e => ({ ...e, status: novoStatus })));
      await carregarPendencias();
      mostrarMsg('sucesso', novoStatus === 'ok' ? 'Todos marcados como OK' : 'Todos marcados como Pendente');
    };

    const empresasFiltradas = empresasControle.filter(e => filtroStatus === 'todos' ? true : e.status === filtroStatus);
    const totalOk = empresasControle.filter(e => e.status === 'ok').length;
    const totalPendente = empresasControle.filter(e => e.status === 'pendente').length;

    return (
      <div style={{ background: 'white', border: `1px solid ${CORES.bordas}`, borderRadius: 10, overflow: 'hidden' }}>
        {/* Cabeçalho clicável */}
        <div onClick={handleExpandir} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', background: expandido ? CORES.fundo : 'white' }}>
          <div style={{ fontSize: 22 }}>{categoriaLabel[controle.categoria]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{controle.nome}</div>
            <div style={{ fontSize: 12, color: CORES.textoSecundario, marginTop: 2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>{controle.categoria === 'conta' ? 'Conta' : controle.categoria === 'capacitacao' ? 'Capacitação' : 'Notificação'}</span>
              {controle.mes_referencia && <span>· {controle.mes_referencia}</span>}
              {controle.para_todos && <span style={{ background: '#eff6ff', color: CORES.principal, padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Todas as empresas</span>}
              {empresasControle.length > 0 && (
                <>
                  <span style={{ color: CORES.sucesso, fontWeight: 600 }}>✓ {totalOk} OK</span>
                  {totalPendente > 0 && <span style={{ color: CORES.perigo, fontWeight: 600 }}>⚠ {totalPendente} pendente{totalPendente > 1 ? 's' : ''}</span>}
                </>
              )}
            </div>
          </div>
          <Btn small cor={CORES.perigo} onClick={e => { e.stopPropagation(); onExcluir(controle.id); }}><Trash2 size={13} /> Excluir</Btn>
          <ChevronDown size={18} color={CORES.textoSecundario} style={{ transform: expandido ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
        </div>

        {/* Conteúdo expandido */}
        {expandido && (
          <div style={{ borderTop: `1px solid ${CORES.bordas}`, padding: 16 }}>
            {/* Barra de ações */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: CORES.textoSecundario, marginRight: 4 }}>Filtrar:</span>
              {['todos', 'ok', 'pendente'].map(f => (
                <button key={f} onClick={() => setFiltroStatus(f)} style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${filtroStatus === f ? CORES.principal : CORES.bordas}`, background: filtroStatus === f ? CORES.principal : 'white', color: filtroStatus === f ? 'white' : CORES.textoSecundario, cursor: 'pointer', fontSize: 12, fontWeight: filtroStatus === f ? 600 : 400 }}>
                  {f === 'todos' ? 'Todos' : f === 'ok' ? '✓ OK' : '⚠ Pendente'}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <Btn small cor={CORES.sucesso} onClick={() => marcarTodos('ok')}>✓ Marcar todos OK</Btn>
                <Btn small cor={CORES.perigo} outline onClick={() => marcarTodos('pendente')}>Resetar todos</Btn>
              </div>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', color: CORES.textoSecundario, padding: 16 }}>Carregando...</p>
            ) : empresasFiltradas.length === 0 ? (
              <p style={{ textAlign: 'center', color: CORES.textoSecundario, padding: 16 }}>
                {filtroStatus === 'todos' ? 'Nenhuma empresa vinculada.' : `Nenhuma empresa com status "${filtroStatus === 'ok' ? 'OK' : 'Pendente'}".`}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {empresasFiltradas.map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: e.status === 'ok' ? '#f0fdf4' : '#fef9f9', border: `1px solid ${e.status === 'ok' ? '#86efac' : '#fecaca'}`, borderRadius: 8 }}>
                    <input
                      type="checkbox"
                      checked={e.status === 'ok'}
                      onChange={() => alternarStatus(e.id, e.status)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: CORES.sucesso, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: CORES.texto, textDecoration: e.status === 'ok' ? 'line-through' : 'none', opacity: e.status === 'ok' ? 0.6 : 1 }}>
                        {e.empresas?.nome_empresa || '—'}
                      </div>
                      {e.empresas?.boxes_numeros && <div style={{ fontSize: 11, color: CORES.textoSecundario }}>Box {e.empresas.boxes_numeros}</div>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: e.status === 'ok' ? CORES.sucesso : CORES.perigo, background: e.status === 'ok' ? '#dcfce7' : '#fee2e2', padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>
                      {e.status === 'ok' ? '✓ OK' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================== GESTÃO DE CONTROLES ====================
  const GestaoControles = () => {
    const [mostrarForm, setMostrarForm] = useState(false);
    const [form, setForm] = useState({ categoria: 'conta', nome: '', mesReferencia: '', nomeCapacitacao: '', tipoNotificacao: '', paraTodos: false });

    const categorias = [
      { value: 'conta', label: '💰 Conta' },
      { value: 'capacitacao', label: '📚 Capacitação' },
      { value: 'notificacao', label: '📄 Notificação' },
    ];

    const tiposNotificacao = ['Ofício', 'Memorando', 'Circular', 'Notificação', 'Outros'];

    const gerarNome = () => {
      if (form.categoria === 'conta') return form.nome && form.mesReferencia ? `${form.nome} ${form.mesReferencia}` : form.nome;
      if (form.categoria === 'capacitacao') return form.nomeCapacitacao;
      if (form.categoria === 'notificacao') return form.tipoNotificacao ? `${form.tipoNotificacao}${form.nome ? ` — ${form.nome}` : ''}` : form.nome;
      return form.nome;
    };

    const salvar = async () => {
      const nome = gerarNome();
      if (!nome) { mostrarMsg('erro', 'Preencha as informações do controle'); return; }
      await salvarControleTipo({ ...form, nome });
      setMostrarForm(false);
      setForm({ categoria: 'conta', nome: '', mesReferencia: '', nomeCapacitacao: '', tipoNotificacao: '', paraTodos: false });
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Controles</h1>
          <Btn onClick={() => setMostrarForm(true)}><Plus size={16} /> Novo Controle</Btn>
        </div>

        {mostrarForm && (
          <Modal titulo="Novo Controle" onFechar={() => setMostrarForm(false)} largura={500}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Select label="Categoria" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value, nome: '', mesReferencia: '', nomeCapacitacao: '', tipoNotificacao: '' })}>
                {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>

              {form.categoria === 'conta' && (
                <>
                  <Select label="Tipo de Conta" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}>
                    <option value="">Selecione...</option>
                    <option value="Conta Água">💧 Conta Água</option>
                    <option value="Conta Luz">⚡ Conta Luz</option>
                    <option value="Taxa do Box">🏠 Taxa do Box</option>
                  </Select>
                  <Input label="Mês de Referência" placeholder="Ex: 04/2026" value={form.mesReferencia} onChange={e => setForm({ ...form, mesReferencia: e.target.value })} />
                </>
              )}

              {form.categoria === 'capacitacao' && (
                <Input label="Nome da Capacitação" placeholder="Ex: Treinamento SEBRAE — Gestão Financeira" value={form.nomeCapacitacao} onChange={e => setForm({ ...form, nomeCapacitacao: e.target.value })} />
              )}

              {form.categoria === 'notificacao' && (
                <>
                  <Select label="Tipo de Notificação" value={form.tipoNotificacao} onChange={e => setForm({ ...form, tipoNotificacao: e.target.value })}>
                    <option value="">Selecione...</option>
                    {tiposNotificacao.map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                  <Input label="Assunto (opcional)" placeholder="Ex: Regularização de CNPJ" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                </>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', padding: '10px 12px', background: form.paraTodos ? '#eff6ff' : CORES.fundo, border: `1px solid ${form.paraTodos ? CORES.principal : CORES.bordas}`, borderRadius: 8 }}>
                <input type="checkbox" checked={form.paraTodos} onChange={e => setForm({ ...form, paraTodos: e.target.checked })} />
                <div>
                  <div style={{ fontWeight: 600 }}>Aplicar para todas as empresas</div>
                  <div style={{ fontSize: 12, color: CORES.textoSecundario }}>Cria automaticamente em todas as empresas ativas com status Pendente</div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <Btn outline cor={CORES.principal} onClick={() => setMostrarForm(false)}>Cancelar</Btn>
              <Btn onClick={salvar}>Criar Controle</Btn>
            </div>
          </Modal>
        )}

        {controlesTipos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: CORES.textoSecundario, background: CORES.fundo, borderRadius: 10 }}>
            Nenhum controle criado. Clique em "Novo Controle" para começar.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {controlesTipos.map(c => (
              <ControleExpandivel key={c.id} controle={c} onExcluir={excluirControleTipo} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ==================== RENDER ====================
  if (carregando && !usuario) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: CORES.fundo }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: CORES.texto }}>Carregando...</div>
        </div>
      </div>
    );
  }

  if (!usuario || ativaPagina === 'login') {
    return <><Mensagem /><TelaLogin /></>;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'empresas', label: 'Empresas', icon: '🏢' },
    { id: 'desativadas', label: 'Desativadas', icon: '📁' },
    { id: 'boxes', label: 'Boxes', icon: '📦' },
    { id: 'controles', label: 'Controles', icon: '✅' },
  ];

  return (
    <div style={{ background: CORES.fundo, minHeight: '100vh' }}>
      <Mensagem />

      {/* Header */}
      <div style={{ background: 'white', borderBottom: `1px solid ${CORES.bordas}`, padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', gap: 24, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: CORES.principal }}>📦 Gestão Incubadora</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 13, color: CORES.textoSecundario }}>{usuario?.email}</div>
          <Btn small cor={CORES.perigo} onClick={handleLogout}>Logout</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 58px)' }}>
        {/* Sidebar */}
        <div style={{ width: 200, background: 'white', borderRight: `1px solid ${CORES.bordas}`, padding: '20px 0', flexShrink: 0 }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setAtivaPagina(item.id)} style={{
              width: '100%', background: ativaPagina === item.id ? CORES.fundo : 'transparent',
              color: ativaPagina === item.id ? CORES.principal : CORES.textoSecundario,
              border: 'none', borderLeft: ativaPagina === item.id ? `3px solid ${CORES.principal}` : '3px solid transparent',
              padding: '11px 16px', textAlign: 'left', cursor: 'pointer', fontSize: 14,
              fontWeight: ativaPagina === item.id ? 600 : 400,
            }}>
              {item.icon} {item.label}
              {item.id === 'empresas' && empresasComPendencias.length > 0 && (
                <span style={{ marginLeft: 6, background: CORES.perigo, color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                  {empresasComPendencias.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          {ativaPagina === 'dashboard' && <Dashboard />}
          {ativaPagina === 'empresas' && <ListaEmpresas />}
          {ativaPagina === 'desativadas' && <EmpresasDesativadas />}
          {ativaPagina === 'boxes' && <GestaoBoxes />}
          {ativaPagina === 'controles' && <GestaoControles />}
        </div>
      </div>

      {/* Modais */}
      {mostrarFormulario && <FormularioEmpresa onSalvar={adicionarEmpresa} onCancelar={() => setMostrarFormulario(false)} />}
      {empresaEmEdicao && <FormularioEmpresa empresa={empresaEmEdicao} onSalvar={d => atualizarEmpresa(empresaEmEdicao.id, d)} onCancelar={() => setEmpresaEmEdicao(null)} />}
      {empresaControlesAberta && <ModalControlesEmpresa empresa={empresaControlesAberta} onFechar={() => setEmpresaControlesAberta(null)} />}
    </div>
  );
};

export default GestaoIncubadora;
