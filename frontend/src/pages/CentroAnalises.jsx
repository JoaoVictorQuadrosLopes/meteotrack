import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer
} from "recharts";

import {
  BarChart3,
  Search,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  CalendarDays,
  Sun,
  Zap,
  AlertTriangle,
  Compass,
  Gauge
} from "lucide-react";

import api from "../services/api";
import { calcularAnaliseTecnica } from "../utils/analiseTecnica";

function CentroAnalises() {
  const [locais, setLocais] = useState([]);
  const [localId, setLocalId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [registros, setRegistros] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregarLocais() {
    try {
      const response = await api.get("/locais");

      setLocais(response.data);

      if (response.data.length > 0) {
        setLocalId(response.data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar locais:", error);
      setMensagem("Erro ao carregar locais cadastrados.");
    }
  }

  function formatarDataParaGrafico(data) {
    if (!data) return "--";

    const date = new Date(data);

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    });
  }

  function formatarDataCompleta(data) {
    if (!data) return "--";
    return new Date(data).toLocaleString("pt-BR");
  }

  function formatarNumero(valor, casas = 1) {
    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return "--";
    }

    return numero.toFixed(casas);
  }

  async function buscarAnalise(e) {
    if (e) e.preventDefault();

    if (!localId) {
      setMensagem("Selecione um local para analisar.");
      return;
    }

    if (!dataInicio || !dataFim) {
      setMensagem("Informe a data inicial e a data final.");
      return;
    }

    try {
      setCarregando(true);
      setMensagem("");

      await api.post(`/registros/coletar/${localId}`);

      const response = await api.get("/registros", {
        params: {
          local_id: localId,
          data_inicio: dataInicio,
          data_fim: dataFim
        }
      });

      const dadosOrdenados = [...response.data].sort((a, b) => {
        return new Date(a.data_hora) - new Date(b.data_hora);
      });

      setRegistros(dadosOrdenados);
      setResumo(calcularAnaliseTecnica(dadosOrdenados));

      if (dadosOrdenados.length === 0) {
        setMensagem("Nenhum registro encontrado no período selecionado.");
      } else {
        setMensagem("Análise técnica gerada com sucesso.");
      }
    } catch (error) {
      console.error("Erro ao buscar análise:", error);

      const erroApi =
        error.response?.data?.erro ||
        error.response?.data?.message ||
        error.message ||
        "Erro ao carregar análise meteorológica.";

      setMensagem(erroApi);
    } finally {
      setCarregando(false);
    }
  }

  function montarDadosGrafico() {
    return registros.map((registro) => ({
      data: formatarDataParaGrafico(registro.data_hora),
      dataCompleta: formatarDataCompleta(registro.data_hora),
      temperatura: Number(registro.temperatura || 0),
      umidade: Number(registro.umidade || 0),
      chuva: Number(registro.precipitacao || 0),
      vento: Number(registro.vento_velocidade || 0),
      pressao: Number(registro.pressao || 0),
      radiacaoSolar: Number(registro.radiacao_solar || 0)
    }));
  }

  function montarDadosVento() {
    if (!resumo?.ventoPredominante?.distribuicao) return [];

    return Object.entries(resumo.ventoPredominante.distribuicao)
      .filter(([direcao]) => direcao !== "Indefinido")
      .map(([direcao, quantidade]) => ({
        direcao,
        quantidade
      }));
  }

  const dadosGrafico = montarDadosGrafico();
  const dadosVento = montarDadosVento();

  useEffect(() => {
    carregarLocais();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Centro de Análises V2</h1>
          <p className="page-description">
            Análise técnica com potencial solar, estimativa fotovoltaica,
            vento predominante e alertas meteorológicos.
          </p>
        </div>
      </div>

      {mensagem && <div className="message-box">{mensagem}</div>}

      <form className="analysis-filter-card" onSubmit={buscarAnalise}>
        <div className="form-header">
          <div>
            <h3>Filtros da análise</h3>
            <p>Selecione um local e um período para gerar a análise técnica.</p>
          </div>

          <BarChart3 size={26} />
        </div>

        <div className="form-group">
          <label>Local monitorado</label>
          <select value={localId} onChange={(e) => setLocalId(e.target.value)}>
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

        <button type="submit" className="submit-button" disabled={carregando}>
          <Search size={18} />
          {carregando ? "Analisando..." : "Gerar análise técnica"}
        </button>
      </form>

      {resumo && (
        <>
          <div className="dashboard-panels-grid">
            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Resumo meteorológico</h2>
                  <p>Indicadores gerais do período selecionado.</p>
                </div>

                <CloudRain size={24} />
              </div>

              <div className="records-summary-grid">
                <div className="records-summary-card">
                  <Thermometer size={22} />
                  <div>
                    <span>Temperatura média</span>
                    <strong>{formatarNumero(resumo.temperaturaMedia)}°C</strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Droplets size={22} />
                  <div>
                    <span>Umidade média</span>
                    <strong>{formatarNumero(resumo.umidadeMedia)}%</strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <CloudRain size={22} />
                  <div>
                    <span>Chuva acumulada</span>
                    <strong>{formatarNumero(resumo.chuvaTotal)} mm</strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Gauge size={22} />
                  <div>
                    <span>Pressão média</span>
                    <strong>{formatarNumero(resumo.pressaoMedia)} hPa</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Potencial solar</h2>
                  <p>Análise de irradiância e estimativa fotovoltaica.</p>
                </div>

                <Sun size={24} />
              </div>

              <div className="records-summary-grid">
                <div className="records-summary-card">
                  <Sun size={22} />
                  <div>
                    <span>Radiação média</span>
                    <strong>
                      {formatarNumero(resumo.radiacaoSolarMedia)} W/m²
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Sun size={22} />
                  <div>
                    <span>Maior radiação</span>
                    <strong>
                      {formatarNumero(resumo.radiacaoSolarMaxima)} W/m²
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Zap size={22} />
                  <div>
                    <span>Potencial solar</span>
                    <strong>{resumo.potencialSolar}</strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Zap size={22} />
                  <div>
                    <span>Energia estimada</span>
                    <strong>
                      {formatarNumero(resumo.energiaSolarEstimada, 2)} kWh/dia
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-panels-grid">
            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Vento predominante</h2>
                  <p>Análise estatística da direção dos ventos.</p>
                </div>

                <Compass size={24} />
              </div>

              <div className="records-summary-grid">
                <div className="records-summary-card">
                  <Compass size={22} />
                  <div>
                    <span>Direção predominante</span>
                    <strong>{resumo.ventoPredominante.direcao}</strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Wind size={22} />
                  <div>
                    <span>Vento médio</span>
                    <strong>{formatarNumero(resumo.ventoMedio)} km/h</strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <BarChart3 size={22} />
                  <div>
                    <span>Frequência</span>
                    <strong>
                      {formatarNumero(resumo.ventoPredominante.percentual)}%
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <CalendarDays size={22} />
                  <div>
                    <span>Registros analisados</span>
                    <strong>{resumo.quantidade}</strong>
                  </div>
                </div>
              </div>

              <div className="chart-card" style={{ marginTop: 18 }}>
                <h3>
                  <Compass size={22} />
                  Distribuição do vento
                </h3>

                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dadosVento}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="direcao" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Ocorrências"]}
                    />
                    <Bar dataKey="quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Alertas do período</h2>
                  <p>Faixas críticas identificadas nos registros.</p>
                </div>

                <AlertTriangle size={24} />
              </div>

              <div className="records-summary-grid">
                <div className="records-summary-card">
                  <AlertTriangle size={22} />
                  <div>
                    <span>Total de alertas</span>
                    <strong>{resumo.alertas.length}</strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Thermometer size={22} />
                  <div>
                    <span>Maior temperatura</span>
                    <strong>
                      {formatarNumero(resumo.temperaturaMaxima)}°C
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Thermometer size={22} />
                  <div>
                    <span>Menor temperatura</span>
                    <strong>
                      {formatarNumero(resumo.temperaturaMinima)}°C
                    </strong>
                  </div>
                </div>
              </div>

              {resumo.alertas.length === 0 ? (
                <div className="panel-empty" style={{ marginTop: 18 }}>
                  Nenhuma faixa crítica foi identificada no período selecionado.
                </div>
              ) : (
                <div className="dashboard-alert-list" style={{ marginTop: 18 }}>
                  {resumo.alertas.slice(0, 5).map((alerta, index) => (
                    <div className="dashboard-alert-item" key={index}>
                      <div>
                        <strong>{alerta.tipo}</strong>
                        <span>{alerta.mensagem}</span>
                      </div>

                      <b>{alerta.valor}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="analytics-grid">
            <div className="chart-card">
              <h3>
                <Thermometer size={22} />
                Temperatura
              </h3>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosGrafico}>
                  <Line type="monotone" dataKey="temperatura" strokeWidth={3} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value}°C`, "Temperatura"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.dataCompleta || ""
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>
                <Droplets size={22} />
                Umidade
              </h3>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosGrafico}>
                  <Line type="monotone" dataKey="umidade" strokeWidth={3} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Umidade"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.dataCompleta || ""
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>
                <CloudRain size={22} />
                Chuva
              </h3>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} mm`, "Chuva"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.dataCompleta || ""
                    }
                  />
                  <Bar dataKey="chuva" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>
                <Sun size={22} />
                Radiação solar
              </h3>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosGrafico}>
                  <Line
                    type="monotone"
                    dataKey="radiacaoSolar"
                    strokeWidth={3}
                  />
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} W/m²`, "Radiação solar"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.dataCompleta || ""
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {!resumo && (
        <div className="empty-state">
          <CalendarDays size={42} />
          <h3>Nenhuma análise gerada</h3>
          <p>
            Selecione um local e um período para visualizar potencial solar,
            vento predominante, alertas e gráficos.
          </p>
        </div>
      )}
    </div>
  );
}

export default CentroAnalises;