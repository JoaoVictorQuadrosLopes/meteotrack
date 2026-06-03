import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CloudSun,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  MapPin,
  RefreshCcw,
  Save,
  Database,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
  Radio,
  Sun,
  Zap,
  Compass,
  BarChart3,
  Thermometer,
  CalendarDays,
  FileText
} from "lucide-react";

import api from "../services/api";
import { calcularAnaliseTecnica } from "../utils/analiseTecnica";

function Dashboard() {
  const navigate = useNavigate();

  const [estacoesLocais, setEstacoesLocais] = useState([]);
  const [locaisComClima, setLocaisComClima] = useState([]);
  const [ultimosRegistros, setUltimosRegistros] = useState([]);
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
    const hoje = new Date();
    return hoje.toISOString().slice(0, 10);
  }

  async function carregarEstacoesLocais() {
    try {
      const response = await api.get("/estacoes");
      setEstacoesLocais(response.data);
    } catch (error) {
      console.error("Erro ao carregar estações locais:", error);
    }
  }

  async function carregarRegistrosGerais() {
    try {
      const response = await api.get("/registros");
      const registros = response.data || [];

      setRegistrosGerais(registros);
      setUltimosRegistros(registros.slice(0, 5));
      setResumoTecnico(calcularAnaliseTecnica(registros));

      return registros;
    } catch (error) {
      console.error("Erro ao carregar registros gerais:", error);
      return [];
    }
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
          cidade: local.cidade,
          valor: `${formatarNumero(temperatura)}°C`,
          nivel: "Crítico"
        });
      }

      if (umidade > 0 && umidade <= 30) {
        alertas.push({
          tipo: "Umidade baixa",
          local: local.nome,
          cidade: local.cidade,
          valor: `${formatarNumero(umidade)}%`,
          nivel: "Atenção"
        });
      }

      if (vento >= 50) {
        alertas.push({
          tipo: "Vento forte",
          local: local.nome,
          cidade: local.cidade,
          valor: `${formatarNumero(vento)} km/h`,
          nivel: "Crítico"
        });
      }

      if (chuva >= 20) {
        alertas.push({
          tipo: "Chuva intensa",
          local: local.nome,
          cidade: local.cidade,
          valor: `${formatarNumero(chuva)} mm`,
          nivel: "Atenção"
        });
      }

      if (radiacaoSolar >= 800) {
        alertas.push({
          tipo: "Radiação solar elevada",
          local: local.nome,
          cidade: local.cidade,
          valor: `${formatarNumero(radiacaoSolar)} W/m²`,
          nivel: "Crítico"
        });
      }
    });

    if (analiseTecnica?.alertas?.length > 0) {
      analiseTecnica.alertas.slice(0, 3).forEach((alerta) => {
        alertas.push({
          tipo: alerta.tipo,
          local: "Histórico",
          cidade: "Registros",
          valor: alerta.valor,
          nivel: alerta.nivel
        });
      });
    }

    setAlertasResumo(alertas.slice(0, 6));
  }

  async function carregarMonitoramento() {
    try {
      setCarregando(true);
      setErro("");
      setMensagem("");

      const [responseLocais, registros] = await Promise.all([
        api.get("/locais"),
        carregarRegistrosGerais()
      ]);

      const locais = responseLocais.data || [];
      const analiseTecnica = calcularAnaliseTecnica(registros);

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
      setResumoTecnico(analiseTecnica);
      gerarAlertasResumo(dadosComClima, analiseTecnica);

      await carregarEstacoesLocais();
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

      await carregarMonitoramento();
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

      await carregarMonitoramento();
    } catch (error) {
      console.error("Erro ao coletar todos:", error);
      setErro("Não foi possível coletar os registros de todos os locais.");
    } finally {
      setColetandoTodos(false);
    }
  }

  function calcularResumoClimaAtual() {
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

    const calcularMedia = (lista) => {
      if (lista.length === 0) return "--";

      const soma = lista.reduce((total, valor) => total + valor, 0);
      return (soma / lista.length).toFixed(1);
    };

    const localMaisQuente = [...locaisValidos]
      .filter((item) => !Number.isNaN(Number(item.clima?.temperature_2m)))
      .sort(
        (a, b) =>
          Number(b.clima.temperature_2m) - Number(a.clima.temperature_2m)
      )[0];

    const localMaisFrio = [...locaisValidos]
      .filter((item) => !Number.isNaN(Number(item.clima?.temperature_2m)))
      .sort(
        (a, b) =>
          Number(a.clima.temperature_2m) - Number(b.clima.temperature_2m)
      )[0];

    const maiorVento = [...locaisValidos]
      .filter((item) => !Number.isNaN(Number(item.clima?.wind_speed_10m)))
      .sort(
        (a, b) =>
          Number(b.clima.wind_speed_10m) - Number(a.clima.wind_speed_10m)
      )[0];

    const maiorRadiacaoSolar = [...locaisValidos]
      .filter((item) => !Number.isNaN(obterRadiacaoSolar(item.clima)))
      .sort(
        (a, b) => obterRadiacaoSolar(b.clima) - obterRadiacaoSolar(a.clima)
      )[0];

    const dataHoje = hojeISO();

    const registrosHoje = registrosGerais.filter((registro) => {
      if (!registro.data_hora) return false;
      return new Date(registro.data_hora).toISOString().slice(0, 10) === dataHoje;
    });

    return {
      temperaturaMedia: calcularMedia(temperaturas),
      umidadeMedia: calcularMedia(umidades),
      ventoMedio: calcularMedia(ventos),
      radiacaoSolarMedia: calcularMedia(radiacoes),
      totalLocais: locaisComClima.length,
      totalRegistros: registrosGerais.length,
      registrosHoje: registrosHoje.length,
      totalEstacoes: estacoesLocais.length,
      alertasAtivos: alertasResumo.length,
      localMaisQuente,
      localMaisFrio,
      maiorVento,
      maiorRadiacaoSolar
    };
  }

  function calcularStatusEstacao(estacao) {
    if (!estacao.ultima_leitura_em) {
      return {
        texto: "Sem leitura",
        classe: "offline"
      };
    }

    const ultimaLeitura = new Date(estacao.ultima_leitura_em);
    const agora = new Date();

    const diferencaMinutos = Math.floor((agora - ultimaLeitura) / 1000 / 60);

    if (diferencaMinutos <= 5) {
      return {
        texto: "Online",
        classe: "online"
      };
    }

    if (diferencaMinutos <= 30) {
      return {
        texto: "Recente",
        classe: "warning"
      };
    }

    return {
      texto: "Offline",
      classe: "offline"
    };
  }

  const resumo = calcularResumoClimaAtual();

  useEffect(() => {
    carregarMonitoramento();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Dashboard V2</h1>
          <p className="page-description">
            Painel completo com monitoramento, análise técnica, potencial solar,
            alertas e vento predominante.
          </p>
        </div>

        <div className="dashboard-actions">
          <button type="button" onClick={carregarMonitoramento}>
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

      <div className="executive-hero">
        <div>
          <span className="hero-label">MeteoTrack V2</span>
          <h2>Central de análise meteorológica técnica</h2>
          <p>
            Acompanhe dados atuais, registros históricos, radiação solar,
            potencial fotovoltaico, alertas críticos e vento predominante.
          </p>
        </div>

        <div className="executive-hero-icon">
          <Activity size={48} />
        </div>
      </div>

      {carregando ? (
        <div className="table-card">
          <p>Carregando dashboard completa...</p>
        </div>
      ) : (
        <>
          <div className="cards-grid">
            <div className="card metric-card">
              <span>Locais monitorados</span>
              <strong>{resumo.totalLocais}</strong>
            </div>

            <div className="card metric-card">
              <span>Total de registros</span>
              <strong>{resumo.totalRegistros}</strong>
            </div>

            <div className="card metric-card">
              <span>Registros hoje</span>
              <strong>{resumo.registrosHoje}</strong>
            </div>

            <div className="card metric-card">
              <span>Estações locais</span>
              <strong>{resumo.totalEstacoes}</strong>
            </div>

            <div className="card metric-card">
              <span>Alertas ativos</span>
              <strong>{resumo.alertasAtivos}</strong>
            </div>

            <div className="card metric-card">
              <span>Temperatura média</span>
              <strong>
                {resumo.temperaturaMedia === "--"
                  ? "--"
                  : `${resumo.temperaturaMedia}°C`}
              </strong>
            </div>

            <div className="card metric-card">
              <span>Umidade média</span>
              <strong>
                {resumo.umidadeMedia === "--" ? "--" : `${resumo.umidadeMedia}%`}
              </strong>
            </div>

            <div className="card metric-card">
              <span>Vento médio</span>
              <strong>
                {resumo.ventoMedio === "--" ? "--" : `${resumo.ventoMedio} km/h`}
              </strong>
            </div>

            <div className="card metric-card">
              <span>Radiação solar média</span>
              <strong>
                {resumo.radiacaoSolarMedia === "--"
                  ? "--"
                  : `${resumo.radiacaoSolarMedia} W/m²`}
              </strong>
            </div>

            <div className="card metric-card">
              <span>Potencial solar geral</span>
              <strong>{resumoTecnico?.potencialSolar || "Sem dados"}</strong>
            </div>

            <div className="card metric-card">
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

            <div className="card metric-card">
              <span>Vento predominante</span>
              <strong>
                {resumoTecnico?.ventoPredominante?.direcao || "Indefinido"}
              </strong>
            </div>
          </div>

          <div className="executive-grid">
            <div className="executive-card">
              <div className="executive-card-icon hot">
                <TrendingUp size={24} />
              </div>

              <div>
                <span>Local mais quente</span>
                <strong>
                  {resumo.localMaisQuente
                    ? `${resumo.localMaisQuente.clima.temperature_2m}°C`
                    : "--"}
                </strong>
                <p>
                  {resumo.localMaisQuente
                    ? `${resumo.localMaisQuente.nome} — ${resumo.localMaisQuente.cidade}`
                    : "Nenhum dado disponível"}
                </p>
              </div>
            </div>

            <div className="executive-card">
              <div className="executive-card-icon cold">
                <TrendingDown size={24} />
              </div>

              <div>
                <span>Local mais frio</span>
                <strong>
                  {resumo.localMaisFrio
                    ? `${resumo.localMaisFrio.clima.temperature_2m}°C`
                    : "--"}
                </strong>
                <p>
                  {resumo.localMaisFrio
                    ? `${resumo.localMaisFrio.nome} — ${resumo.localMaisFrio.cidade}`
                    : "Nenhum dado disponível"}
                </p>
              </div>
            </div>

            <div className="executive-card">
              <div className="executive-card-icon wind">
                <Wind size={24} />
              </div>

              <div>
                <span>Maior vento atual</span>
                <strong>
                  {resumo.maiorVento
                    ? `${resumo.maiorVento.clima.wind_speed_10m} km/h`
                    : "--"}
                </strong>
                <p>
                  {resumo.maiorVento
                    ? `${resumo.maiorVento.nome} — ${resumo.maiorVento.cidade}`
                    : "Nenhum dado disponível"}
                </p>
              </div>
            </div>

            <div className="executive-card">
              <div className="executive-card-icon">
                <Sun size={24} />
              </div>

              <div>
                <span>Maior radiação atual</span>
                <strong>
                  {resumo.maiorRadiacaoSolar
                    ? `${formatarNumero(
                        obterRadiacaoSolar(resumo.maiorRadiacaoSolar.clima)
                      )} W/m²`
                    : "--"}
                </strong>
                <p>
                  {resumo.maiorRadiacaoSolar
                    ? `${resumo.maiorRadiacaoSolar.nome} — ${resumo.maiorRadiacaoSolar.cidade}`
                    : "Nenhum dado disponível"}
                </p>
              </div>
            </div>
          </div>

          <div className="records-summary-grid">
            <div className="records-summary-card">
              <Sun size={24} />
              <div>
                <span>Análise solar</span>
                <strong>{resumoTecnico?.potencialSolar || "Sem dados"}</strong>
              </div>
            </div>

            <div className="records-summary-card">
              <Zap size={24} />
              <div>
                <span>Estimativa fotovoltaica</span>
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
              <Compass size={24} />
              <div>
                <span>Vento predominante histórico</span>
                <strong>
                  {resumoTecnico?.ventoPredominante?.direcao || "Indefinido"}
                  {resumoTecnico
                    ? ` (${formatarNumero(
                        resumoTecnico.ventoPredominante.percentual
                      )}%)`
                    : ""}
                </strong>
              </div>
            </div>

            <div className="records-summary-card">
              <CloudRain size={24} />
              <div>
                <span>Chuva acumulada histórica</span>
                <strong>
                  {resumoTecnico
                    ? `${formatarNumero(resumoTecnico.chuvaTotal)} mm`
                    : "--"}
                </strong>
              </div>
            </div>

            <div className="records-summary-card">
              <Thermometer size={24} />
              <div>
                <span>Temperatura máxima histórica</span>
                <strong>
                  {resumoTecnico
                    ? `${formatarNumero(resumoTecnico.temperaturaMaxima)}°C`
                    : "--"}
                </strong>
              </div>
            </div>

            <div className="records-summary-card">
              <AlertTriangle size={24} />
              <div>
                <span>Faixas críticas no histórico</span>
                <strong>{resumoTecnico?.alertas?.length || 0} alerta(s)</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-panels-grid">
            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Alertas críticos</h2>
                  <p>Condições críticas atuais e históricas.</p>
                </div>

                <AlertTriangle size={24} />
              </div>

              {alertasResumo.length === 0 ? (
                <div className="panel-empty">
                  Nenhum alerta crítico identificado no momento.
                </div>
              ) : (
                <div className="dashboard-alert-list">
                  {alertasResumo.map((alerta, index) => (
                    <div className="dashboard-alert-item" key={index}>
                      <div>
                        <strong>{alerta.tipo}</strong>
                        <span>
                          {alerta.local} — {alerta.cidade}
                        </span>
                      </div>

                      <b>{alerta.valor}</b>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="details-button"
                onClick={() => navigate("/analises")}
              >
                Ver análise técnica
              </button>
            </div>

            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Últimos registros</h2>
                  <p>Dados mais recentes salvos no histórico.</p>
                </div>

                <Clock size={24} />
              </div>

              {ultimosRegistros.length === 0 ? (
                <div className="panel-empty">
                  Nenhum registro salvo até o momento.
                </div>
              ) : (
                <div className="last-records-list">
                  {ultimosRegistros.map((registro) => (
                    <div className="last-record-item" key={registro.id}>
                      <div>
                        <strong>{registro.local_nome}</strong>
                        <span>{formatarData(registro.data_hora)}</span>
                      </div>

                      <b>{formatarNumero(registro.temperatura)}°C</b>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="details-button"
                onClick={() => navigate("/registros")}
              >
                Ver registros
              </button>
            </div>
          </div>

          {estacoesLocais.length > 0 && (
            <>
              <div className="section-title">
                <Radio size={22} />
                <h2>Estações locais conectadas</h2>
              </div>

              <div className="local-stations-monitor-grid">
                {estacoesLocais.map((estacao) => {
                  const status = calcularStatusEstacao(estacao);

                  return (
                    <div className="local-station-monitor-card" key={estacao.id}>
                      <div className="local-station-top">
                        <div className="local-station-icon">
                          <Cpu size={26} />
                        </div>

                        <span className={`station-live-status ${status.classe}`}>
                          {status.texto}
                        </span>
                      </div>

                      <div className="local-station-header">
                        <h3>{estacao.nome}</h3>
                        <p>
                          {estacao.local_nome} — {estacao.cidade}
                          {estacao.estado ? `/${estacao.estado}` : ""}
                        </p>
                      </div>

                      <div className="temperature-display station-temperature-display">
                        <strong>
                          {estacao.ultima_temperatura !== undefined
                            ? `${formatarNumero(estacao.ultima_temperatura)}°C`
                            : "--"}
                        </strong>

                        <span>
                          Última leitura:{" "}
                          {estacao.ultima_leitura_em
                            ? formatarData(estacao.ultima_leitura_em)
                            : "Nunca recebeu dados"}
                        </span>
                      </div>

                      <div className="weather-info-grid">
                        <div className="weather-info-item">
                          <Droplets size={18} />
                          <div>
                            <span>Umidade</span>
                            <strong>
                              {estacao.ultima_umidade !== undefined
                                ? `${formatarNumero(estacao.ultima_umidade)}%`
                                : "--"}
                            </strong>
                          </div>
                        </div>

                        <div className="weather-info-item">
                          <Gauge size={18} />
                          <div>
                            <span>Pressão</span>
                            <strong>
                              {estacao.ultima_pressao !== undefined
                                ? `${formatarNumero(estacao.ultima_pressao)} hPa`
                                : "--"}
                            </strong>
                          </div>
                        </div>

                        <div className="weather-info-item">
                          <Wind size={18} />
                          <div>
                            <span>Vento</span>
                            <strong>
                              {estacao.ultima_vento_velocidade !== undefined
                                ? `${formatarNumero(
                                    estacao.ultima_vento_velocidade
                                  )} km/h`
                                : "--"}
                            </strong>
                          </div>
                        </div>

                        <div className="weather-info-item">
                          <CloudRain size={18} />
                          <div>
                            <span>Chuva</span>
                            <strong>
                              {estacao.ultima_precipitacao !== undefined
                                ? `${formatarNumero(
                                    estacao.ultima_precipitacao
                                  )} mm`
                                : "--"}
                            </strong>
                          </div>
                        </div>

                        <div className="weather-info-item">
                          <Sun size={18} />
                          <div>
                            <span>Radiação</span>
                            <strong>
                              {estacao.ultima_radiacao_solar !== undefined
                                ? `${formatarNumero(
                                    estacao.ultima_radiacao_solar
                                  )} W/m²`
                                : "--"}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="details-button"
                        onClick={() => navigate("/estacoes")}
                      >
                        Ver estação local
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {locaisComClima.length === 0 ? (
            <div className="empty-state">
              <MapPin size={42} />
              <h3>Nenhum local cadastrado</h3>
              <p>
                Cadastre um local na tela “Locais Monitorados” para visualizar os
                dados meteorológicos aqui.
              </p>
            </div>
          ) : (
            <>
              <div className="section-title">
                <CloudSun size={22} />
                <h2>Condições atuais por local</h2>
              </div>

              <div className="weather-grid">
                {locaisComClima.map((local) => (
                  <div
                    className="weather-card clickable-card"
                    key={local.id}
                    onDoubleClick={() => navigate(`/local/${local.id}`)}
                  >
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
                            Sensação: {local.clima?.apparent_temperature ?? "--"}°C
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

                          <div className="weather-info-item">
                            <Gauge size={18} />
                            <div>
                              <span>Pressão</span>
                              <strong>
                                {local.clima?.pressure_msl ?? "--"} hPa
                              </strong>
                            </div>
                          </div>

                          <div className="weather-info-item">
                            <CloudRain size={18} />
                            <div>
                              <span>Chuva</span>
                              <strong>
                                {local.clima?.precipitation ?? "--"} mm
                              </strong>
                            </div>
                          </div>

                          <div className="weather-info-item">
                            <Sun size={18} />
                            <div>
                              <span>Radiação Solar</span>
                              <strong>
                                {local.clima
                                  ? `${formatarNumero(
                                      obterRadiacaoSolar(local.clima)
                                    )} W/m²`
                                  : "--"}
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
                          Ver detalhes do local
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="dashboard-panels-grid">
            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Ações rápidas</h2>
                  <p>Acesse as áreas principais do sistema.</p>
                </div>

                <BarChart3 size={24} />
              </div>

              <div className="dashboard-actions" style={{ flexWrap: "wrap" }}>
                <button type="button" onClick={() => navigate("/analises")}>
                  <BarChart3 size={18} />
                  Análise técnica
                </button>

                <button type="button" onClick={() => navigate("/relatorios")}>
                  <FileText size={18} />
                  Relatórios
                </button>

                <button type="button" onClick={() => navigate("/registros")}>
                  <Database size={18} />
                  Registros
                </button>

                <button type="button" onClick={() => navigate("/mapa")}>
                  <MapPin size={18} />
                  Mapa
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;