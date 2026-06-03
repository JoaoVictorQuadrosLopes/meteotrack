import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CloudSun,
  Compass,
  Database,
  Droplets,
  MapPin,
  RefreshCcw,
  Save,
  Sun,
  Wind,
  Zap
} from "lucide-react";

import api from "../services/api";
import { calcularAnaliseTecnica } from "../utils/analiseTecnica";

function Dashboard() {
  const navigate = useNavigate();

  const [locaisComClima, setLocaisComClima] = useState([]);
  const [registrosGerais, setRegistrosGerais] = useState([]);
  const [resumoTecnico, setResumoTecnico] = useState(null);
  const [alertasResumo, setAlertasResumo] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [coletandoTodos, setColetandoTodos] = useState(false);
  const [coletandoLocalId, setColetandoLocalId] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function formatarNumero(valor, casas = 1) {
    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return "--";
    }

    return numero.toFixed(casas);
  }

  function formatarData(data) {
    if (!data) return "--";
    return new Date(data).toLocaleString("pt-BR");
  }

  function obterRadiacaoSolar(clima) {
    const valor =
      clima?.radiacao_solar ??
      clima?.shortwave_radiation ??
      clima?.solar_radiation ??
      0;

    return Number(valor);
  }

  function hojeISO() {
    return new Date().toISOString().slice(0, 10);
  }

  async function buscarUltimoRegistroDoLocal(localId) {
    try {
      const response = await api.get("/registros", {
        params: {
          local_id: localId
        }
      });

      return response.data?.[0] || null;
    } catch (error) {
      console.error("Erro ao buscar último registro do local:", error);
      return null;
    }
  }

  async function carregarRegistrosGerais() {
    try {
      const response = await api.get("/registros");
      const registros = response.data || [];

      setRegistrosGerais(registros);

      const analise = calcularAnaliseTecnica(registros);
      setResumoTecnico(analise);

      return {
        registros,
        analise
      };
    } catch (error) {
      console.error("Erro ao carregar registros:", error);

      return {
        registros: [],
        analise: calcularAnaliseTecnica([])
      };
    }
  }

  function gerarAlertasResumo(locais, analiseTecnica) {
    const alertas = [];

    locais.forEach((local) => {
      if (!local.clima) return;

      const temperatura = Number(local.clima.temperature_2m || 0);
      const umidade = Number(local.clima.relative_humidity_2m || 0);
      const vento = Number(local.clima.wind_speed_10m || 0);
      const chuva = Number(local.clima.precipitation || 0);
      const radiacaoSolar = obterRadiacaoSolar(local.clima);

      if (temperatura >= 35) {
        alertas.push({
          tipo: "Temperatura elevada",
          local: local.nome,
          valor: `${formatarNumero(temperatura)}°C`
        });
      }

      if (umidade > 0 && umidade <= 30) {
        alertas.push({
          tipo: "Umidade baixa",
          local: local.nome,
          valor: `${formatarNumero(umidade)}%`
        });
      }

      if (vento >= 50) {
        alertas.push({
          tipo: "Vento forte",
          local: local.nome,
          valor: `${formatarNumero(vento)} km/h`
        });
      }

      if (chuva >= 20) {
        alertas.push({
          tipo: "Chuva intensa",
          local: local.nome,
          valor: `${formatarNumero(chuva)} mm`
        });
      }

      if (radiacaoSolar >= 800) {
        alertas.push({
          tipo: "Radiação solar elevada",
          local: local.nome,
          valor: `${formatarNumero(radiacaoSolar)} W/m²`
        });
      }
    });

    if (analiseTecnica?.alertas?.length > 0) {
      analiseTecnica.alertas.slice(0, 3).forEach((alerta) => {
        alertas.push({
          tipo: alerta.tipo,
          local: "Histórico",
          valor: alerta.valor
        });
      });
    }

    setAlertasResumo(alertas.slice(0, 3));
  }

  async function carregarDashboard() {
    try {
      setCarregando(true);
      setErro("");
      setMensagem("");

      const [{ registros, analise }, responseLocais] = await Promise.all([
        carregarRegistrosGerais(),
        api.get("/locais")
      ]);

      const locais = responseLocais.data || [];

      const dadosComClima = await Promise.all(
        locais.map(async (local) => {
          try {
            const responseClima = await api.get("/weather/atual", {
              params: {
                latitude: local.latitude,
                longitude: local.longitude
              }
            });

            const climaAtual = responseClima.data.current || {};
            const ultimoRegistro = await buscarUltimoRegistroDoLocal(local.id);

            const radiacaoSolar =
              climaAtual.radiacao_solar ??
              climaAtual.shortwave_radiation ??
              ultimoRegistro?.radiacao_solar ??
              0;

            return {
              ...local,
              clima: {
                ...climaAtual,
                radiacao_solar: Number(radiacaoSolar),
                shortwave_radiation: Number(radiacaoSolar)
              },
              ultimoRegistro,
              erroClima: false
            };
          } catch (error) {
            console.error("Erro ao buscar clima do local:", local.nome, error);

            return {
              ...local,
              clima: null,
              ultimoRegistro: null,
              erroClima: true
            };
          }
        })
      );

      setLocaisComClima(dadosComClima);
      setResumoTecnico(analise);
      setRegistrosGerais(registros);
      gerarAlertasResumo(dadosComClima, analise);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      setErro("Não foi possível carregar os dados da dashboard.");
    } finally {
      setCarregando(false);
    }
  }

  async function salvarRegistroLocal(localId) {
    try {
      setMensagem("");
      setErro("");
      setColetandoLocalId(localId);

      const response = await api.post(`/registros/coletar/${localId}`);

      setMensagem(response.data.mensagem || "Registro salvo com sucesso.");

      await carregarDashboard();
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      setErro("Não foi possível salvar o registro deste local.");
    } finally {
      setColetandoLocalId("");
    }
  }

  async function salvarTodosRegistros() {
    try {
      setMensagem("");
      setErro("");
      setColetandoTodos(true);

      const response = await api.post("/registros/coletar-todos");

      setMensagem(
        `Coleta finalizada: ${response.data.sucessos} sucesso(s) e ${response.data.falhas} falha(s).`
      );

      await carregarDashboard();
    } catch (error) {
      console.error("Erro ao coletar todos:", error);
      setErro("Não foi possível coletar os registros de todos os locais.");
    } finally {
      setColetandoTodos(false);
    }
  }

  function calcularResumoAtual() {
    const locaisValidos = locaisComClima.filter((item) => item.clima);

    const temperaturas = locaisValidos
      .map((item) => Number(item.clima?.temperature_2m))
      .filter((valor) => !Number.isNaN(valor));

    const umidades = locaisValidos
      .map((item) => Number(item.clima?.relative_humidity_2m))
      .filter((valor) => !Number.isNaN(valor));

    const ventos = locaisValidos
      .map((item) => Number(item.clima?.wind_speed_10m))
      .filter((valor) => !Number.isNaN(valor));

    const radiacoes = locaisValidos
      .map((item) => obterRadiacaoSolar(item.clima))
      .filter((valor) => !Number.isNaN(valor));

    const media = (lista) => {
      if (lista.length === 0) return "--";

      const soma = lista.reduce((total, valor) => total + valor, 0);
      return (soma / lista.length).toFixed(1);
    };

    const registrosHoje = registrosGerais.filter((registro) => {
      if (!registro.data_hora) return false;

      return new Date(registro.data_hora).toISOString().slice(0, 10) === hojeISO();
    });

    return {
      totalLocais: locaisComClima.length,
      totalRegistros: registrosGerais.length,
      registrosHoje: registrosHoje.length,
      alertasAtivos: alertasResumo.length,
      temperaturaMedia: media(temperaturas),
      umidadeMedia: media(umidades),
      ventoMedio: media(ventos),
      radiacaoMedia: media(radiacoes)
    };
  }

  const resumo = calcularResumoAtual();

  useEffect(() => {
    carregarDashboard();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Dashboard V2</h1>
          <p className="page-description">
            Visão geral do monitoramento, análise técnica, potencial solar e
            alertas.
          </p>
        </div>

        <div className="dashboard-actions">
          <button type="button" onClick={carregarDashboard}>
            <RefreshCcw size={18} />
            Atualizar
          </button>

          <button
            type="button"
            onClick={salvarTodosRegistros}
            disabled={coletandoTodos || locaisComClima.length === 0}
          >
            <Database size={18} />
            {coletandoTodos ? "Coletando..." : "Coletar todos"}
          </button>
        </div>
      </div>

      {erro && <div className="message-box error-message">{erro}</div>}
      {mensagem && <div className="message-box">{mensagem}</div>}

      {carregando ? (
        <div className="table-card">
          <p>Carregando dashboard...</p>
        </div>
      ) : (
        <>
          <div className="executive-hero">
            <div>
              <span className="hero-label">MeteoTrack V2</span>
              <h2>Resumo inteligente do sistema</h2>
              <p>
                Dados atuais, registros históricos, potencial solar, vento
                predominante e alertas críticos em uma visão limpa.
              </p>
            </div>

            <div className="executive-hero-icon">
              <Activity size={48} />
            </div>
          </div>

          <div className="cards-grid">
            <div className="card metric-card">
              <span>Locais monitorados</span>
              <strong>{resumo.totalLocais}</strong>
            </div>

            <div className="card metric-card">
              <span>Registros hoje</span>
              <strong>{resumo.registrosHoje}</strong>
            </div>

            <div className="card metric-card">
              <span>Total de registros</span>
              <strong>{resumo.totalRegistros}</strong>
            </div>

            <div className="card metric-card">
              <span>Alertas ativos</span>
              <strong>{resumo.alertasAtivos}</strong>
            </div>
          </div>

          <div className="dashboard-panels-grid">
            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Condições atuais</h2>
                  <p>Média dos locais monitorados em tempo real.</p>
                </div>

                <CloudSun size={24} />
              </div>

              <div className="records-summary-grid">
                <div className="records-summary-card">
                  <CloudSun size={22} />
                  <div>
                    <span>Temperatura média</span>
                    <strong>
                      {resumo.temperaturaMedia === "--"
                        ? "--"
                        : `${resumo.temperaturaMedia}°C`}
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Droplets size={22} />
                  <div>
                    <span>Umidade média</span>
                    <strong>
                      {resumo.umidadeMedia === "--"
                        ? "--"
                        : `${resumo.umidadeMedia}%`}
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Wind size={22} />
                  <div>
                    <span>Vento médio</span>
                    <strong>
                      {resumo.ventoMedio === "--"
                        ? "--"
                        : `${resumo.ventoMedio} km/h`}
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Sun size={22} />
                  <div>
                    <span>Radiação média</span>
                    <strong>
                      {resumo.radiacaoMedia === "--"
                        ? "--"
                        : `${resumo.radiacaoMedia} W/m²`}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Análise técnica V2</h2>
                  <p>Potencial solar, energia estimada e vento predominante.</p>
                </div>

                <BarChart3 size={24} />
              </div>

              <div className="records-summary-grid">
                <div className="records-summary-card">
                  <Sun size={22} />
                  <div>
                    <span>Potencial solar</span>
                    <strong>{resumoTecnico?.potencialSolar || "Sem dados"}</strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Zap size={22} />
                  <div>
                    <span>Energia estimada</span>
                    <strong>
                      {resumoTecnico
                        ? `${formatarNumero(
                            resumoTecnico.energiaSolarEstimada,
                            2
                          )} kWh/dia`
                        : "--"}
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Compass size={22} />
                  <div>
                    <span>Vento predominante</span>
                    <strong>
                      {resumoTecnico?.ventoPredominante?.direcao ||
                        "Indefinido"}
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <AlertTriangle size={22} />
                  <div>
                    <span>Alertas no histórico</span>
                    <strong>{resumoTecnico?.alertas?.length || 0}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="details-button"
                onClick={() => navigate("/analises")}
              >
                Ver análise completa
              </button>
            </div>
          </div>

          <div className="dashboard-panels-grid">
            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Alertas recentes</h2>
                  <p>Principais faixas críticas identificadas.</p>
                </div>

                <AlertTriangle size={24} />
              </div>

              {alertasResumo.length === 0 ? (
                <div className="panel-empty">
                  Nenhum alerta crítico identificado.
                </div>
              ) : (
                <div className="dashboard-alert-list">
                  {alertasResumo.map((alerta, index) => (
                    <div className="dashboard-alert-item" key={index}>
                      <div>
                        <strong>{alerta.tipo}</strong>
                        <span>{alerta.local}</span>
                      </div>

                      <b>{alerta.valor}</b>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="details-button"
                onClick={() => navigate("/relatorios")}
              >
                Gerar relatório técnico
              </button>
            </div>

            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Atalhos</h2>
                  <p>Acesse as áreas principais do sistema.</p>
                </div>

                <Database size={24} />
              </div>

              <div className="dashboard-actions" style={{ flexWrap: "wrap" }}>
                <button type="button" onClick={() => navigate("/registros")}>
                  <Database size={18} />
                  Registros
                </button>

                <button type="button" onClick={() => navigate("/analises")}>
                  <BarChart3 size={18} />
                  Análises
                </button>

                <button type="button" onClick={() => navigate("/relatorios")}>
                  <AlertTriangle size={18} />
                  Relatórios
                </button>

                <button type="button" onClick={() => navigate("/mapa")}>
                  <MapPin size={18} />
                  Mapa
                </button>
              </div>
            </div>
          </div>

          <div className="section-title">
            <CloudSun size={22} />
            <h2>Locais monitorados</h2>
          </div>

          {locaisComClima.length === 0 ? (
            <div className="empty-state">
              <MapPin size={42} />
              <h3>Nenhum local cadastrado</h3>
              <p>
                Cadastre um local na tela “Locais Monitorados” para visualizar
                os dados aqui.
              </p>
            </div>
          ) : (
            <div className="weather-grid">
              {locaisComClima.map((local) => (
                <div className="weather-card clickable-card" key={local.id}>
                  <div className="weather-card-header">
                    <div>
                      <h3>{local.nome}</h3>
                      <p>
                        {local.cidade}
                        {local.estado ? ` - ${local.estado}` : ""}
                      </p>
                    </div>

                    <div className="weather-icon">
                      <CloudSun size={28} />
                    </div>
                  </div>

                  {local.erroClima ? (
                    <div className="weather-error">
                      Não foi possível carregar o clima deste local.
                    </div>
                  ) : (
                    <>
                      <div className="temperature-display">
                        <strong>{local.clima?.temperature_2m ?? "--"}°C</strong>
                        <span>
                          Radiação:{" "}
                          {local.clima
                            ? `${formatarNumero(
                                obterRadiacaoSolar(local.clima)
                              )} W/m²`
                            : "--"}
                        </span>
                      </div>

                      <div className="weather-info-grid">
                        <div className="weather-info-item">
                          <Droplets size={18} />
                          <div>
                            <span>Umidade</span>
                            <strong>
                              {local.clima?.relative_humidity_2m ?? "--"}%
                            </strong>
                          </div>
                        </div>

                        <div className="weather-info-item">
                          <Wind size={18} />
                          <div>
                            <span>Vento</span>
                            <strong>
                              {local.clima?.wind_speed_10m ?? "--"} km/h
                            </strong>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="save-weather-button"
                        onClick={() => salvarRegistroLocal(local.id)}
                        disabled={coletandoLocalId === local.id}
                      >
                        <Save size={18} />
                        {coletandoLocalId === local.id
                          ? "Salvando..."
                          : "Salvar registro"}
                      </button>

                      <button
                        type="button"
                        className="details-button"
                        onClick={() => navigate(`/local/${local.id}`)}
                      >
                        Ver detalhes
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;