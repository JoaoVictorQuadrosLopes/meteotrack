import { useEffect, useState } from "react";
import {
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  Gauge,
  MapPin,
  RefreshCcw,
  CloudRain,
  Navigation,
} from "lucide-react";

function ClimaDia() {
  const [locais, setLocais] = useState([]);
  const [localSelecionado, setLocalSelecionado] = useState("");
  const [clima, setClima] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    carregarLocais();
  }, []);

  useEffect(() => {
    if (localSelecionado && locais.length > 0) {
      carregarClimaDoDia(localSelecionado);
    }
  }, [localSelecionado, locais]);

  function pegarToken() {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("firebaseToken") ||
      localStorage.getItem("accessToken")
    );
  }

  function normalizarListaLocais(dados) {
    if (Array.isArray(dados)) return dados;
    if (Array.isArray(dados.locais)) return dados.locais;
    if (Array.isArray(dados.data)) return dados.data;
    if (Array.isArray(dados.resultado)) return dados.resultado;
    return [];
  }

  function pegarIdLocal(local) {
    return local.id || local._id || local.docId || local.localId;
  }

  async function carregarLocais() {
    try {
      setErro("");
      setCarregando(true);

      if (!API_URL) {
        setErro("VITE_API_URL não está configurada no frontend.");
        return;
      }

      const token = pegarToken();

      const resposta = await fetch(`${API_URL}/api/locais`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      const dados = await resposta.json();

      console.log("Resposta /api/locais:", dados);

      if (!resposta.ok) {
        setErro(dados.erro || dados.message || "Erro ao buscar locais monitorados.");
        return;
      }

      const lista = normalizarListaLocais(dados);

      setLocais(lista);

      if (lista.length > 0) {
        setLocalSelecionado(pegarIdLocal(lista[0]));
      } else {
        setErro("Nenhum local monitorado encontrado. Cadastre um local primeiro.");
      }
    } catch (error) {
      console.error("Erro ao carregar locais:", error);
      setErro("Não foi possível carregar os locais monitorados.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarClimaDoDia(idSelecionado = localSelecionado) {
    try {
      setCarregando(true);
      setErro("");

      const local = locais.find((item) => pegarIdLocal(item) === idSelecionado);

      if (!local) {
        setClima(null);
        return;
      }

      const latitude = local.latitude || local.lat;
      const longitude = local.longitude || local.lon || local.lng;

      if (!latitude || !longitude) {
        setErro("O local selecionado não possui latitude e longitude cadastradas.");
        setClima(null);
        return;
      }

      const resposta = await fetch(
        `${API_URL}/api/weather/previsao?latitude=${latitude}&longitude=${longitude}`
      );

      const dados = await resposta.json();

      console.log("Resposta /api/weather/previsao:", dados);

      if (!resposta.ok) {
        setErro(dados.erro || dados.message || "Erro ao buscar clima do dia.");
        setClima(null);
        return;
      }

      const climaFormatado = formatarClima(dados, local);

      setClima(climaFormatado);
    } catch (error) {
      console.error("Erro ao carregar clima do dia:", error);
      setErro("Não foi possível carregar as informações do clima.");
      setClima(null);
    } finally {
      setCarregando(false);
    }
  }

  function formatarClima(dados, local) {
    const atual = dados.current || dados.atual || dados.current_weather || {};
    const hourly = dados.hourly || {};

    const temperatura =
      atual.temperature_2m ??
      atual.temperature ??
      atual.temperatura ??
      dados.temperatura ??
      0;

    const sensacao =
      atual.apparent_temperature ??
      atual.sensacaoTermica ??
      dados.sensacaoTermica ??
      temperatura;

    const umidade =
      atual.relative_humidity_2m ??
      atual.umidade ??
      dados.umidade ??
      0;

    const pressao =
      atual.pressure_msl ??
      atual.pressao ??
      dados.pressao ??
      0;

    const vento =
      atual.wind_speed_10m ??
      atual.windspeed ??
      atual.velocidadeVento ??
      dados.velocidadeVento ??
      0;

    const direcaoVento =
      atual.wind_direction_10m ??
      atual.winddirection ??
      atual.direcaoVento ??
      dados.direcaoVento ??
      0;

    const probabilidadeChuva =
      atual.precipitation_probability ??
      atual.probabilidade_chuva ??
      calcularProbabilidadeChuva(hourly, dados);

    return {
      cidade: local.cidade || local.nome || local.nomeLocal || "Local monitorado",
      estado: local.estado || local.uf || "",
      temperatura,
      sensacao,
      umidade,
      pressao,
      vento,
      direcaoVento,
      probabilidadeChuva,
      resumo: gerarResumo(temperatura, probabilidadeChuva, vento),
    };
  }

  function calcularProbabilidadeChuva(hourly, dados) {
    if (dados.probabilidadeChuva !== undefined) return dados.probabilidadeChuva;
    if (dados.chanceChuva !== undefined) return dados.chanceChuva;

    if (hourly.precipitation_probability?.length > 0) {
      const valores = hourly.precipitation_probability.slice(0, 24);
      return Math.max(...valores);
    }

    return 0;
  }

  function gerarResumo(temperatura, chuva, vento) {
    if (chuva >= 70) return "Alta chance de chuva durante o dia.";
    if (vento >= 35) return "Dia com possibilidade de ventos fortes.";
    if (temperatura >= 32) return "Dia quente, com temperatura elevada.";
    if (chuva >= 30) return "Possibilidade moderada de chuva.";
    return "Clima estável para o dia.";
  }

  function classificarChuva(valor) {
    if (valor >= 70) return "alta";
    if (valor >= 30) return "media";
    return "baixa";
  }

  function classificarVento(valor) {
    if (valor >= 40) return "forte";
    if (valor >= 20) return "moderado";
    return "fraco";
  }

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h2>Clima do Dia</h2>
          <p>Resumo das condições climáticas atuais do local monitorado.</p>
        </div>

        <button className="btn-primary" onClick={() => carregarClimaDoDia()}>
          <RefreshCcw size={18} />
          <span>Atualizar</span>
        </button>
      </div>

      <section className="clima-filtros">
        <div className="campo">
          <label>Local monitorado</label>

          <select
            value={localSelecionado}
            onChange={(e) => setLocalSelecionado(e.target.value)}
          >
            <option value="">Selecione um local</option>

            {locais.map((local) => {
              const id = pegarIdLocal(local);

              return (
                <option key={id} value={id}>
                  {local.cidade || local.nome || local.nomeLocal || "Local"}{" "}
                  {local.estado || local.uf ? `- ${local.estado || local.uf}` : ""}
                </option>
              );
            })}
          </select>
        </div>
      </section>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {carregando ? (
        <div className="empty-state">
          <RefreshCcw size={38} />
          <h3>Carregando clima do dia...</h3>
          <p>Buscando informações meteorológicas atualizadas.</p>
        </div>
      ) : clima ? (
        <>
          <section className="clima-hero">
            <div className="clima-hero-info">
              <div className="clima-local">
                <MapPin size={20} />
                <span>
                  {clima.cidade} {clima.estado ? `- ${clima.estado}` : ""}
                </span>
              </div>

              <h1>{Math.round(clima.temperatura)}°C</h1>

              <p>{clima.resumo}</p>
            </div>

            <div className="clima-hero-icon">
              <CloudSun size={90} />
            </div>
          </section>

          <section className="clima-cards-grid">
            <div className="clima-card">
              <div className="clima-card-icon temperatura">
                <Thermometer size={24} />
              </div>

              <div>
                <span>Temperatura</span>
                <strong>{Math.round(clima.temperatura)}°C</strong>
                <p>Temperatura atual registrada.</p>
              </div>
            </div>

            <div className="clima-card">
              <div className="clima-card-icon sensacao">
                <CloudSun size={24} />
              </div>

              <div>
                <span>Sensação térmica</span>
                <strong>{Math.round(clima.sensacao)}°C</strong>
                <p>Como a temperatura é percebida.</p>
              </div>
            </div>

            <div className="clima-card">
              <div className="clima-card-icon umidade">
                <Droplets size={24} />
              </div>

              <div>
                <span>Umidade</span>
                <strong>{Math.round(clima.umidade)}%</strong>
                <p>Umidade relativa do ar.</p>
              </div>
            </div>

            <div className="clima-card">
              <div className="clima-card-icon pressao">
                <Gauge size={24} />
              </div>

              <div>
                <span>Pressão</span>
                <strong>{Math.round(clima.pressao)} hPa</strong>
                <p>Pressão atmosférica atual.</p>
              </div>
            </div>
          </section>

          <section className="clima-detalhes-grid">
            <div className="clima-detalhe-card chuva">
              <div className="clima-detalhe-header">
                <div>
                  <span>Probabilidade de chuva</span>
                  <strong>{Math.round(clima.probabilidadeChuva)}%</strong>
                </div>

                <CloudRain size={34} />
              </div>

              <div className="barra-progresso">
                <div
                  className={`barra-preenchida ${classificarChuva(
                    clima.probabilidadeChuva
                  )}`}
                  style={{ width: `${clima.probabilidadeChuva}%` }}
                ></div>
              </div>

              <p>
                {clima.probabilidadeChuva >= 70
                  ? "Alta chance de chuva. Recomenda-se atenção."
                  : clima.probabilidadeChuva >= 30
                  ? "Chance moderada de chuva durante o dia."
                  : "Baixa chance de chuva no momento."}
              </p>
            </div>

            <div className="clima-detalhe-card vento">
              <div className="clima-detalhe-header">
                <div>
                  <span>Vento</span>
                  <strong>{Math.round(clima.vento)} km/h</strong>
                </div>

                <Wind size={34} />
              </div>

              <div className="vento-info">
                <div>
                  <Navigation size={22} />
                  <span>Direção: {Math.round(clima.direcaoVento)}°</span>
                </div>

                <div>
                  <Wind size={22} />
                  <span>Intensidade: {classificarVento(clima.vento)}</span>
                </div>
              </div>

              <p>
                {clima.vento >= 40
                  ? "Vento forte detectado. Atenção a rajadas."
                  : clima.vento >= 20
                  ? "Vento moderado durante o dia."
                  : "Vento fraco ou estável no momento."}
              </p>
            </div>
          </section>
        </>
      ) : (
        <div className="empty-state">
          <CloudSun size={38} />
          <h3>Nenhum local selecionado</h3>
          <p>Cadastre ou selecione um local monitorado para visualizar o clima.</p>
        </div>
      )}
    </main>
  );
}

export default ClimaDia;