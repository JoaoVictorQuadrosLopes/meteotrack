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
  AlertTriangle,
  BarChart3
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

  function limitarTexto(texto, limite = 90) {
    if (!texto) return "";

    if (texto.length <= limite) {
      return texto;
    }

    return `${texto.slice(0, limite)}...`;
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

      const registros = [...responseRegistros.data].sort((a, b) => {
        return new Date(a.data_hora) - new Date(b.data_hora);
      });

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

  function escreverLinha(doc, texto, x, y, opcoes = {}) {
    doc.text(String(texto), x, y, opcoes);
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

    let y = 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    escreverLinha(doc, "MeteoTrack - Relatorio Tecnico V2", 14, y);

    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    escreverLinha(
      doc,
      `Gerado em: ${relatorio.geradoEm.toLocaleString("pt-BR")}`,
      14,
      y
    );

    y += 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    escreverLinha(doc, "1. Dados do local", 14, y);

    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    escreverLinha(doc, `Nome: ${local.nome}`, 14, y);
    y += 8;
    escreverLinha(doc, `Cidade: ${local.cidade}`, 14, y);
    y += 8;
    escreverLinha(doc, `Estado: ${local.estado || "-"}`, 14, y);
    y += 8;
    escreverLinha(doc, `Pais: ${local.pais || "Brasil"}`, 14, y);
    y += 8;
    escreverLinha(
      doc,
      `Periodo analisado: ${relatorio.dataInicio} ate ${relatorio.dataFim}`,
      14,
      y
    );

    y += 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    escreverLinha(doc, "2. Resumo meteorologico", 14, y);

    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    escreverLinha(doc, `Quantidade de registros: ${resumo.quantidade}`, 14, y);
    y += 8;
    escreverLinha(
      doc,
      `Temperatura media: ${formatarNumero(resumo.temperaturaMedia)} C`,
      14,
      y
    );
    y += 8;
    escreverLinha(
      doc,
      `Maior temperatura: ${formatarNumero(resumo.temperaturaMaxima)} C`,
      14,
      y
    );
    y += 8;
    escreverLinha(
      doc,
      `Menor temperatura: ${formatarNumero(resumo.temperaturaMinima)} C`,
      14,
      y
    );
    y += 8;
    escreverLinha(
      doc,
      `Umidade media: ${formatarNumero(resumo.umidadeMedia)} %`,
      14,
      y
    );
    y += 8;
    escreverLinha(
      doc,
      `Pressao media: ${formatarNumero(resumo.pressaoMedia)} hPa`,
      14,
      y
    );
    y += 8;
    escreverLinha(
      doc,
      `Chuva acumulada: ${formatarNumero(resumo.chuvaTotal)} mm`,
      14,
      y
    );
    y += 8;
    escreverLinha(
      doc,
      `Vento medio: ${formatarNumero(resumo.ventoMedio)} km/h`,
      14,
      y
    );

    y += 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    escreverLinha(doc, "3. Analise solar e irradiancia", 14, y);

    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    escreverLinha(
      doc,
      `Radiacao solar media: ${formatarNumero(resumo.radiacaoSolarMedia)} W/m2`,
      14,
      y
    );
    y += 8;
    escreverLinha(
      doc,
      `Maior radiacao solar: ${formatarNumero(
        resumo.radiacaoSolarMaxima
      )} W/m2`,
      14,
      y
    );
    y += 8;
    escreverLinha(doc, `Classificacao: ${resumo.potencialSolar}`, 14, y);
    y += 8;
    escreverLinha(
      doc,
      `Energia estimada: ${formatarNumero(
        resumo.energiaSolarEstimada,
        2
      )} kWh/dia`,
      14,
      y
    );
    y += 8;
    escreverLinha(
      doc,
      "Parametros considerados: area de 10 m2, 5 horas de sol e eficiencia de 18%.",
      14,
      y,
      { maxWidth: 180 }
    );

    y += 15;

    if (y > 255) {
      doc.addPage();
      y = 18;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    escreverLinha(doc, "4. Analise do vento predominante", 14, y);

    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    escreverLinha(
      doc,
      `Direcao predominante: ${resumo.ventoPredominante.direcao}`,
      14,
      y
    );
    y += 8;
    escreverLinha(
      doc,
      `Frequencia: ${formatarNumero(resumo.ventoPredominante.percentual)} %`,
      14,
      y
    );
    y += 8;
    escreverLinha(
      doc,
      `Ocorrencias: ${resumo.ventoPredominante.quantidade}`,
      14,
      y
    );

    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    escreverLinha(doc, "Distribuicao dos ventos:", 14, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    Object.entries(resumo.ventoPredominante.distribuicao || {}).forEach(
      ([direcao, quantidade]) => {
        if (direcao === "Indefinido") return;

        if (y > 280) {
          doc.addPage();
          y = 18;
        }

        escreverLinha(doc, `${direcao}: ${quantidade} registro(s)`, 18, y);
        y += 6;
      }
    );

    y += 10;

    if (y > 250) {
      doc.addPage();
      y = 18;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    escreverLinha(doc, "5. Alertas criticos", 14, y);

    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    if (resumo.alertas.length === 0) {
      escreverLinha(
        doc,
        "Nenhum alerta critico foi identificado no periodo analisado.",
        14,
        y
      );
      y += 8;
    } else {
      resumo.alertas.slice(0, 12).forEach((alerta) => {
        if (y > 280) {
          doc.addPage();
          y = 18;
        }

        escreverLinha(
          doc,
          `${alerta.tipo} | ${alerta.nivel} | ${alerta.valor} | Limite: ${alerta.limite}`,
          14,
          y
        );
        y += 6;

        escreverLinha(doc, limitarTexto(alerta.mensagem, 110), 18, y, {
          maxWidth: 175
        });
        y += 8;
      });

      if (resumo.alertas.length > 12) {
        escreverLinha(
          doc,
          `Observacao: foram exibidos os primeiros 12 alertas de ${resumo.alertas.length}.`,
          14,
          y
        );
        y += 8;
      }
    }

    y += 10;

    if (y > 240) {
      doc.addPage();
      y = 18;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    escreverLinha(doc, "6. Observacao metodologica", 14, y);

    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    escreverLinha(
      doc,
      "A estimativa fotovoltaica apresentada e simplificada e possui finalidade academica, nao substituindo um projeto tecnico profissional. Os calculos consideram valores medios de radiacao solar dos registros, area padrao de 10 m2, 5 horas de sol e eficiencia estimada de 18%.",
      14,
      y,
      { maxWidth: 180 }
    );

    doc.addPage();

    y = 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    escreverLinha(doc, "7. Registros do periodo", 14, y);

    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    if (registros.length === 0) {
      escreverLinha(
        doc,
        "Nenhum registro encontrado para o periodo selecionado.",
        14,
        y
      );
    } else {
      escreverLinha(doc, "Data/Hora", 14, y);
      escreverLinha(doc, "Temp.", 55, y);
      escreverLinha(doc, "Umid.", 73, y);
      escreverLinha(doc, "Vento", 91, y);
      escreverLinha(doc, "Chuva", 112, y);
      escreverLinha(doc, "Rad.", 133, y);
      escreverLinha(doc, "Origem", 160, y);

      y += 7;

      registros.slice(0, 35).forEach((registro) => {
        if (y > 280) {
          doc.addPage();
          y = 18;
        }

        escreverLinha(doc, formatarData(registro.data_hora), 14, y);
        escreverLinha(doc, `${formatarNumero(registro.temperatura)}C`, 55, y);
        escreverLinha(doc, `${formatarNumero(registro.umidade)}%`, 73, y);
        escreverLinha(
          doc,
          `${formatarNumero(registro.vento_velocidade)}km/h`,
          91,
          y
        );
        escreverLinha(doc, `${formatarNumero(registro.precipitacao)}mm`, 112, y);
        escreverLinha(
          doc,
          `${formatarNumero(registro.radiacao_solar)}W/m2`,
          133,
          y
        );
        escreverLinha(doc, `${registro.origem || "--"}`, 160, y);

        y += 7;
      });

      if (registros.length > 35) {
        y += 5;
        escreverLinha(
          doc,
          `Observacao: o PDF exibiu os primeiros 35 registros. O CSV contem todos os ${registros.length} registros.`,
          14,
          y,
          { maxWidth: 180 }
        );
      }
    }

    const nomeArquivo = `relatorio-tecnico-v2-${local.cidade || "local"}-${
      relatorio.dataInicio
    }-${relatorio.dataFim}.pdf`
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
      ["Relatório Técnico Meteorológico V2"],
      ["Local", local.nome],
      ["Cidade", local.cidade],
      ["Estado", local.estado || ""],
      ["País", local.pais || "Brasil"],
      ["Data inicial", relatorio.dataInicio],
      ["Data final", relatorio.dataFim],
      ["Gerado em", relatorio.geradoEm.toLocaleString("pt-BR")],
      [],
      ["Resumo meteorológico"],
      ["Quantidade de registros", resumo.quantidade],
      ["Temperatura média", `${formatarNumero(resumo.temperaturaMedia)} °C`],
      ["Maior temperatura", `${formatarNumero(resumo.temperaturaMaxima)} °C`],
      ["Menor temperatura", `${formatarNumero(resumo.temperaturaMinima)} °C`],
      ["Umidade média", `${formatarNumero(resumo.umidadeMedia)} %`],
      ["Vento médio", `${formatarNumero(resumo.ventoMedio)} km/h`],
      ["Pressão média", `${formatarNumero(resumo.pressaoMedia)} hPa`],
      ["Chuva acumulada", `${formatarNumero(resumo.chuvaTotal)} mm`],
      [],
      ["Análise solar"],
      ["Radiação solar média", `${formatarNumero(resumo.radiacaoSolarMedia)} W/m²`],
      ["Maior radiação solar", `${formatarNumero(resumo.radiacaoSolarMaxima)} W/m²`],
      ["Potencial solar", resumo.potencialSolar],
      ["Energia estimada", `${formatarNumero(resumo.energiaSolarEstimada, 2)} kWh/dia`],
      ["Parâmetros", "Área 10 m²; 5 horas de sol; eficiência 18%"],
      [],
      ["Vento predominante"],
      ["Direção predominante", resumo.ventoPredominante.direcao],
      ["Frequência", `${formatarNumero(resumo.ventoPredominante.percentual)} %`],
      ["Ocorrências", resumo.ventoPredominante.quantidade],
      [],
      ["Distribuição dos ventos"],
      ["Direção", "Quantidade"],
      ...Object.entries(resumo.ventoPredominante.distribuicao || {}).map(
        ([direcao, quantidade]) => [direcao, quantidade]
      ),
      [],
      ["Alertas críticos"],
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
    link.download = `relatorio-tecnico-v2-${local.cidade || "local"}-${
      relatorio.dataInicio
    }-${relatorio.dataFim}.csv`
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
          <h1>Relatórios V2</h1>
          <p className="page-description">
            Gere relatórios técnicos com potencial solar, irradiância, alertas
            críticos e vento predominante.
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

        <button type="submit" className="submit-button" disabled={carregando}>
          <Search size={18} />
          {carregando ? "Gerando..." : "Gerar relatório técnico"}
        </button>
      </form>

      {relatorio && (
        <div className="report-preview modern-report">
          <div className="report-preview-header">
            <div>
              <span className="hero-label">Prévia do relatório técnico V2</span>
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
              <span>Alertas críticos</span>
              <strong>{relatorio.resumo.alertas.length}</strong>
            </div>
          </div>

          <div className="dashboard-panels-grid">
            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Resumo meteorológico</h2>
                  <p>Indicadores gerais do período.</p>
                </div>

                <CloudRain size={24} />
              </div>

              <div className="records-summary-grid">
                <div className="records-summary-card">
                  <Thermometer size={22} />
                  <div>
                    <span>Temperatura média</span>
                    <strong>
                      {formatarNumero(relatorio.resumo.temperaturaMedia)}°C
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Droplets size={22} />
                  <div>
                    <span>Umidade média</span>
                    <strong>
                      {formatarNumero(relatorio.resumo.umidadeMedia)}%
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Gauge size={22} />
                  <div>
                    <span>Pressão média</span>
                    <strong>
                      {formatarNumero(relatorio.resumo.pressaoMedia)} hPa
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <CloudRain size={22} />
                  <div>
                    <span>Chuva acumulada</span>
                    <strong>
                      {formatarNumero(relatorio.resumo.chuvaTotal)} mm
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Análise solar</h2>
                  <p>Potencial solar e estimativa fotovoltaica.</p>
                </div>

                <Sun size={24} />
              </div>

              <div className="records-summary-grid">
                <div className="records-summary-card">
                  <Sun size={22} />
                  <div>
                    <span>Radiação média</span>
                    <strong>
                      {formatarNumero(relatorio.resumo.radiacaoSolarMedia)} W/m²
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Sun size={22} />
                  <div>
                    <span>Maior radiação</span>
                    <strong>
                      {formatarNumero(relatorio.resumo.radiacaoSolarMaxima)} W/m²
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Zap size={22} />
                  <div>
                    <span>Classificação</span>
                    <strong>{relatorio.resumo.potencialSolar}</strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Zap size={22} />
                  <div>
                    <span>Energia estimada</span>
                    <strong>
                      {formatarNumero(
                        relatorio.resumo.energiaSolarEstimada,
                        2
                      )}{" "}
                      kWh/dia
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
                  <p>Análise estatística para rosa dos ventos.</p>
                </div>

                <Compass size={24} />
              </div>

              <div className="records-summary-grid">
                <div className="records-summary-card">
                  <Compass size={22} />
                  <div>
                    <span>Direção</span>
                    <strong>
                      {relatorio.resumo.ventoPredominante.direcao}
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <BarChart3 size={22} />
                  <div>
                    <span>Frequência</span>
                    <strong>
                      {formatarNumero(
                        relatorio.resumo.ventoPredominante.percentual
                      )}
                      %
                    </strong>
                  </div>
                </div>

                <div className="records-summary-card">
                  <Wind size={22} />
                  <div>
                    <span>Vento médio</span>
                    <strong>
                      {formatarNumero(relatorio.resumo.ventoMedio)} km/h
                    </strong>
                  </div>
                </div>
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

              {relatorio.resumo.alertas.length === 0 ? (
                <div className="panel-empty">
                  Nenhum alerta crítico foi identificado no período.
                </div>
              ) : (
                <div className="dashboard-alert-list">
                  {relatorio.resumo.alertas.slice(0, 5).map((alerta, index) => (
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

          <div className="dashboard-panel" style={{ marginTop: 24 }}>
            <div className="panel-header">
              <div>
                <h2>Observação metodológica</h2>
                <p>Critérios utilizados para o cálculo técnico.</p>
              </div>

              <CalendarDays size={24} />
            </div>

            <div className="panel-empty">
              A estimativa fotovoltaica apresentada é simplificada e possui
              finalidade acadêmica, não substituindo um projeto técnico
              profissional. O cálculo considera área de 10 m², 5 horas de sol e
              eficiência estimada de 18%.
            </div>
          </div>

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