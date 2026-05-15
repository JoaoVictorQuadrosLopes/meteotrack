import { useEffect, useState } from "react";
import {
  AlertTriangle,
  RefreshCcw,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Gauge,
  CheckCircle2,
  MapPin
} from "lucide-react";
import api from "../services/api";

function AlertasMeteorologicos() {
  const [alertas, setAlertas] = useState([]);
  const [resumo, setResumo] = useState({
    totalLocais: 0,
    totalAlertas: 0,
    criticos: 0,
    atencao: 0,
    normais: 0
  });
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  function criarAlerta(local, tipo, nivel, mensagem, valor, unidade, icone) {
    return {
      id: `${local.id}-${tipo}`,
      local,
      tipo,
      nivel,
      mensagem,
      valor,
      unidade,
      icone
    };
  }
  function carregarConfigAlertas() {
  const salvas = localStorage.getItem("meteotrack_configuracoes");

  if (!salvas) {
    return {
      alertaTemperaturaAlta: 35,
      alertaUmidadeBaixa: 30,
      alertaVentoForte: 50,
      alertaChuvaIntensa: 20
    };
  }

  const config = JSON.parse(salvas);

  return {
    alertaTemperaturaAlta: Number(config.alertaTemperaturaAlta || 35),
    alertaUmidadeBaixa: Number(config.alertaUmidadeBaixa || 30),
    alertaVentoForte: Number(config.alertaVentoForte || 50),
    alertaChuvaIntensa: Number(config.alertaChuvaIntensa || 20)
  };
}

  function analisarClima(local, clima) {
    const configAlertas = carregarConfigAlertas();
    const novosAlertas = [];

    const temperatura = Number(clima?.temperature_2m || 0);
    const umidade = Number(clima?.relative_humidity_2m || 0);
    const vento = Number(clima?.wind_speed_10m || 0);
    const chuva = Number(clima?.precipitation || 0);
    const pressao = Number(clima?.pressure_msl || 0);

    if (temperatura >= configAlertas.alertaTemperaturaAlta) {
      novosAlertas.push(
        criarAlerta(
          local,
          "Temperatura elevada",
          "critico",
          "Temperatura acima do limite recomendado.",
          temperatura,
          "°C",
          "temperatura"
        )
      );
    } else if (temperatura >= 30) {
      novosAlertas.push(
        criarAlerta(
          local,
          "Calor moderado",
          "atencao",
          "Temperatura elevada, mas ainda não crítica.",
          temperatura,
          "°C",
          "temperatura"
        )
      );
    }

    if (umidade > 0 && umidade <= configAlertas.alertaUmidadeBaixa) {
      novosAlertas.push(
        criarAlerta(
          local,
          "Umidade baixa",
          "critico",
          "Umidade do ar em nível preocupante.",
          umidade,
          "%",
          "umidade"
        )
      );
    } else if (umidade > 30 && umidade <= 40) {
      novosAlertas.push(
        criarAlerta(
          local,
          "Umidade em atenção",
          "atencao",
          "Umidade abaixo do ideal.",
          umidade,
          "%",
          "umidade"
        )
      );
    }

    if (vento >= configAlertas.alertaVentoForte) {
      novosAlertas.push(
        criarAlerta(
          local,
          "Vento forte",
          "critico",
          "Velocidade do vento em nível elevado.",
          vento,
          "km/h",
          "vento"
        )
      );
    } else if (vento >= 30) {
      novosAlertas.push(
        criarAlerta(
          local,
          "Vento moderado",
          "atencao",
          "Vento acima do normal.",
          vento,
          "km/h",
          "vento"
        )
      );
    }

    if (chuva >= configAlertas.alertaChuvaIntensa) {
      novosAlertas.push(
        criarAlerta(
          local,
          "Chuva intensa",
          "critico",
          "Precipitação elevada no momento.",
          chuva,
          "mm",
          "chuva"
        )
      );
    } else if (chuva >= 5) {
      novosAlertas.push(
        criarAlerta(
          local,
          "Chuva moderada",
          "atencao",
          "Há registro de chuva relevante.",
          chuva,
          "mm",
          "chuva"
        )
      );
    }

    if (pressao > 0 && pressao <= 1000) {
      novosAlertas.push(
        criarAlerta(
          local,
          "Pressão baixa",
          "atencao",
          "Pressão atmosférica abaixo do padrão comum.",
          pressao,
          "hPa",
          "pressao"
        )
      );
    }

    return novosAlertas;
  }

  function escolherIcone(tipo) {
    if (tipo === "temperatura") return <Thermometer size={24} />;
    if (tipo === "umidade") return <Droplets size={24} />;
    if (tipo === "vento") return <Wind size={24} />;
    if (tipo === "chuva") return <CloudRain size={24} />;
    if (tipo === "pressao") return <Gauge size={24} />;

    return <AlertTriangle size={24} />;
  }

  async function carregarAlertas() {
    try {
      setCarregando(true);
      setMensagem("");

      const responseLocais = await api.get("/locais");
      const locais = responseLocais.data;

      const todosAlertas = [];

      for (const local of locais) {
        try {
          const responseClima = await api.get("/weather/atual", {
            params: {
              latitude: local.latitude,
              longitude: local.longitude
            }
          });

          const clima = responseClima.data.current;
          const alertasDoLocal = analisarClima(local, clima);

          todosAlertas.push(...alertasDoLocal);
        } catch (error) {
          console.error("Erro ao analisar local:", local.nome, error);
        }
      }

      const criticos = todosAlertas.filter(
        (alerta) => alerta.nivel === "critico"
      ).length;

      const atencao = todosAlertas.filter(
        (alerta) => alerta.nivel === "atencao"
      ).length;

      setAlertas(todosAlertas);

      setResumo({
        totalLocais: locais.length,
        totalAlertas: todosAlertas.length,
        criticos,
        atencao,
        normais: locais.length - new Set(todosAlertas.map((a) => a.local.id)).size
      });

      if (todosAlertas.length === 0) {
        setMensagem("Nenhum alerta meteorológico encontrado no momento.");
      }
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
      setMensagem("Não foi possível carregar os alertas meteorológicos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarAlertas();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Alertas Meteorológicos</h1>
          <p className="page-description">
            Monitoramento automático de condições críticas nos locais cadastrados.
          </p>
        </div>

        <button type="button" onClick={carregarAlertas}>
          <RefreshCcw size={18} />
          Atualizar alertas
        </button>
      </div>

      {mensagem && <div className="message-box">{mensagem}</div>}

      <div className="cards-grid">
        <div className="card">
          <span>Locais analisados</span>
          <strong>{resumo.totalLocais}</strong>
        </div>

        <div className="card">
          <span>Total de alertas</span>
          <strong>{resumo.totalAlertas}</strong>
        </div>

        <div className="card alert-metric-critical">
          <span>Alertas críticos</span>
          <strong>{resumo.criticos}</strong>
        </div>

        <div className="card alert-metric-warning">
          <span>Em atenção</span>
          <strong>{resumo.atencao}</strong>
        </div>
      </div>

      {carregando ? (
        <div className="table-card">
          <p>Verificando condições meteorológicas...</p>
        </div>
      ) : alertas.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={46} />
          <h3>Tudo normal no momento</h3>
          <p>
            Nenhum local cadastrado apresentou condição meteorológica crítica ou
            de atenção.
          </p>
        </div>
      ) : (
        <div className="alerts-grid">
          {alertas.map((alerta) => (
            <div
              className={`weather-alert-card ${
                alerta.nivel === "critico"
                  ? "weather-alert-critical"
                  : "weather-alert-warning"
              }`}
              key={alerta.id}
            >
              <div className="weather-alert-icon">
                {escolherIcone(alerta.icone)}
              </div>

              <div className="weather-alert-content">
                <div className="weather-alert-top">
                  <h3>{alerta.tipo}</h3>
                  <span>
                    {alerta.nivel === "critico" ? "Crítico" : "Atenção"}
                  </span>
                </div>

                <p>{alerta.mensagem}</p>

                <div className="weather-alert-place">
                  <MapPin size={17} />
                  <span>
                    {alerta.local.nome} — {alerta.local.cidade}
                    {alerta.local.estado ? `/${alerta.local.estado}` : ""}
                  </span>
                </div>

                <strong className="weather-alert-value">
                  {alerta.valor}
                  {alerta.unidade}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AlertasMeteorologicos;