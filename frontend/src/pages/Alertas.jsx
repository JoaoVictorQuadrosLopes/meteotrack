import { useEffect, useState } from "react";
import {
  AlertTriangle,
  RefreshCcw,
  Search,
  Filter,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  CalendarDays,
  MapPin,
  CheckCircle,
  XCircle
} from "lucide-react";

import api from "../services/api";
import { gerarAlertasCriticos } from "../utils/analiseTecnica";

function Alertas() {
  const [locais, setLocais] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const [localId, setLocalId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function formatarData(data) {
    if (!data) return "--";
    return new Date(data).toLocaleString("pt-BR");
  }

  function obterIconeAlerta(tipo) {
    if (tipo === "Temperatura elevada") return <Thermometer size={20} />;
    if (tipo === "Umidade baixa") return <Droplets size={20} />;
    if (tipo === "Vento forte") return <Wind size={20} />;
    if (tipo === "Chuva intensa") return <CloudRain size={20} />;
    if (tipo === "Radiação solar elevada") return <Sun size={20} />;

    return <AlertTriangle size={20} />;
  }

  function obterClasseNivel(nivel) {
    if (nivel === "Crítico") return "critical";
    if (nivel === "Atenção") return "warning";

    return "normal";
  }

  function contarPorTipo(listaAlertas, tipo) {
    return listaAlertas.filter((alerta) => alerta.tipo === tipo).length;
  }

  function contarCriticos(listaAlertas) {
    return listaAlertas.filter((alerta) => alerta.nivel === "Crítico").length;
  }

  function contarAtencao(listaAlertas) {
    return listaAlertas.filter((alerta) => alerta.nivel === "Atenção").length;
  }

  function enriquecerAlertas(alertasGerados, registrosBase) {
    return alertasGerados.map((alerta, index) => {
      const registroRelacionado = registrosBase.find(
        (registro) => registro.data_hora === alerta.data_hora
      );

      return {
        id: `${alerta.tipo}-${alerta.data_hora}-${index}`,
        ...alerta,
        local_nome: registroRelacionado?.local_nome || "Local não informado",
        cidade: registroRelacionado?.cidade || "",
        estado: registroRelacionado?.estado || "",
        origem: registroRelacionado?.origem || "",
        status: "ativo"
      };
    });
  }

  async function carregarLocais() {
    try {
      const response = await api.get("/locais");
      setLocais(response.data);
    } catch (error) {
      console.error("Erro ao carregar locais:", error);
      setErro("Erro ao carregar locais monitorados.");
    }
  }

  async function carregarAlertas(filtros = {}) {
    try {
      setCarregando(true);
      setErro("");
      setMensagem("");

      const response = await api.get("/registros", {
        params: filtros
      });

      const registrosRecebidos = response.data || [];
      const alertasGerados = gerarAlertasCriticos(registrosRecebidos);
      const alertasComLocal = enriquecerAlertas(
        alertasGerados,
        registrosRecebidos
      );

      setRegistros(registrosRecebidos);
      setAlertas(alertasComLocal);

      if (alertasComLocal.length === 0) {
        setMensagem("Nenhum alerta crítico encontrado para os filtros atuais.");
      }
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
      setErro("Não foi possível carregar os alertas.");
    } finally {
      setCarregando(false);
    }
  }

  async function aplicarFiltros(e) {
    e.preventDefault();

    const filtros = {};

    if (localId) {
      filtros.local_id = localId;
    }

    if (dataInicio) {
      filtros.data_inicio = dataInicio;
    }

    if (dataFim) {
      filtros.data_fim = dataFim;
    }

    await carregarAlertas(filtros);
  }

  async function limparFiltros() {
    setLocalId("");
    setDataInicio("");
    setDataFim("");
    setMensagem("");
    await carregarAlertas();
  }

  async function atualizar() {
    const filtros = {};

    if (localId) filtros.local_id = localId;
    if (dataInicio) filtros.data_inicio = dataInicio;
    if (dataFim) filtros.data_fim = dataFim;

    await carregarAlertas(filtros);
  }

  const totalAlertas = alertas.length;
  const totalCriticos = contarCriticos(alertas);
  const totalAtencao = contarAtencao(alertas);

  useEffect(() => {
    carregarLocais();
    carregarAlertas();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Alertas Meteorológicos</h1>
          <p className="page-description">
            Visualize faixas críticas identificadas nos registros
            meteorológicos, como temperatura elevada, umidade baixa, vento
            forte, chuva intensa e radiação solar elevada.
          </p>
        </div>

        <div className="dashboard-actions">
          <button type="button" onClick={atualizar}>
            <RefreshCcw size={18} />
            Atualizar
          </button>
        </div>
      </div>

      {erro && <div className="message-box error-message">{erro}</div>}
      {mensagem && <div className="message-box">{mensagem}</div>}

      <div className="executive-hero">
        <div>
          <span className="hero-label">MeteoTrack V2</span>
          <h2>Central de alertas críticos</h2>
          <p>
            Os alertas são gerados automaticamente a partir dos registros
            históricos, considerando limites técnicos definidos para cada
            variável meteorológica.
          </p>
        </div>

        <div className="executive-hero-icon">
          <AlertTriangle size={48} />
        </div>
      </div>

      <div className="cards-grid">
        <div className="card metric-card">
          <span>Total de alertas</span>
          <strong>{totalAlertas}</strong>
        </div>

        <div className="card metric-card">
          <span>Alertas críticos</span>
          <strong>{totalCriticos}</strong>
        </div>

        <div className="card metric-card">
          <span>Alertas de atenção</span>
          <strong>{totalAtencao}</strong>
        </div>

        <div className="card metric-card">
          <span>Registros analisados</span>
          <strong>{registros.length}</strong>
        </div>
      </div>

      <form className="records-filter-card" onSubmit={aplicarFiltros}>
        <div className="form-header">
          <div>
            <h3>Filtros de alertas</h3>
            <p>Filtre os alertas por local monitorado e período.</p>
          </div>

          <Filter size={26} />
        </div>

        <div className="form-group">
          <label>Local monitorado</label>
          <select value={localId} onChange={(e) => setLocalId(e.target.value)}>
            <option value="">Todos os locais</option>

            {locais.map((local) => (
              <option key={local.id} value={local.id}>
                {local.nome} - {local.cidade}
                {local.estado ? `/${local.estado}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Data inicial</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Data final</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-button">
          <Search size={18} />
          Filtrar alertas
        </button>

        <button type="button" className="secondary-button" onClick={limparFiltros}>
          Limpar
        </button>
      </form>

      <div className="records-summary-grid">
        <div className="records-summary-card">
          <Thermometer size={24} />
          <div>
            <span>Temperatura elevada</span>
            <strong>{contarPorTipo(alertas, "Temperatura elevada")}</strong>
          </div>
        </div>

        <div className="records-summary-card">
          <Droplets size={24} />
          <div>
            <span>Umidade baixa</span>
            <strong>{contarPorTipo(alertas, "Umidade baixa")}</strong>
          </div>
        </div>

        <div className="records-summary-card">
          <Wind size={24} />
          <div>
            <span>Vento forte</span>
            <strong>{contarPorTipo(alertas, "Vento forte")}</strong>
          </div>
        </div>

        <div className="records-summary-card">
          <CloudRain size={24} />
          <div>
            <span>Chuva intensa</span>
            <strong>{contarPorTipo(alertas, "Chuva intensa")}</strong>
          </div>
        </div>

        <div className="records-summary-card">
          <Sun size={24} />
          <div>
            <span>Radiação elevada</span>
            <strong>{contarPorTipo(alertas, "Radiação solar elevada")}</strong>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="table-card">
          <p>Carregando alertas meteorológicos...</p>
        </div>
      ) : alertas.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={42} />
          <h3>Nenhum alerta encontrado</h3>
          <p>
            Não foram identificadas faixas críticas nos registros consultados.
          </p>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nível</th>
                <th>Local</th>
                <th>Cidade</th>
                <th>Valor</th>
                <th>Limite</th>
                <th>Data/Hora</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {alertas.map((alerta) => (
                <tr key={alerta.id}>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {obterIconeAlerta(alerta.tipo)}
                      {alerta.tipo}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`origin-badge origin-${obterClasseNivel(
                        alerta.nivel
                      )}`}
                    >
                      {alerta.nivel}
                    </span>
                  </td>

                  <td>{alerta.local_nome}</td>
                  <td>
                    {alerta.cidade}
                    {alerta.estado ? `/${alerta.estado}` : ""}
                  </td>
                  <td>{alerta.valor}</td>
                  <td>{alerta.limite}</td>
                  <td>{formatarData(alerta.data_hora)}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <XCircle size={16} />
                      Ativo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="dashboard-panels-grid" style={{ marginTop: 24 }}>
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Critérios utilizados</h2>
              <p>Faixas críticas usadas para gerar os alertas.</p>
            </div>

            <AlertTriangle size={24} />
          </div>

          <div className="last-records-list">
            <div className="last-record-item">
              <div>
                <strong>Temperatura elevada</strong>
                <span>Acima ou igual a 35°C</span>
              </div>
            </div>

            <div className="last-record-item">
              <div>
                <strong>Umidade baixa</strong>
                <span>Abaixo ou igual a 30%</span>
              </div>
            </div>

            <div className="last-record-item">
              <div>
                <strong>Vento forte</strong>
                <span>Acima ou igual a 50 km/h</span>
              </div>
            </div>

            <div className="last-record-item">
              <div>
                <strong>Chuva intensa</strong>
                <span>Acima ou igual a 20 mm</span>
              </div>
            </div>

            <div className="last-record-item">
              <div>
                <strong>Radiação solar elevada</strong>
                <span>Acima ou igual a 800 W/m²</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Observação técnica</h2>
              <p>Como os alertas são calculados.</p>
            </div>

            <CalendarDays size={24} />
          </div>

          <div className="panel-empty">
            Os alertas desta tela são calculados a partir dos registros
            meteorológicos já salvos no sistema. Na V2, eles funcionam como uma
            análise técnica das faixas críticas e não exigem uma coleção própria
            no banco de dados.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alertas;