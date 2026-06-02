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
  Compass
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

    return Object.entries(resumo.ventoPredominante.distribuicao).map(
      ([direcao, quantidade]) => ({
        direcao,
        quantidade
      })
    );
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
          <h1>Centro de Análises</h1>
          <p className="page-description">
            Analise registros meteorológicos, potencial solar, alertas críticos
            e vento predominante.
          </p>
        </div>
      </div>

      {mensagem && <div className="message-box">{mensagem}</div>}

      <form className="analysis-filter-card" onSubmit={buscarAnalise}>
        <div className="form-header">
          <div>
            <h3>Filtros da análise técnica</h3>
            <p>Escolha um local e um período para visualizar os indicadores.</p>
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
          {carregando ? "Analisando..." : "Gerar análise"}
        </button>
      </form>

      {resumo && (
        <>
          <div className="cards-grid">
            <div className="card">
              <span>Registros analisados</span>
              <strong>{resumo.quantidade}</strong>
            </div>

            <div className="card">
              <span>Temperatura média</span>
              <strong>{formatarNumero(resumo.temperaturaMedia)}°C</strong>
            </div>

            <div className="card">
              <span>Umidade média</span>
              <strong>{formatarNumero(resumo.umidadeMedia)}%</strong>
            </div>

            <div className="card">
              <span>Chuva acumulada</span>
              <strong>{formatarNumero(resumo.chuvaTotal)} mm</strong>
            </div>

            <div className="card">
              <span>Vento médio</span>
              <strong>{formatarNumero(resumo.ventoMedio)} km/h</strong>
            </div>

            <div className="card">
              <span>Pressão média</span>
              <strong>{formatarNumero(resumo.pressaoMedia)} hPa</strong>
            </div>

            <div className="card">
              <span>Radiação solar média</span>
              <strong>{formatarNumero(resumo.radiacaoSolarMedia)} W/m²</strong>
            </div>

            <div className="card">
              <span>Maior radiação solar</span>
              <strong>{formatarNumero(resumo.radiacaoSolarMaxima)} W/m²</strong>
            </div>

            <div className="card">
              <span>Potencial solar</span>
              <strong>{resumo.potencialSolar}</strong>
            </div>

            <div className="card">
              <span>Energia estimada</span>
              <strong>{formatarNumero(resumo.energiaSolarEstimada, 2)} kWh/dia</strong>
            </div>

            <div className="card">
              <span>Vento predominante</span>
              <strong>{resumo.ventoPredominante.direcao}</strong>
            </div>

            <div className="card">
              <span>Alertas críticos</span>
              <strong>{resumo.alertas.length}</strong>
            </div>
          </div>

          <div className="records-summary-grid">
            <div className="records-summary-card">
              <Sun size={24} />
              <div>
                <span>Análise solar</span>
                <strong>{resumo.potencialSolar}</strong>
              </div>
            </div>

            <div className="records-summary-card">
              <Zap size={24} />
              <div>
                <span>Estimativa fotovoltaica</span>
                <strong>
                  {formatarNumero(resumo.energiaSolarEstimada, 2)} kWh/dia
                </strong>
              </div>
            </div>

            <div className="records-summary-card">
              <Compass size={24} />
              <div>
                <span>Vento predominante</span>
                <strong>
                  {resumo.ventoPredominante.direcao} (
                  {formatarNumero(resumo.ventoPredominante.percentual)}%)
                </strong>
              </div>
            </div>

            <div className="records-summary-card">
              <AlertTriangle size={24} />
              <div>
                <span>Faixas críticas</span>
                <strong>{resumo.alertas.length} alerta(s)</strong>
              </div>
            </div>
          </div>

          {resumo.alertas.length > 0 && (
            <div className="analysis-alerts">
              <h2>Alertas identificados</h2>

              <div className="analysis-alerts-grid">
                {resumo.alertas.map((alerta, index) => (
                  <div className="analysis-alert-card" key={index}>
                    <strong>{alerta.tipo}</strong>
                    <p>{alerta.mensagem}</p>
                    <span>
                      Nível: {alerta.nivel} | Limite: {alerta.limite}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="analytics-grid">
            <div className="chart-card">
              <h3>
                <Thermometer size={22} />
                Variação de Temperatura
              </h3>

              <ResponsiveContainer width="100%" height={320}>
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
                Variação de Umidade
              </h3>

              <ResponsiveContainer width="100%" height={320}>
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
                Chuva por Registro
              </h3>

              <ResponsiveContainer width="100%" height={320}>
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
                <Wind size={22} />
                Velocidade do Vento
              </h3>

              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={dadosGrafico}>
                  <Line type="monotone" dataKey="vento" strokeWidth={3} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} km/h`, "Vento"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.dataCompleta || ""
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>
                <Sun size={22} />
                Radiação Solar
              </h3>

              <ResponsiveContainer width="100%" height={320}>
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

            <div className="chart-card">
              <h3>
                <Compass size={22} />
                Distribuição do Vento
              </h3>

              <ResponsiveContainer width="100%" height={320}>
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
        </>
      )}

      {!resumo && (
        <div className="empty-state">
          <CalendarDays size={42} />
          <h3>Nenhuma análise gerada</h3>
          <p>
            Selecione um local e um período para visualizar gráficos, alertas,
            potencial solar e vento predominante.
          </p>
        </div>
      )}
    </div>
  );
}

export default CentroAnalises;