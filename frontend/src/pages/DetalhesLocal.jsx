import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CloudSun,
  Database,
  Droplets,
  Gauge,
  MapPin,
  RefreshCcw,
  Thermometer,
  Wind,
  CloudRain
} from "lucide-react";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

import api from "../services/api";

function DetalhesLocal() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [local, setLocal] = useState(null);
  const [clima, setClima] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregarDetalhes() {
    try {
      setCarregando(true);
      setMensagem("");
      setErro("");

      const responseLocal = await api.get(`/locais/${id}`);
      const localData = responseLocal.data;

      setLocal(localData);

      const responseClima = await api.get("/weather/atual", {
        params: {
          latitude: localData.latitude,
          longitude: localData.longitude
        }
      });

      setClima(responseClima.data.current);

      const hoje = new Date();
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(hoje.getDate() - 7);

      const dataInicio = seteDiasAtras.toISOString().split("T")[0];
      const dataFim = hoje.toISOString().split("T")[0];

      const responseRegistros = await api.get("/registros", {
        params: {
          local_id: id,
          data_inicio: dataInicio,
          data_fim: dataFim
        }
      });

      const registrosOrdenados = [...responseRegistros.data].sort((a, b) => {
        return new Date(a.data_hora) - new Date(b.data_hora);
      });

      setRegistros(registrosOrdenados);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      setErro("Não foi possível carregar os detalhes do local.");
    } finally {
      setCarregando(false);
    }
  }

  async function salvarRegistro() {
    try {
      setSalvando(true);
      setMensagem("");
      setErro("");

      const response = await api.post(`/registros/coletar/${id}`);

      setMensagem(response.data.mensagem || "Registro salvo com sucesso.");

      await carregarDetalhes();
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      setErro("Não foi possível salvar o registro meteorológico.");
    } finally {
      setSalvando(false);
    }
  }

  function formatarData(data) {
    if (!data) return "--";

    return new Date(data).toLocaleString("pt-BR");
  }

  function formatarDataCurta(data) {
    if (!data) return "--";

    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    });
  }

  function formatarNumero(valor, casas = 1) {
    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return "--";
    }

    return numero.toFixed(casas);
  }

  function montarDadosGrafico() {
    return registros.map((registro) => ({
      data: formatarDataCurta(registro.data_hora),
      dataCompleta: formatarData(registro.data_hora),
      temperatura: Number(registro.temperatura || 0),
      umidade: Number(registro.umidade || 0),
      chuva: Number(registro.precipitacao || 0),
      vento: Number(registro.vento_velocidade || 0)
    }));
  }

  const dadosGrafico = montarDadosGrafico();

  useEffect(() => {
    carregarDetalhes();
  }, [id]);

  if (carregando) {
    return (
      <div className="table-card">
        <p>Carregando detalhes do local...</p>
      </div>
    );
  }

  if (!local) {
    return (
      <div className="empty-state">
        <MapPin size={42} />
        <h3>Local não encontrado</h3>
        <p>Não foi possível encontrar o local solicitado.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title-row">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>{local.nome}</h1>

          <p className="page-description">
            {local.cidade}
            {local.estado ? ` - ${local.estado}` : ""} •{" "}
            {local.pais || "Brasil"} • {local.tipo || "Local"}
          </p>
        </div>

        <div className="dashboard-actions">
          <button type="button" onClick={carregarDetalhes}>
            <RefreshCcw size={18} />
            Atualizar
          </button>

          <button type="button" onClick={salvarRegistro} disabled={salvando}>
            <Database size={18} />
            {salvando ? "Salvando..." : "Salvar registro"}
          </button>
        </div>
      </div>

      {erro && <div className="message-box error-message">{erro}</div>}
      {mensagem && <div className="message-box">{mensagem}</div>}

      <div className="local-details-hero">
        <div>
          <span className="hero-label">Detalhes do local</span>
          <h2>{local.nome}</h2>
          <p>
            Visualização completa do clima atual, histórico recente e indicadores
            meteorológicos.
          </p>
        </div>

        <div className="hero-icon">
          <CloudSun size={48} />
        </div>
      </div>

      <div className="cards-grid">
        <div className="card">
          <span>Temperatura atual</span>
          <strong>{clima?.temperature_2m ?? "--"}°C</strong>
        </div>

        <div className="card">
          <span>Sensação térmica</span>
          <strong>{clima?.apparent_temperature ?? "--"}°C</strong>
        </div>

        <div className="card">
          <span>Umidade</span>
          <strong>{clima?.relative_humidity_2m ?? "--"}%</strong>
        </div>

        <div className="card">
          <span>Vento</span>
          <strong>{clima?.wind_speed_10m ?? "--"} km/h</strong>
        </div>

        <div className="card">
          <span>Pressão</span>
          <strong>{clima?.pressure_msl ?? "--"} hPa</strong>
        </div>

        <div className="card">
          <span>Chuva</span>
          <strong>{clima?.precipitation ?? "--"} mm</strong>
        </div>
      </div>

      <div className="local-info-grid">
        <div className="local-info-card">
          <h3>Dados cadastrais</h3>

          <div className="local-info-line">
            <MapPin size={18} />
            <span>
              {local.cidade}
              {local.estado ? ` - ${local.estado}` : ""}
            </span>
          </div>

          <div className="local-info-line">
            <Thermometer size={18} />
            <span>Tipo: {local.tipo || "Local"}</span>
          </div>

          <div className="local-info-line">
            <Gauge size={18} />
            <span>Latitude: {formatarNumero(local.latitude, 5)}</span>
          </div>

          <div className="local-info-line">
            <Gauge size={18} />
            <span>Longitude: {formatarNumero(local.longitude, 5)}</span>
          </div>
        </div>

        <div className="local-info-card">
          <h3>Resumo do histórico</h3>

          <div className="local-info-line">
            <Database size={18} />
            <span>Registros nos últimos 7 dias: {registros.length}</span>
          </div>

          <div className="local-info-line">
            <Thermometer size={18} />
            <span>
              Última temperatura registrada:{" "}
              {registros.length > 0
                ? `${formatarNumero(
                    registros[registros.length - 1].temperatura
                  )}°C`
                : "--"}
            </span>
          </div>

          <div className="local-info-line">
            <CloudRain size={18} />
            <span>
              Chuva acumulada:{" "}
              {formatarNumero(
                registros.reduce(
                  (total, registro) =>
                    total + Number(registro.precipitacao || 0),
                  0
                )
              )}{" "}
              mm
            </span>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="chart-card">
          <h3>
            <Thermometer size={22} />
            Temperatura recente
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
            <CloudRain size={22} />
            Chuva recente
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
      </div>

      <div className="analytics-grid">
        <div className="chart-card">
          <h3>
            <Droplets size={22} />
            Umidade recente
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
            <Wind size={22} />
            Vento recente
          </h3>

          <ResponsiveContainer width="100%" height={300}>
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
        <h2>Últimos registros do local</h2>

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
                  <td>{formatarData(registro.data_hora)}</td>
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
                    Nenhum registro encontrado para este local nos últimos 7
                    dias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DetalhesLocal;