import { useEffect, useState } from "react";
import {
  Cpu,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Copy,
  MapPin,
  Clock,
  Radio,
  Activity,
  CheckCircle2,
  XCircle
} from "lucide-react";
import api from "../services/api";

function EstacoesLocais() {
  const [locais, setLocais] = useState([]);
  const [estacoes, setEstacoes] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const [form, setForm] = useState({
    nome: "",
    local_id: "",
    modelo: "ESP32 + BME280",
    descricao: ""
  });

  async function carregarLocais() {
    try {
      const response = await api.get("/locais");
      setLocais(response.data);

      if (response.data.length > 0) {
        setForm((estadoAtual) => ({
          ...estadoAtual,
          local_id: estadoAtual.local_id || response.data[0].id
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar locais:", error);
      setErro("Erro ao carregar locais monitorados.");
    }
  }

  async function carregarEstacoes() {
    try {
      setCarregando(true);
      setErro("");

      const response = await api.get("/estacoes");
      setEstacoes(response.data);
    } catch (error) {
      console.error("Erro ao carregar estações:", error);
      setErro("Erro ao carregar estações locais.");
    } finally {
      setCarregando(false);
    }
  }

  async function cadastrarEstacao(e) {
    e.preventDefault();

    if (!form.nome || !form.local_id) {
      setMensagem("Informe o nome da estação e o local vinculado.");
      return;
    }

    try {
      setMensagem("");
      setErro("");

      await api.post("/estacoes", form);

      setForm({
        nome: "",
        local_id: locais[0]?.id || "",
        modelo: "ESP32 + BME280",
        descricao: ""
      });

      setMensagem("Estação local cadastrada com sucesso.");
      carregarEstacoes();
    } catch (error) {
      console.error("Erro ao cadastrar estação:", error);
      setErro("Erro ao cadastrar estação local.");
    }
  }

  async function alternarStatus(id) {
    try {
      setMensagem("");
      setErro("");

      const response = await api.patch(`/estacoes/${id}/status`);

      setMensagem(response.data.mensagem || "Status atualizado.");
      carregarEstacoes();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      setErro("Erro ao alterar status da estação.");
    }
  }

  async function excluirEstacao(id) {
    const confirmar = confirm("Deseja excluir esta estação local?");

    if (!confirmar) return;

    try {
      setMensagem("");
      setErro("");

      await api.delete(`/estacoes/${id}`);

      setMensagem("Estação local excluída com sucesso.");
      carregarEstacoes();
    } catch (error) {
      console.error("Erro ao excluir estação:", error);
      setErro("Erro ao excluir estação local.");
    }
  }

  async function copiarChave(chave) {
    try {
      await navigator.clipboard.writeText(chave);
      setMensagem("Chave da estação copiada para a área de transferência.");
    } catch (error) {
      console.error("Erro ao copiar chave:", error);
      setErro("Não foi possível copiar a chave.");
    }
  }

  function formatarData(data) {
    if (!data) return "Nunca recebeu dados";
    return new Date(data).toLocaleString("pt-BR");
  }

  function calcularResumo() {
    const ativas = estacoes.filter((estacao) => estacao.ativa).length;
    const inativas = estacoes.filter((estacao) => !estacao.ativa).length;
    const comLeitura = estacoes.filter((estacao) => estacao.ultima_leitura_em).length;

    return {
      total: estacoes.length,
      ativas,
      inativas,
      comLeitura
    };
  }

  const resumo = calcularResumo();

  useEffect(() => {
    carregarLocais();
    carregarEstacoes();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Estações Locais</h1>
          <p className="page-description">
            Cadastre estações próprias com Arduino/ESP32 para receber dados reais
            dos sensores.
          </p>
        </div>
      </div>

      {mensagem && <div className="message-box">{mensagem}</div>}
      {erro && <div className="message-box error-message">{erro}</div>}

      <div className="stations-hero">
        <div>
          <span className="hero-label">Integração IoT</span>
          <h2>Conecte sensores físicos ao MeteoTrack</h2>
          <p>
            Cadastre uma estação local, copie sua chave de acesso e envie dados
            meteorológicos diretamente do ESP32 para o backend.
          </p>
        </div>

        <div className="hero-icon">
          <Cpu size={46} />
        </div>
      </div>

      <div className="cards-grid">
        <div className="card">
          <span>Total de estações</span>
          <strong>{resumo.total}</strong>
        </div>

        <div className="card">
          <span>Estações ativas</span>
          <strong>{resumo.ativas}</strong>
        </div>

        <div className="card">
          <span>Estações inativas</span>
          <strong>{resumo.inativas}</strong>
        </div>

        <div className="card">
          <span>Com leitura recebida</span>
          <strong>{resumo.comLeitura}</strong>
        </div>
      </div>

      <form className="station-form-card" onSubmit={cadastrarEstacao}>
        <div className="form-header">
          <div>
            <h3>Nova estação local</h3>
            <p>Vincule uma estação física a um local monitorado.</p>
          </div>

          <Plus size={26} />
        </div>

        <div className="form-group">
          <label>Nome da estação</label>
          <input
            type="text"
            placeholder="Ex: Estação Casa"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Local vinculado</label>
          <select
            value={form.local_id}
            onChange={(e) => setForm({ ...form, local_id: e.target.value })}
          >
            {locais.map((local) => (
              <option key={local.id} value={local.id}>
                {local.nome} - {local.cidade}
                {local.estado ? `/${local.estado}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Modelo/Sensores</label>
          <select
            value={form.modelo}
            onChange={(e) => setForm({ ...form, modelo: e.target.value })}
          >
            <option>ESP32 + BME280</option>
            <option>ESP32 + DHT22</option>
            <option>Arduino + ESP8266 + DHT22</option>
            <option>ESP32 + BME280 + Pluviômetro</option>
            <option>Outro</option>
          </select>
        </div>

        <div className="form-group">
          <label>Descrição</label>
          <input
            type="text"
            placeholder="Ex: Instalada na área externa"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </div>

        <button type="submit" className="submit-button">
          <Plus size={18} />
          Cadastrar estação
        </button>
      </form>

      <div className="section-title">
        <Radio size={22} />
        <h2>Estações cadastradas</h2>
      </div>

      {carregando ? (
        <div className="table-card">
          <p>Carregando estações locais...</p>
        </div>
      ) : estacoes.length === 0 ? (
        <div className="empty-state">
          <Cpu size={42} />
          <h3>Nenhuma estação cadastrada</h3>
          <p>
            Cadastre uma estação local para começar a receber dados de sensores
            físicos.
          </p>
        </div>
      ) : (
        <div className="stations-grid">
          {estacoes.map((estacao) => (
            <div className="station-card" key={estacao.id}>
              <div className="station-card-top">
                <div className="station-icon">
                  <Cpu size={26} />
                </div>

                <span
                  className={
                    estacao.ativa
                      ? "station-status station-active"
                      : "station-status station-inactive"
                  }
                >
                  {estacao.ativa ? (
                    <>
                      <CheckCircle2 size={15} />
                      Ativa
                    </>
                  ) : (
                    <>
                      <XCircle size={15} />
                      Inativa
                    </>
                  )}
                </span>
              </div>

              <h3>{estacao.nome}</h3>

              <div className="station-info-line">
                <MapPin size={18} />
                <span>
                  {estacao.local_nome} — {estacao.cidade}
                  {estacao.estado ? `/${estacao.estado}` : ""}
                </span>
              </div>

              <div className="station-info-line">
                <Activity size={18} />
                <span>{estacao.modelo}</span>
              </div>

              <div className="station-info-line">
                <Clock size={18} />
                <span>Última leitura: {formatarData(estacao.ultima_leitura_em)}</span>
              </div>

              {estacao.descricao && (
                <p className="station-description">{estacao.descricao}</p>
              )}

              <div className="station-key-box">
                <small>Chave da estação</small>
                <code>{estacao.station_key}</code>

                <button type="button" onClick={() => copiarChave(estacao.station_key)}>
                  <Copy size={16} />
                  Copiar chave
                </button>
              </div>

              <div className="station-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => alternarStatus(estacao.id)}
                >
                  {estacao.ativa ? <PowerOff size={17} /> : <Power size={17} />}
                  {estacao.ativa ? "Desativar" : "Ativar"}
                </button>

                <button
                  type="button"
                  className="danger-button"
                  onClick={() => excluirEstacao(estacao.id)}
                >
                  <Trash2 size={17} />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="station-doc-card">
        <h2>Como enviar dados da estação?</h2>

        <p>
          O ESP32 ou Arduino deve fazer uma requisição POST para o backend usando
          a chave da estação.
        </p>

        <pre>
{`POST http://localhost:3000/api/estacoes/dados

{
  "station_key": "SUA_CHAVE_AQUI",
  "temperatura": 26.4,
  "umidade": 71,
  "pressao": 1012.5,
  "vento_velocidade": 8.2,
  "vento_direcao": 180,
  "precipitacao": 0
}`}
        </pre>
      </div>
    </div>
  );
}

export default EstacoesLocais;