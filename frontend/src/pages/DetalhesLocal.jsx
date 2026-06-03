import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CloudRain,
  CloudSun,
  Compass,
  Database,
  Droplets,
  FileText,
  Gauge,
  MapPin,
  RefreshCcw,
  Save,
  Sun,
  Thermometer,
  Wind,
  Zap,
  AlertTriangle
} from "lucide-react";

import api from "../services/api";
import { calcularAnaliseTecnica } from "../utils/analiseTecnica";
import {
  formatarOrigem,
  obterClasseOrigem,
  formatarData,
  formatarNumero
} from "../utils/formatadores";

function DetalhesLocal() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [local, setLocal] = useState(null);
  const [climaAtual, setClimaAtual] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [analiseTecnica, setAnaliseTecnica] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function obterRadiacaoSolar(clima) {
    const valor =
      clima?.radiacao_solar ??
      clima?.shortwave_radiation ??
      clima?.solar_radiation ??
      0;

    return Number(valor);
  }

  async function carregarLocal() {
    try {
      const responseLocais = await api.get("/locais");
      const locais = responseLocais.data || [];

      const localEncontrado = locais.find((item) => item.id === id);

      if (!localEncontrado) {
        setErro("Local não encontrado.");
        return null;
      }

      setLocal(localEncontrado);
      return localEncontrado;
    } catch (error) {
      console.error("Erro ao carregar local:", error);
      setErro("Erro ao carregar os dados do local.");
      return null;
    }
  }

  async function carregarClimaAtual(localSelecionado) {
    try {
      if (!localSelecionado?.latitude || !localSelecionado?.longitude) {
        return null;
      }

      const response = await api.get("/weather/atual", {
        params: {
          latitude: localSelecionado.latitude,
          longitude: localSelecionado.longitude
        }
      });

      const clima = response.data.current || {};

      setClimaAtual(clima);
      return clima;
    } catch (error) {
      console.error("Erro ao carregar clima atual:", error);
      return null;
    }
  }

  async function carregarRegistrosLocal() {
    try {
      const response = await api.get("/registros", {
        params: {
          local_id: id
        }
      });

      const registrosRecebidos = response.data || [];

      const registrosOrdenados = [...registrosRecebidos].sort((a, b) => {
        return new Date(b.data_hora) - new Date(a.data_hora);
      });

      setRegistros(registrosOrdenados);
      setAnaliseTecnica(calcularAnaliseTecnica(registrosOrdenados));

      return registrosOrdenados;
    } catch (error) {
      console.error("Erro ao carregar registros do local:", error);
      setErro("Erro ao carregar registros deste local.");
      return [];
    }
  }

  async function carregarDetalhes() {
    try {
      setCarregando(true);
      setErro("");
      setMensagem("");

      const localSelecionado = await carregarLocal();

      if (localSelecionado) {
        await Promise.all([
          carregarClimaAtual(localSelecionado),
          carregarRegistrosLocal()
        ]);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      setErro("Não foi possível carregar os detalhes do local.");
    } finally {
      setCarregando(false);
    }
  }

  async function salvarRegistroAgora() {
    try {
      setSalvando(true);
      setMensagem("");
      setErro("");

      const response = await api.post(`/registros/coletar/${id}`);

      setMensagem(response.data.mensagem || "Registro salvo com sucesso.");

      await carregarDetalhes();
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      setErro("Não foi possível salvar o registro deste local.");
    } finally {
      setSalvando(false);
    }
  }

  const ultimosRegistros = registros.slice(0, 8);

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
        <p>Não foi possível localizar os dados deste local monitorado.</p>

        <button type="button" onClick={() => navigate("/locais")}>
          Voltar para locais
        </button>
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
            style={{ marginBottom: 12 }}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>{local.nome}</h1>
          <p className="page-description">
            {local.cidade}
            {local.estado ? ` - ${local.estado}` : ""} | Latitude:{" "}
            {local.latitude} | Longitude: {local.longitude}
          </p>
        </div>

        <div className="dashboard-actions">
          <button type="button" onClick={carregarDetalhes}>
            <RefreshCcw size={18} />
            Atualizar
          </button>

          <button type="button" onClick={salvarRegistroAgora} disabled={salvando}>
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar registro"}
          </button>
        </div>
      </div>

      {mensagem && <div className="message-box">{mensagem}</div>}
      {erro && <div className="message-box error-message">{erro}</div>}

      <div className="executive-hero">
        <div>
          <span className="hero-label">Detalhes do local</span>
          <h2>Análise individual de {local.nome}</h2>
          <p>
            Visualize os dados atuais, histórico meteorológico, potencial solar,
            vento predominante e alertas específicos deste local.
          </p>
        </div>

        <div className="executive-hero-icon">
          <MapPin size={48} />
        </div>
      </div>

      <div className="cards-grid">
        <div className="card metric-card">
          <span>Temperatura atual</span>
          <strong>
            {climaAtual?.temperature_2m !== undefined
              ? `${formatarNumero(climaAtual.temperature_2m)}°C`
              : "--"}
          </strong>
        </div>

        <div className="card metric-card">
          <span>Umidade atual</span>
          <strong>
            {climaAtual?.relative_humidity_2m !== undefined
              ? `${formatarNumero(climaAtual.relative_humidity_2m)}%`
              : "--"}
          </strong>
        </div>

        <div className="card metric-card">
          <span>Vento atual</span>
          <strong>
            {climaAtual?.wind_speed_10m !== undefined
              ? `${formatarNumero(climaAtual.wind_speed_10m)} km/h`
              : "--"}
          </strong>
        </div>

        <div className="card metric-card">
          <span>Radiação solar atual</span>
          <strong>
            {climaAtual
              ? `${formatarNumero(obterRadiacaoSolar(climaAtual))} W/m²`
              : "--"}
          </strong>
        </div>
      </div>

      <div className="dashboard-panels-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Condições atuais</h2>
              <p>Dados meteorológicos coletados em tempo real.</p>
            </div>

            <CloudSun size={24} />
          </div>

          <div className="records-summary-grid">
            <div className="records-summary-card">
              <Thermometer size={22} />
              <div>
                <span>Sensação térmica</span>
                <strong>
                  {climaAtual?.apparent_temperature !== undefined
                    ? `${formatarNumero(climaAtual.apparent_temperature)}°C`
                    : "--"}
                </strong>
              </div>
            </div>

            <div className="records-summary-card">
              <Gauge size={22} />
              <div>
                <span>Pressão</span>
                <strong>
                  {climaAtual?.pressure_msl !== undefined
                    ? `${formatarNumero(climaAtual.pressure_msl)} hPa`
                    : "--"}
                </strong>
              </div>
            </div>

            <div className="records-summary-card">
              <CloudRain size={22} />
              <div>
                <span>Chuva</span>
                <strong>
                  {climaAtual?.precipitation !== undefined
                    ? `${formatarNumero(climaAtual.precipitation)} mm`
                    : "--"}
                </strong>
              </div>
            </div>

            <div className="records-summary-card">
              <Wind size={22} />
              <div>
                <span>Direção do vento</span>
                <strong>
                  {climaAtual?.wind_direction_10m !== undefined
                    ? `${formatarNumero(climaAtual.wind_direction_10m)}°`
                    : "--"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Análise técnica V2</h2>
              <p>Indicadores calculados a partir dos registros deste local.</p>
            </div>

            <BarChart3 size={24} />
          </div>

          <div className="records-summary-grid">
            <div className="records-summary-card">
              <Sun size={22} />
              <div>
                <span>Potencial solar</span>
                <strong>{analiseTecnica?.potencialSolar || "Sem dados"}</strong>
              </div>
            </div>

            <div className="records-summary-card">
              <Zap size={22} />
              <div>
                <span>Energia estimada</span>
                <strong>
                  {analiseTecnica
                    ? `${formatarNumero(
                        analiseTecnica.energiaSolarEstimada,
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
                  {analiseTecnica?.ventoPredominante?.direcao || "Indefinido"}
                </strong>
              </div>
            </div>

            <div className="records-summary-card">
              <AlertTriangle size={22} />
              <div>
                <span>Alertas do local</span>
                <strong>{analiseTecnica?.alertas?.length || 0}</strong>
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
              <h2>Resumo histórico</h2>
              <p>Resumo dos registros já salvos para este local.</p>
            </div>

            <Database size={24} />
          </div>

          <div className="records-summary-grid">
            <div className="records-summary-card">
              <CalendarDays size={22} />
              <div>
                <span>Total de registros</span>
                <strong>{analiseTecnica?.quantidade || 0}</strong>
              </div>
            </div>

            <div className="records-summary-card">
              <Thermometer size={22} />
              <div>
                <span>Temperatura média</span>
                <strong>
                  {analiseTecnica
                    ? `${formatarNumero(analiseTecnica.temperaturaMedia)}°C`
                    : "--"}
                </strong>
              </div>
            </div>

            <div className="records-summary-card">
              <Droplets size={22} />
              <div>
                <span>Umidade média</span>
                <strong>
                  {analiseTecnica
                    ? `${formatarNumero(analiseTecnica.umidadeMedia)}%`
                    : "--"}
                </strong>
              </div>
            </div>

            <div className="records-summary-card">
              <Sun size={22} />
              <div>
                <span>Radiação média</span>
                <strong>
                  {analiseTecnica
                    ? `${formatarNumero(analiseTecnica.radiacaoSolarMedia)} W/m²`
                    : "--"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Ações rápidas</h2>
              <p>Acesse áreas relacionadas a este local.</p>
            </div>

            <FileText size={24} />
          </div>

          <div className="dashboard-actions" style={{ flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate(`/registros?local_id=${id}`)}
            >
              <Database size={18} />
              Ver registros
            </button>

            <button type="button" onClick={() => navigate("/relatorios")}>
              <FileText size={18} />
              Gerar relatório
            </button>

            <button type="button" onClick={() => navigate("/rosa-dos-ventos")}>
              <Compass size={18} />
              Rosa dos ventos
            </button>

            <button type="button" onClick={() => navigate("/mapa")}>
              <MapPin size={18} />
              Ver no mapa
            </button>
          </div>
        </div>
      </div>

      {analiseTecnica?.alertas?.length > 0 && (
        <div className="dashboard-panel" style={{ marginTop: 24 }}>
          <div className="panel-header">
            <div>
              <h2>Alertas identificados</h2>
              <p>Faixas críticas encontradas nos registros deste local.</p>
            </div>

            <AlertTriangle size={24} />
          </div>

          <div className="dashboard-alert-list">
            {analiseTecnica.alertas.slice(0, 5).map((alerta, index) => (
              <div className="dashboard-alert-item" key={index}>
                <div>
                  <strong>{alerta.tipo}</strong>
                  <span>{alerta.mensagem}</span>
                </div>

                <b>{alerta.valor}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="report-table-box">
        <h3>Últimos registros do local</h3>

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
                <th>Radiação Solar</th>
                <th>Origem</th>
              </tr>
            </thead>

            <tbody>
              {ultimosRegistros.map((registro) => (
                <tr key={registro.id}>
                  <td>{formatarData(registro.data_hora)}</td>
                  <td>{formatarNumero(registro.temperatura)}°C</td>
                  <td>{formatarNumero(registro.umidade)}%</td>
                  <td>{formatarNumero(registro.pressao)} hPa</td>
                  <td>{formatarNumero(registro.vento_velocidade)} km/h</td>
                  <td>{formatarNumero(registro.precipitacao)} mm</td>
                  <td>{formatarNumero(registro.radiacao_solar)} W/m²</td>
                  <td>
                    <span
                      className={`origin-badge origin-${obterClasseOrigem(
                        registro.origem
                      )}`}
                    >
                      {formatarOrigem(registro.origem)}
                    </span>
                  </td>
                </tr>
              ))}

              {ultimosRegistros.length === 0 && (
                <tr>
                  <td colSpan="8">
                    Nenhum registro encontrado para este local.
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