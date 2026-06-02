import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import {
  FileText,
  Download,
  Search,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  Thermometer,
  CalendarDays,
  Sun,
  Zap,
  Compass,
  AlertTriangle
} from "lucide-react";
import api from "../services/api";
import { calcularAnaliseTecnica } from "../utils/analiseTecnica";

function Relatorios() {
  const [locais, setLocais] = useState([]);
  const [localId, setLocalId] = useState("");
  const [tipoRelatorio, setTipoRelatorio] = useState("periodo");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [relatorio, setRelatorio] = useState(null);
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

  function formatarData(data) {
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

  async function gerarRelatorio(e) {
    e.preventDefault();

    if (!localId) {
      setMensagem("Selecione um local para gerar o relatório.");
      return;
    }

    if (!dataInicio || !dataFim) {
      setMensagem("Informe a data inicial e a data final.");
      return;
    }

    try {
      setCarregando(true);
      setMensagem("");

      const localSelecionado = locais.find((local) => local.id === localId);

      const responseRegistros = await api.get("/registros", {
        params: {
          local_id: localId,
          data_inicio: dataInicio,
          data_fim: dataFim
        }
      });

      const registros = responseRegistros.data;
      const resumo = calcularAnaliseTecnica(registros);

      const dadosRelatorio = {
        titulo: "Relatório Técnico Meteorológico",
        tipo: tipoRelatorio,
        local: localSelecionado,
        dataInicio,
        dataFim,
        registros,
        resumo,
        geradoEm: new Date()
      };

      setRelatorio(dadosRelatorio);

      if (registros.length === 0) {
        setMensagem(
          "Relatório gerado, mas não existem registros nesse período para o local selecionado."
        );
      } else {
        setMensagem("Relatório técnico gerado com sucesso.");
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      setMensagem("Erro ao gerar relatório meteorológico.");
    } finally {
      setCarregando(false);
    }
  }

  function baixarPDF() {
    if (!relatorio) {
      setMensagem("Gere um relatório antes de baixar.");
      return;
    }

    const doc = new jsPDF();

    const local = relatorio.local;
    const resumo = relatorio.resumo;
    const registros = relatorio.registros;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("MeteoTrack - Relatorio Tecnico Meteorologico", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Gerado em: ${relatorio.geradoEm.toLocaleString("pt-BR")}`, 14, 27);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Dados do local", 14, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nome: ${local.nome}`, 14, 51);
    doc.text(`Cidade: ${local.cidade}`, 14, 59);
    doc.text(`Estado: ${local.estado || "-"}`, 14, 67);
    doc.text(`Pais: ${local.pais || "Brasil"}`, 14, 75);
    doc.text(`Periodo: ${relatorio.dataInicio} ate ${relatorio.dataFim}`, 14, 83);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Resumo meteorologico", 14, 99);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Quantidade de registros: ${resumo.quantidade}`, 14, 108);
    doc.text(`Temperatura media: ${formatarNumero(resumo.temperaturaMedia)} C`, 14, 116);
    doc.text(`Maior temperatura: ${formatarNumero(resumo.temperaturaMaxima)} C`, 14, 124);
    doc.text(`Menor temperatura: ${formatarNumero(resumo.temperaturaMinima)} C`, 14, 132);
    doc.text(`Umidade media: ${formatarNumero(resumo.umidadeMedia)} %`, 14, 140);
    doc.text(`Vento medio: ${formatarNumero(resumo.ventoMedio)} km/h`, 14, 148);
    doc.text(`Pressao media: ${formatarNumero(resumo.pressaoMedia)} hPa`, 14, 156);
    doc.text(`Chuva acumulada: ${formatarNumero(resumo.chuvaTotal)} mm`, 14, 164);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Analise tecnica V2", 14, 180);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Radiacao solar media: ${formatarNumero(resumo.radiacaoSolarMedia)} W/m2`, 14, 189);
    doc.text(`Maior radiacao solar: ${formatarNumero(resumo.radiacaoSolarMaxima)} W/m2`, 14, 197);
    doc.text(`Potencial solar: ${resumo.potencialSolar}`, 14, 205);
    doc.text(`Energia estimada: ${formatarNumero(resumo.energiaSolarEstimada, 2)} kWh/dia`, 14, 213);
    doc.text(`Vento predominante: ${resumo.ventoPredominante.direcao}`, 14, 221);
    doc.text(`Frequencia do vento predominante: ${formatarNumero(resumo.ventoPredominante.percentual)} %`, 14, 229);
    doc.text(`Alertas identificados: ${resumo.alertas.length}`, 14, 237);

    let y = 253;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Alertas do periodo", 14, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    if (resumo.alertas.length === 0) {
      doc.text("Nenhum alerta critico identificado no periodo.", 14, y);
      y += 8;
    } else {
      resumo.alertas.slice(0, 8).forEach((alerta) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        doc.text(`${alerta.tipo} - ${alerta.valor} - ${alerta.nivel}`, 14, y);
        y += 6;
      });
    }

    doc.addPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Registros do periodo", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    y = 30;

    if (registros.length === 0) {
      doc.text("Nenhum registro encontrado para o periodo selecionado.", 14, y);
    } else {
      doc.text("Data/Hora", 14, y);
      doc.text("Temp.", 55, y);
      doc.text("Umid.", 73, y);
      doc.text("Vento", 91, y);
      doc.text("Chuva", 112, y);
      doc.text("Rad.", 133, y);
      doc.text("Origem", 160, y);

      y += 7;

      registros.slice(0, 30).forEach((registro) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        doc.text(formatarData(registro.data_hora), 14, y);
        doc.text(`${formatarNumero(registro.temperatura)}C`, 55, y);
        doc.text(`${formatarNumero(registro.umidade)}%`, 73, y);
        doc.text(`${formatarNumero(registro.vento_velocidade)}km/h`, 91, y);
        doc.text(`${formatarNumero(registro.precipitacao)}mm`, 112, y);
        doc.text(`${formatarNumero(registro.radiacao_solar)}W/m2`, 133, y);
        doc.text(`${registro.origem || "--"}`, 160, y);

        y += 7;
      });
    }

    const nomeArquivo = `relatorio-tecnico-${local.cidade || "local"}-${relatorio.dataInicio}-${relatorio.dataFim}.pdf`
      .toLowerCase()
      .replaceAll(" ", "-");

    doc.save(nomeArquivo);
  }

  function baixarCSV() {
    if (!relatorio) {
      setMensagem("Gere um relatório antes de baixar.");
      return;
    }

    const local = relatorio.local;
    const resumo = relatorio.resumo;
    const registros = relatorio.registros;

    const linhas = [
      ["Relatório Técnico Meteorológico"],
      ["Local", local.nome],
      ["Cidade", local.cidade],
      ["Estado", local.estado || ""],
      ["País", local.pais || "Brasil"],
      ["Data inicial", relatorio.dataInicio],
      ["Data final", relatorio.dataFim],
      ["Gerado em", relatorio.geradoEm.toLocaleString("pt-BR")],
      [],
      ["Resumo"],
      ["Quantidade de registros", resumo.quantidade],
      ["Temperatura média", `${formatarNumero(resumo.temperaturaMedia)} °C`],
      ["Maior temperatura", `${formatarNumero(resumo.temperaturaMaxima)} °C`],
      ["Menor temperatura", `${formatarNumero(resumo.temperaturaMinima)} °C`],
      ["Umidade média", `${formatarNumero(resumo.umidadeMedia)} %`],
      ["Vento médio", `${formatarNumero(resumo.ventoMedio)} km/h`],
      ["Pressão média", `${formatarNumero(resumo.pressaoMedia)} hPa`],
      ["Chuva acumulada", `${formatarNumero(resumo.chuvaTotal)} mm`],
      ["Radiação solar média", `${formatarNumero(resumo.radiacaoSolarMedia)} W/m²`],
      ["Maior radiação solar", `${formatarNumero(resumo.radiacaoSolarMaxima)} W/m²`],
      ["Potencial solar", resumo.potencialSolar],
      ["Energia estimada", `${formatarNumero(resumo.energiaSolarEstimada, 2)} kWh/dia`],
      ["Vento predominante", resumo.ventoPredominante.direcao],
      ["Frequência do vento predominante", `${formatarNumero(resumo.ventoPredominante.percentual)} %`],
      ["Alertas identificados", resumo.alertas.length],
      [],
      ["Alertas"],
      ["Tipo", "Nível", "Valor", "Limite", "Mensagem", "Data/Hora"],
      ...resumo.alertas.map((alerta) => [
        alerta.tipo,
        alerta.nivel,
        alerta.valor,
        alerta.limite,
        alerta.mensagem,
        formatarData(alerta.data_hora)
      ]),
      [],
      ["Distribuição dos ventos"],
      ["Direção", "Quantidade"],
      ...Object.entries(resumo.ventoPredominante.distribuicao || {}).map(
        ([direcao, quantidade]) => [direcao, quantidade]
      ),
      [],
      [
        "Data/Hora",
        "Temperatura",
        "Umidade",
        "Pressão",
        "Vento",
        "Direção do vento",
        "Precipitação",
        "Radiação solar",
        "Origem",
        "Observação"
      ],
      ...registros.map((registro) => [
        formatarData(registro.data_hora),
        `${formatarNumero(registro.temperatura)} °C`,
        `${formatarNumero(registro.umidade)} %`,
        `${formatarNumero(registro.pressao)} hPa`,
        `${formatarNumero(registro.vento_velocidade)} km/h`,
        `${formatarNumero(registro.vento_direcao)}°`,
        `${formatarNumero(registro.precipitacao)} mm`,
        `${formatarNumero(registro.radiacao_solar)} W/m²`,
        registro.origem || "",
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
    link.download = `relatorio-tecnico-${local.cidade || "local"}-${relatorio.dataInicio}-${relatorio.dataFim}.csv`
      .toLowerCase()
      .replaceAll(" ", "-");

    link.click();

    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    carregarLocais();
  }, []);

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h1>Relatórios</h1>
          <p className="page-description">
            Gere relatórios técnicos com potencial solar, alertas e vento
            predominante.
          </p>
        </div>
      </div>

      {mensagem && <div className="message-box">{mensagem}</div>}

      <form className="report-form-card" onSubmit={gerarRelatorio}>
        <div className="form-header">
          <div>
            <h3>Configuração do relatório técnico</h3>
            <p>Escolha o local e o período que deseja analisar.</p>
          </div>

          <FileText size={26} />
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
          <label>Tipo de relatório</label>
          <select
            value={tipoRelatorio}
            onChange={(e) => setTipoRelatorio(e.target.value)}
          >
            <option value="periodo">Por período</option>
            <option value="diario">Diário</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
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
          {carregando ? "Gerando..." : "Gerar relatório"}
        </button>
      </form>

      {relatorio && (
        <div className="report-preview modern-report">
          <div className="report-preview-header">
            <div>
              <span className="hero-label">Prévia do relatório técnico</span>
              <h2>{relatorio.local.nome}</h2>
              <p>
                {relatorio.local.cidade}
                {relatorio.local.estado ? ` - ${relatorio.local.estado}` : ""}
              </p>
              <p>
                Período: {relatorio.dataInicio} até {relatorio.dataFim}
              </p>
            </div>

            <div className="report-actions">
              <button type="button" onClick={baixarPDF}>
                <Download size={18} />
                Baixar PDF
              </button>

              <button type="button" onClick={baixarCSV}>
                <Download size={18} />
                Baixar CSV
              </button>
            </div>
          </div>

          <div className="cards-grid">
            <div className="card">
              <span>Registros</span>
              <strong>{relatorio.resumo.quantidade}</strong>
            </div>

            <div className="card">
              <span>Temperatura média</span>
              <strong>
                {formatarNumero(relatorio.resumo.temperaturaMedia)}°C
              </strong>
            </div>

            <div className="card">
              <span>Radiação solar média</span>
              <strong>
                {formatarNumero(relatorio.resumo.radiacaoSolarMedia)} W/m²
              </strong>
            </div>

            <div className="card">
              <span>Potencial solar</span>
              <strong>{relatorio.resumo.potencialSolar}</strong>
            </div>

            <div className="card">
              <span>Energia estimada</span>
              <strong>
                {formatarNumero(relatorio.resumo.energiaSolarEstimada, 2)}{" "}
                kWh/dia
              </strong>
            </div>

            <div className="card">
              <span>Vento predominante</span>
              <strong>{relatorio.resumo.ventoPredominante.direcao}</strong>
            </div>

            <div className="card">
              <span>Alertas</span>
              <strong>{relatorio.resumo.alertas.length}</strong>
            </div>
          </div>

          <div className="report-details-grid">
            <div className="report-detail-item">
              <Sun size={22} />
              <div>
                <span>Maior radiação solar</span>
                <strong>
                  {formatarNumero(relatorio.resumo.radiacaoSolarMaxima)} W/m²
                </strong>
              </div>
            </div>

            <div className="report-detail-item">
              <Zap size={22} />
              <div>
                <span>Estimativa fotovoltaica</span>
                <strong>
                  {formatarNumero(relatorio.resumo.energiaSolarEstimada, 2)}{" "}
                  kWh/dia
                </strong>
              </div>
            </div>

            <div className="report-detail-item">
              <Compass size={22} />
              <div>
                <span>Vento predominante</span>
                <strong>
                  {relatorio.resumo.ventoPredominante.direcao} (
                  {formatarNumero(
                    relatorio.resumo.ventoPredominante.percentual
                  )}
                  %)
                </strong>
              </div>
            </div>

            <div className="report-detail-item">
              <AlertTriangle size={22} />
              <div>
                <span>Faixas críticas</span>
                <strong>{relatorio.resumo.alertas.length} alerta(s)</strong>
              </div>
            </div>

            <div className="report-detail-item">
              <Thermometer size={22} />
              <div>
                <span>Maior temperatura</span>
                <strong>
                  {formatarNumero(relatorio.resumo.temperaturaMaxima)}°C
                </strong>
              </div>
            </div>

            <div className="report-detail-item">
              <Droplets size={22} />
              <div>
                <span>Umidade média</span>
                <strong>
                  {formatarNumero(relatorio.resumo.umidadeMedia)}%
                </strong>
              </div>
            </div>

            <div className="report-detail-item">
              <Gauge size={22} />
              <div>
                <span>Pressão média</span>
                <strong>
                  {formatarNumero(relatorio.resumo.pressaoMedia)} hPa
                </strong>
              </div>
            </div>

            <div className="report-detail-item">
              <CloudRain size={22} />
              <div>
                <span>Chuva acumulada</span>
                <strong>
                  {formatarNumero(relatorio.resumo.chuvaTotal)} mm
                </strong>
              </div>
            </div>

            <div className="report-detail-item">
              <Wind size={22} />
              <div>
                <span>Vento médio</span>
                <strong>
                  {formatarNumero(relatorio.resumo.ventoMedio)} km/h
                </strong>
              </div>
            </div>

            <div className="report-detail-item">
              <CalendarDays size={22} />
              <div>
                <span>Período</span>
                <strong>
                  {relatorio.dataInicio} até {relatorio.dataFim}
                </strong>
              </div>
            </div>
          </div>

          {relatorio.resumo.alertas.length > 0 && (
            <div className="report-table-box">
              <h3>Alertas encontrados</h3>

              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Nível</th>
                      <th>Valor</th>
                      <th>Limite</th>
                      <th>Mensagem</th>
                    </tr>
                  </thead>

                  <tbody>
                    {relatorio.resumo.alertas.map((alerta, index) => (
                      <tr key={index}>
                        <td>{alerta.tipo}</td>
                        <td>{alerta.nivel}</td>
                        <td>{alerta.valor}</td>
                        <td>{alerta.limite}</td>
                        <td>{alerta.mensagem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="report-table-box">
            <h3>Registros encontrados</h3>

            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Temperatura</th>
                    <th>Umidade</th>
                    <th>Pressão</th>
                    <th>Vento</th>
                    <th>Direção</th>
                    <th>Chuva</th>
                    <th>Radiação Solar</th>
                    <th>Origem</th>
                  </tr>
                </thead>

                <tbody>
                  {relatorio.registros.map((registro) => (
                    <tr key={registro.id}>
                      <td>{formatarData(registro.data_hora)}</td>
                      <td>{formatarNumero(registro.temperatura)}°C</td>
                      <td>{formatarNumero(registro.umidade)}%</td>
                      <td>{formatarNumero(registro.pressao)} hPa</td>
                      <td>{formatarNumero(registro.vento_velocidade)} km/h</td>
                      <td>{formatarNumero(registro.vento_direcao)}°</td>
                      <td>{formatarNumero(registro.precipitacao)} mm</td>
                      <td>{formatarNumero(registro.radiacao_solar)} W/m²</td>
                      <td>{registro.origem || "--"}</td>
                    </tr>
                  ))}

                  {relatorio.registros.length === 0 && (
                    <tr>
                      <td colSpan="9">
                        Nenhum registro encontrado para esse local nesse
                        período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Relatorios;