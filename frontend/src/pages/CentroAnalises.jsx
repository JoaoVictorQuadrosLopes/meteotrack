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
  Gauge,
  CalendarDays
} from "lucide-react";

import api from "../services/api";

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

  function calcularResumo(registrosRecebidos) {
    if (!registrosRecebidos || registrosRecebidos.length === 0) {
      return {
        quantidade: 0,
        temperaturaMedia: 0,
        temperaturaMaxima: 0,
        temperaturaMinima: 0,
        umidadeMedia: 0,
        ventoMedio: 0,
        pressaoMedia: 0,
        chuvaTotal: 0
      };
    }

    const temperaturas = registrosRecebidos.map((r) =>
      Number(r.temperatura || 0)
    );

    const umidades = registrosRecebidos.map((r) =>
      Number(r.umidade || 0)
    );

    const ventos = registrosRecebidos.map((r) =>
      Number(r.vento_velocidade || 0)
    );

    const pressoes = registrosRecebidos.map((r) =>
      Number(r.pressao || 0)
    );

    const chuvas = registrosRecebidos.map((r) =>
      Number(r.precipitacao || 0)
    );

    const media = (lista) => {
      const soma = lista.reduce((total, item) => total + item, 0);
      return soma / lista.length;
    };

    const soma = (lista) => {
      return lista.reduce((total, item) => total + item, 0);
    };

    return {
      quantidade: registrosRecebidos.length,
      temperaturaMedia: media(temperaturas),
      temperaturaMaxima: Math.max(...temperaturas),
      temperaturaMinima: Math.min(...temperaturas),
      umidadeMedia: media(umidades),
      ventoMedio: media(ventos),
      pressaoMedia: media(pressoes),
      chuvaTotal: soma(chuvas)
    };
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

    // 1. Primeiro coleta e salva um registro novo no banco
    await api.post(`/registros/coletar/${localId}`);

    // 2. Depois busca os registros salvos no período
    const response = await api.get("/registros", {
      params: {
        local_id: localId,
        data_inicio: dataInicio,
        data_fim: dataFim
      }
    });

    const dados = response.data;

    const dadosOrdenados = [...dados].sort((a, b) => {
      return new Date(a.data_hora) - new Date(b.data_hora);
    });

    setRegistros(dadosOrdenados);
    setResumo(calcularResumo(dadosOrdenados));

    if (dadosOrdenados.length === 0) {
      setMensagem(
        "Registro coletado, mas nenhum dado foi encontrado dentro do período selecionado. Verifique as datas."
      );
    } else {
      setMensagem("Análise gerada e registro salvo com sucesso.");
    }
  } catch (error) {
    console.error("Erro ao buscar análise:", error);

    const erroApi =
      error.response?.data?.erro ||
      error.response?.data?.message ||
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
      pressao: Number(registro.pressao || 0)
    }));
  }

  function verificarAlertas() {
    if (!resumo || registros.length === 0) return [];

    const alertas = [];

    if (resumo.temperaturaMaxima >= 35) {
      alertas.push({
        tipo: "Temperatura elevada",
        mensagem: `Foi registrada temperatura máxima de ${formatarNumero(
          resumo.temperaturaMaxima
        )}°C.`
      });
    }

    if (resumo.umidadeMedia <= 30) {
      alertas.push({
        tipo: "Umidade baixa",
        mensagem: `A umidade média ficou em ${formatarNumero(
          resumo.umidadeMedia
        )}%.`
      });
    }

    if (resumo.ventoMedio >= 40) {
      alertas.push({
        tipo: "Vento forte",
        mensagem: `A velocidade média do vento foi de ${formatarNumero(
          resumo.ventoMedio
        )} km/h.`
      });
    }

    if (resumo.chuvaTotal >= 50) {
      alertas.push({
        tipo: "Chuva acumulada elevada",
        mensagem: `O total de chuva no período foi de ${formatarNumero(
          resumo.chuvaTotal
        )} mm.`
      });
    }

    return alertas;
  }

  const dadosGrafico = montarDadosGrafico();
  const alertas = verificarAlertas();

  useEffect(() => {
    carregarLocais();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Centro de Análises</h1>
          <p className="page-description">
            Analise os registros meteorológicos salvos por local e período.
          </p>
        </div>
      </div>

      {mensagem && <div className="message-box">{mensagem}</div>}

      <form className="analysis-filter-card" onSubmit={buscarAnalise}>
        <div className="form-header">
          <div>
            <h3>Filtros da análise</h3>
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

        <button type="submit" className="submit-button">
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
              <span>Maior temperatura</span>
              <strong>{formatarNumero(resumo.temperaturaMaxima)}°C</strong>
            </div>

            <div className="card">
              <span>Menor temperatura</span>
              <strong>{formatarNumero(resumo.temperaturaMinima)}°C</strong>
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
          </div>

          {alertas.length > 0 && (
            <div className="analysis-alerts">
              <h2>Alertas identificados</h2>

              <div className="analysis-alerts-grid">
                {alertas.map((alerta, index) => (
                  <div className="analysis-alert-card" key={index}>
                    <strong>{alerta.tipo}</strong>
                    <p>{alerta.mensagem}</p>
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
                  <Line
                    type="monotone"
                    dataKey="temperatura"
                    strokeWidth={3}
                  />
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
          </div>

          <div className="analysis-table-section">
            <h2>Registros utilizados na análise</h2>

            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Temperatura</th>
                    <th>Umidade</th>
                    <th>Pressão</th>
                    <th>Vento</th>
                    <th>Chuva</th>
                    <th>Origem</th>
                  </tr>
                </thead>

                <tbody>
                  {registros.map((registro) => (
                    <tr key={registro.id}>
                      <td>{formatarDataCompleta(registro.data_hora)}</td>
                      <td>{formatarNumero(registro.temperatura)}°C</td>
                      <td>{formatarNumero(registro.umidade)}%</td>
                      <td>{formatarNumero(registro.pressao)} hPa</td>
                      <td>{formatarNumero(registro.vento_velocidade)} km/h</td>
                      <td>{formatarNumero(registro.precipitacao)} mm</td>
                      <td>{registro.origem || "--"}</td>
                    </tr>
                  ))}

                  {registros.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        Nenhum registro encontrado para o período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!resumo && (
        <div className="empty-state">
          <CalendarDays size={42} />
          <h3>Nenhuma análise gerada</h3>
          <p>
            Selecione um local e um período para visualizar gráficos e
            indicadores meteorológicos.
          </p>
        </div>
      )}
    </div>
  );
}

export default CentroAnalises;