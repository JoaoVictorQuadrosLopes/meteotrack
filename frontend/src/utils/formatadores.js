export function formatarOrigem(origem) {
  const valor = String(origem || "")
    .trim()
    .toLowerCase();

  if (!valor) return "--";

  const origens = {
    api: "Cidade Monitorada",
    api_automatica: "Coleta Automática",
    api_manual: "Coleta Manual",
    manual: "Registro Manual",
    estacao_local: "Estação Local",
    estação_local: "Estação Local",
    esp8266: "Estação Local",
    sensor_local: "Sensor Local"
  };

  return origens[valor] || origem;
}

export function obterClasseOrigem(origem) {
  const valor = String(origem || "")
    .trim()
    .toLowerCase();

  if (valor === "api") return "api";
  if (valor === "api_automatica") return "automatica";
  if (valor === "api_manual") return "manual";
  if (valor === "manual") return "manual";
  if (valor === "estacao_local") return "estacao";
  if (valor === "estação_local") return "estacao";
  if (valor === "esp8266") return "estacao";
  if (valor === "sensor_local") return "estacao";

  return "padrao";
}

export function formatarData(data) {
  if (!data) return "--";

  return new Date(data).toLocaleString("pt-BR");
}

export function formatarNumero(valor, casas = 1) {
  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return "--";
  }

  return numero.toFixed(casas);
}