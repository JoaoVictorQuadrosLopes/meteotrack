import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  Compass,
  Search,
  Filter,
  Wind,
  BarChart3,
  CalendarDays,
  RefreshCcw,
  Navigation,
  Activity
} from "lucide-react";

import api from "../services/api";
import { calcularAnaliseTecnica } from "../utils/analiseTecnica";

function RosaDosVentos() {
  const navigate = useNavigate();

  const [locais, setLocais] = useState([]);
  const [localId, setLocalId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [registros, setRegistros] = useState([]);
  const [resumo, setResumo] = useState(null);

  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregarLocais() {
    try {
      const response = await api.get("/locais");
      const dados = response.data || [];

      setLocais(dados);

      if (dados.length > 0) {
        setLocalId(dados[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar locais:", error);
      setErro("Erro ao carregar locais monitorados.");
    }
  }

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

  function converterDirecao(graus) {
    const valor = Number(graus);

    if (Number.isNaN(valor)) return "Indefinido";

    const direcao = ((valor % 360) + 360) % 360;

    if (direcao >= 337.5 || direcao < 22.5) return "Norte";
    if (direcao >= 22.5 && direcao < 67.5) return "Nordeste";
    if (direcao >= 67.5 && direcao < 112.5) return "Leste";
    if (direcao >= 112.5 && direcao < 157.5) return "Sudeste";
    if (direcao >= 157.5 && direcao < 202.5) return "Sul";
    if (direcao >= 202.5 && direcao < 247.5) return "Sudoeste";
    if (direcao >= 247.5 && direcao < 292.5) return "Oeste";
    if (direcao >= 292.5 && direcao < 337.5) return "Noroeste";

    return "Indefinido";
  }

  function montarDadosDistribuicao() {
    if (!resumo?.ventoPredominante?.distribuicao) return [];

    return Object.entries(resumo.ventoPredominante.distribuicao)
      .filter(([direcao]) => direcao !== "Indefinido")
      .map(([direcao, quantidade]) => ({
        direcao,
        quantidade
      }));
  }

  function calcularVelocidadeMediaPorDirecao() {
    const direcoes = {
      Norte: [],
      Nordeste: [],
      Leste: [],
      Sudeste: [],
      Sul: [],
      Sudoeste: [],
      Oeste: [],
      Noroeste: []
    };

    registros.forEach((registro) => {
      const direcao = converterDirecao(registro.vento_direcao);
      const velocidade = Number(registro.vento_velocidade || 0);

      if (direcoes[direcao]) {
        direcoes[direcao].push(velocidade);
      }
    });

    return Object.entries(direcoes).map(([direcao, velocidades]) => {
      if (velocidades.length === 0) {
        return {
          direcao,
          velocidadeMedia: 0
        };
      }

      const soma = velocidades.reduce((total, valor) => total + valor, 0);

      return {
        direcao,
        velocidadeMedia: Number((soma / velocidades.length).toFixed(1))
      };
    });
  }

  async function gerarRosaDosVentos(e) {
    if (e) e.preventDefault();

    if (!localId) {
      setMensagem("Selecione um local para gerar a rosa dos ventos.");
      return;
    }

    if (!dataInicio || !dataFim) {
      setMensagem("Informe a data inicial e a data final.");
      return;
    }

    try {
      setCarregando(true);
      setMensagem("");
      setErro("");

      const response = await api.get("/registros", {
        params: {
          local_id: localId,
          data_inicio: dataInicio,
          data_fim: dataFim
        }
      });

      const registrosOrdenados = [...(response.data || [])].sort((a, b) => {
        return new Date(a.data_hora) - new Date(b.data_hora);
      });

      const analise = calcularAnaliseTecnica(registrosOrdenados);

      setRegistros(registrosOrdenados);
      setResumo(analise);

      if (registrosOrdenados.length === 0) {
        setMensagem("Nenhum registro encontrado no período selecionado.");
      } else {
        setMensagem("Rosa dos ventos gerada com sucesso.");
      }
    } catch (error) {
      console.error("Erro ao gerar rosa dos ventos:", error);
      setErro("Erro ao gerar análise de vento.");
    } finally {
      setCarregando(false);
    }
  }

  function limparFiltros() {
    setDataInicio("");
    setDataFim("");
    setRegistros([]);
    setResumo(null);
    setMensagem("");
    setErro("");
  }

  const dadosDistribuicao = montarDadosDistribuicao();
  const dadosVelocidadeMedia = calcularVelocidadeMediaPorDirecao();

  useEffect(() => {
    carregarLocais();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Rosa dos Ventos</h1>
          <p className="page-description">
            Analise a direção predominante dos ventos, frequência por direção e
            velocidade média do período.
          </p>
        </div>

        <div className="dashboard-actions">
          <button type="button" onClick={gerarRosaDosVentos}>
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
          <h2>Análise estatística do vento predominante</h2>
          <p>
            Os registros são agrupados por direção para indicar o vento
            predominante e preparar os dados para a rosa dos ventos.
          </p>
        </div>

        <div className="executive-hero-icon">
          <Compass size={48} />
        </div>
      </div>

      <form className="records-filter-card" onSubmit={gerarRosaDosVentos}>
        <div className="form-header">
          <div>
            <h3>Filtros da rosa dos ventos</h3>
            <p>Escolha o local e o período para analisar o vento predominante.</p>
          </div>

          <Filter size={26} />
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
          {carregando ? "Analisando..." : "Gerar rosa dos ventos"}
        </button>

        <button type="button" className="secondary-button" onClick={limparFiltros}>
          Limpar
        </button>
      </form>

      {carregando ? (
        <div className="table-card">
          <p>Carregando análise dos ventos...</p>
        </div>
      ) : resumo ? (
        <>
          <div className="cards-grid">
            <div className="card metric-card">
              <span>Registros analisados</span>
              <strong>{resumo.quantidade}</strong>
            </div>

            <div className="card metric-card">
              <span>Vento predominante</span>
              <strong>{resumo.ventoPredominante.direcao}</strong>
            </div>

            <div className="card metric-card">
              <span>Frequência predominante</span>
              <strong>
                {formatarNumero(resumo.ventoPredominante.percentual)}%
              </strong>
            </div>

            <div className="card metric-card">
              <span>Vento médio</span>
              <strong>{formatarNumero(resumo.ventoMedio)} km/h</strong>
            </div>
          </div>

          <div className="dashboard-panels-grid">
            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Distribuição por direção</h2>
                  <p>Quantidade de registros agrupados por direção do vento.</p>
                </div>

                <Compass size={24} />
              </div>

              {dadosDistribuicao.length === 0 ? (
                <div className="panel-empty">
                  Não existem dados suficientes de direção do vento.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={dadosDistribuicao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="direcao" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Ocorrências"]}
                    />
                    <Bar dataKey="quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Velocidade média por direção</h2>
                  <p>Velocidade média dos ventos agrupada por direção.</p>
                </div>

                <Wind size={24} />
              </div>

              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={dadosVelocidadeMedia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="direcao" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} km/h`, "Velocidade média"]}
                  />
                  <Bar dataKey="velocidadeMedia" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-panel" style={{ marginTop: 24 }}>
            <div className="panel-header">
              <div>
                <h2>Resumo técnico</h2>
                <p>Informações interpretadas para uso em relatórios.</p>
              </div>

              <BarChart3 size={24} />
            </div>

            <div className="last-records-list">
              <div className="last-record-item">
                <div>
                  <strong>Direção predominante</strong>
                  <span>{resumo.ventoPredominante.direcao}</span>
                </div>
              </div>

              <div className="last-record-item">
                <div>
                  <strong>Ocorrências predominantes</strong>
                  <span>{resumo.ventoPredominante.quantidade} registro(s)</span>
                </div>
              </div>

              <div className="last-record-item">
                <div>
                  <strong>Frequência</strong>
                  <span>
                    {formatarNumero(resumo.ventoPredominante.percentual)}%
                  </span>
                </div>
              </div>

              <div className="last-record-item">
                <div>
                  <strong>Velocidade média geral</strong>
                  <span>{formatarNumero(resumo.ventoMedio)} km/h</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="details-button"
              onClick={() => navigate("/analises")}
            >
              Ver análise técnica completa
            </button>
          </div>

          <div className="report-table-box">
            <h3>Tabela de distribuição dos ventos</h3>

            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Direção</th>
                    <th>Ocorrências</th>
                    <th>Percentual</th>
                    <th>Velocidade média</th>
                  </tr>
                </thead>

                <tbody>
                  {dadosDistribuicao.map((item) => {
                    const velocidadeDirecao = dadosVelocidadeMedia.find(
                      (vento) => vento.direcao === item.direcao
                    );

                    const percentual =
                      resumo.quantidade > 0
                        ? (item.quantidade / resumo.quantidade) * 100
                        : 0;

                    return (
                      <tr key={item.direcao}>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8
                            }}
                          >
                            <Navigation size={16} />
                            {item.direcao}
                          </span>
                        </td>
                        <td>{item.quantidade}</td>
                        <td>{formatarNumero(percentual)}%</td>
                        <td>
                          {formatarNumero(
                            velocidadeDirecao?.velocidadeMedia || 0
                          )}{" "}
                          km/h
                        </td>
                      </tr>
                    );
                  })}

                  {dadosDistribuicao.length === 0 && (
                    <tr>
                      <td colSpan="4">
                        Nenhum dado de direção de vento encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="report-table-box">
            <h3>Registros analisados</h3>

            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Local</th>
                    <th>Cidade</th>
                    <th>Vento</th>
                    <th>Direção em graus</th>
                    <th>Origem</th>
                  </tr>
                </thead>

                <tbody>
                  {registros.slice(0, 30).map((registro) => (
                    <tr key={registro.id}>
                      <td>{formatarData(registro.data_hora)}</td>
                      <td>{registro.local_nome || "Local não informado"}</td>
                      <td>{registro.cidade || "--"}</td>
                      <td>{formatarNumero(registro.vento_velocidade)} km/h</td>
                      <td>{formatarNumero(registro.vento_direcao)}°</td>
                      <td>{registro.origem || "--"}</td>
                    </tr>
                  ))}

                  {registros.length === 0 && (
                    <tr>
                      <td colSpan="6">Nenhum registro encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {registros.length > 30 && (
              <div className="message-box">
                Exibindo os primeiros 30 registros de {registros.length}.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Compass size={42} />
          <h3>Nenhuma rosa dos ventos gerada</h3>
          <p>
            Selecione um local e um período para analisar o vento predominante.
          </p>
        </div>
      )}
    </div>
  );
}

export default RosaDosVentos;