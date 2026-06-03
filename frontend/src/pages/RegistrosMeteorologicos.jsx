import { useEffect, useState } from "react";
import {
  CloudSun,
  Download,
  Filter,
  RefreshCcw,
  Search,
  Trash2,
  Database,
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  Sun
} from "lucide-react";
import api from "../services/api";
import { formatarOrigem } from "../utils/formatadores";

function RegistrosMeteorologicos() {
  const [locais, setLocais] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [localId, setLocalId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregarLocais() {
    try {
      const response = await api.get("/locais");
      setLocais(response.data);
    } catch (error) {
      console.error("Erro ao carregar locais:", error);
      setErro("Erro ao carregar locais monitorados.");
    }
  }

  async function carregarRegistros(filtros = {}) {
    try {
      setCarregando(true);
      setErro("");

      const response = await api.get("/registros", {
        params: filtros
      });

      setRegistros(response.data);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
      setErro("Não foi possível carregar os registros meteorológicos.");
    } finally {
      setCarregando(false);
    }
  }

  async function aplicarFiltros(e) {
    e.preventDefault();

    const filtros = {};

    if (localId) {
      filtros.local_id = localId;
    }

    if (dataInicio) {
      filtros.data_inicio = dataInicio;
    }

    if (dataFim) {
      filtros.data_fim = dataFim;
    }

    await carregarRegistros(filtros);
  }

  async function limparFiltros() {
    setLocalId("");
    setDataInicio("");
    setDataFim("");
    setMensagem("");
    await carregarRegistros();
  }

  async function excluirRegistro(id) {
    const confirmar = confirm("Deseja excluir este registro meteorológico?");

    if (!confirmar) return;

    try {
      await api.delete(`/registros/${id}`);

      setMensagem("Registro excluído com sucesso.");

      setRegistros((registrosAtuais) =>
        registrosAtuais.filter((registro) => registro.id !== id)
      );
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      setErro("Erro ao excluir registro meteorológico.");
    }
  }

  async function coletarTodos() {
    try {
      setMensagem("");
      setErro("");
      setCarregando(true);

      const response = await api.post("/registros/coletar-todos");

      setMensagem(
        `Coleta finalizada: ${response.data.sucessos} sucesso(s) e ${response.data.falhas} falha(s).`
      );

      await carregarRegistros();
    } catch (error) {
      console.error("Erro ao coletar registros:", error);
      setErro("Erro ao coletar registros de todos os locais.");
    } finally {
      setCarregando(false);
    }
  }

  function formatarData(data) {
    if (!data) return "--";

    if (data._seconds) {
      return new Date(data._seconds * 1000).toLocaleString("pt-BR");
    }

    if (data.seconds) {
      return new Date(data.seconds * 1000).toLocaleString("pt-BR");
    }

    return new Date(data).toLocaleString("pt-BR");
  }

  function formatarNumero(valor, casas = 1) {
    if (valor === null || valor === undefined || valor === "") {
      return "--";
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return "--";
    }

    return numero.toFixed(casas);
  }

  function formatarOrigem(origem) {
    const nomes = {
      Estacao_local: "Estação Local",
      estacao_local: "Estação Local",
      api: "Cidade Monitorada",
      api_automatica: "Coleta Automática",
      manual: "Manual"
    };

    return nomes[origem] || origem || "--";
  }

  function calcularResumo() {
    if (!registros || registros.length === 0) {
      return {
        quantidade: 0,
        temperaturaMedia: "--",
        umidadeMedia: "--",
        chuvaTotal: "--",
        ventoMedio: "--",
        radiacaoSolarMedia: "--"
      };
    }

    const temperaturas = registros
      .map((registro) => Number(registro.temperatura))
      .filter((valor) => !Number.isNaN(valor));

    const umidades = registros
      .map((registro) => Number(registro.umidade))
      .filter((valor) => !Number.isNaN(valor));

    const chuvas = registros
      .map((registro) => Number(registro.precipitacao))
      .filter((valor) => !Number.isNaN(valor));

    const ventos = registros
      .map((registro) => Number(registro.vento_velocidade))
      .filter((valor) => !Number.isNaN(valor));

    const radiacoes = registros
      .map((registro) => Number(registro.radiacao_solar))
      .filter((valor) => !Number.isNaN(valor));

    const media = (lista) => {
      if (lista.length === 0) return "--";

      const soma = lista.reduce((total, valor) => total + valor, 0);
      return (soma / lista.length).toFixed(1);
    };

    const soma = (lista) => {
      if (lista.length === 0) return "--";

      return lista.reduce((total, valor) => total + valor, 0).toFixed(1);
    };

    return {
      quantidade: registros.length,
      temperaturaMedia: media(temperaturas),
      umidadeMedia: media(umidades),
      chuvaTotal: soma(chuvas),
      ventoMedio: media(ventos),
      radiacaoSolarMedia: media(radiacoes)
    };
  }

  function exportarCSV() {
    if (registros.length === 0) {
      setMensagem("Não há registros para exportar.");
      return;
    }

    const linhas = [
      [
        "Data/Hora",
        "Local",
        "Cidade",
        "Estado",
        "Temperatura",
        "Umidade",
        "Pressão",
        "Vento",
        "Direção do vento",
        "Chuva",
        "Radiação solar",
        "Origem",
        "Observação"
      ],
      ...registros.map((registro) => [
        formatarData(registro.data_hora),
        registro.local_nome || "",
        registro.cidade || "",
        registro.estado || "",
        `${formatarNumero(registro.temperatura)} °C`,
        `${formatarNumero(registro.umidade)} %`,
        `${formatarNumero(registro.pressao)} hPa`,
        `${formatarNumero(registro.vento_velocidade)} km/h`,
        `${formatarNumero(registro.vento_direcao)}°`,
        `${formatarNumero(registro.precipitacao)} mm`,
        `${formatarNumero(registro.radiacao_solar)} W/m²`,
        formatarOrigem(registro.origem),
        registro.observacao || ""
      ])
    ];

    const csv = linhas.map((linha) => linha.join(";")).join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "registros-meteorologicos.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const resumo = calcularResumo();

  useEffect(() => {
    carregarLocais();
    carregarRegistros();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Registros Meteorológicos</h1>
          <p className="page-description">
            Consulte, filtre, exporte e gerencie os registros meteorológicos
            salvos no sistema.
          </p>
        </div>

        <div className="dashboard-actions">
          <button type="button" onClick={() => carregarRegistros()}>
            <RefreshCcw size={18} />
            Atualizar
          </button>

          <button type="button" onClick={coletarTodos}>
            <Database size={18} />
            Coletar todos
          </button>

          <button type="button" onClick={exportarCSV}>
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {mensagem && <div className="message-box">{mensagem}</div>}
      {erro && <div className="message-box error-message">{erro}</div>}

      <div className="records-hero">
        <div>
          <span className="hero-label">Base histórica</span>
          <h2>Histórico meteorológico dos locais monitorados</h2>
          <p>
            Acompanhe os dados coletados manualmente, automaticamente ou pela API
            meteorológica.
          </p>
        </div>

        <div className="hero-icon">
          <CloudSun size={46} />
        </div>
      </div>

      <form className="records-filter-card" onSubmit={aplicarFiltros}>
        <div className="form-header">
          <div>
            <h3>Filtros de consulta</h3>
            <p>Filtre os registros por local monitorado e período.</p>
          </div>

          <Filter size={26} />
        </div>

        <div className="form-group">
          <label>Local monitorado</label>
          <select value={localId} onChange={(e) => setLocalId(e.target.value)}>
            <option value="">Todos os locais</option>

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
          Filtrar
        </button>

        <button type="button" className="secondary-button" onClick={limparFiltros}>
          Limpar
        </button>
      </form>

      <div className="cards-grid">
        <div className="card">
          <span>Total de registros</span>
          <strong>{resumo.quantidade}</strong>
        </div>

        <div className="card">
          <span>Temperatura média</span>
          <strong>
            {resumo.temperaturaMedia === "--"
              ? "--"
              : `${resumo.temperaturaMedia}°C`}
          </strong>
        </div>

        <div className="card">
          <span>Umidade média</span>
          <strong>
            {resumo.umidadeMedia === "--" ? "--" : `${resumo.umidadeMedia}%`}
          </strong>
        </div>

        <div className="card">
          <span>Chuva acumulada</span>
          <strong>
            {resumo.chuvaTotal === "--" ? "--" : `${resumo.chuvaTotal} mm`}
          </strong>
        </div>

        <div className="card">
          <span>Vento médio</span>
          <strong>
            {resumo.ventoMedio === "--" ? "--" : `${resumo.ventoMedio} km/h`}
          </strong>
        </div>

        <div className="card">
          <span>Radiação solar média</span>
          <strong>
            {resumo.radiacaoSolarMedia === "--"
              ? "--"
              : `${resumo.radiacaoSolarMedia} W/m²`}
          </strong>
        </div>
      </div>

      <div className="records-summary-grid">
        <div className="records-summary-card">
          <Thermometer size={24} />
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
          <Droplets size={24} />
          <div>
            <span>Umidade média</span>
            <strong>
              {resumo.umidadeMedia === "--" ? "--" : `${resumo.umidadeMedia}%`}
            </strong>
          </div>
        </div>

        <div className="records-summary-card">
          <CloudRain size={24} />
          <div>
            <span>Chuva acumulada</span>
            <strong>
              {resumo.chuvaTotal === "--" ? "--" : `${resumo.chuvaTotal} mm`}
            </strong>
          </div>
        </div>

        <div className="records-summary-card">
          <Wind size={24} />
          <div>
            <span>Vento médio</span>
            <strong>
              {resumo.ventoMedio === "--" ? "--" : `${resumo.ventoMedio} km/h`}
            </strong>
          </div>
        </div>

        <div className="records-summary-card">
          <Sun size={24} />
          <div>
            <span>Radiação solar média</span>
            <strong>
              {resumo.radiacaoSolarMedia === "--"
                ? "--"
                : `${resumo.radiacaoSolarMedia} W/m²`}
            </strong>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="table-card">
          <p>Carregando registros meteorológicos...</p>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Local</th>
                <th>Cidade</th>
                <th>Temperatura</th>
                <th>Umidade</th>
                <th>Pressão</th>
                <th>Vento</th>
                <th>Chuva</th>
                <th>Radiação Solar</th>
                <th>Origem</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id}>
                  <td>{formatarData(registro.data_hora)}</td>
                  <td>{registro.local_nome || "Local não informado"}</td>
                  <td>{registro.cidade || "--"}</td>
                  <td>{formatarNumero(registro.temperatura)}°C</td>
                  <td>{formatarNumero(registro.umidade)}%</td>
                  <td>{formatarNumero(registro.pressao)} hPa</td>
                  <td>{formatarNumero(registro.vento_velocidade)} km/h</td>
                  <td>{formatarNumero(registro.precipitacao)} mm</td>
                  <td>{formatarNumero(registro.radiacao_solar)} W/m²</td>
                  <td>
                    <span className={`origin-badge origin-${registro.origem}`}>
                      {formatarOrigem(registro.origem)}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="danger-button small-action-button"
                      onClick={() => excluirRegistro(registro.id)}
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}

              {registros.length === 0 && (
                <tr>
                  <td colSpan="11">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RegistrosMeteorologicos;