function obterNumero(valor, padrao = 0) {
  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return padrao;
  }

  return numero;
}

function calcularMedia(lista) {
  if (!lista || lista.length === 0) return 0;

  const soma = lista.reduce((total, valor) => total + obterNumero(valor), 0);
  return soma / lista.length;
}

function calcularSoma(lista) {
  if (!lista || lista.length === 0) return 0;

  return lista.reduce((total, valor) => total + obterNumero(valor), 0);
}

export function classificarPotencialSolar(radiacaoMedia) {
  const valor = obterNumero(radiacaoMedia);

  if (valor <= 300) return "Baixo potencial";
  if (valor <= 600) return "Potencial moderado";

  return "Alto potencial";
}

export function calcularEnergiaSolarEstimativa(
  radiacaoMedia,
  areaPaineis = 10,
  horasSol = 5,
  eficiencia = 0.18
) {
  const energiaWh =
    obterNumero(radiacaoMedia) *
    obterNumero(areaPaineis) *
    obterNumero(horasSol) *
    obterNumero(eficiencia);

  return energiaWh / 1000;
}

export function converterDirecaoVento(graus) {
  const valor = obterNumero(graus, null);

  if (valor === null) return "Indefinido";

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

export function calcularVentoPredominante(registros) {
  const distribuicao = {
    Norte: 0,
    Nordeste: 0,
    Leste: 0,
    Sudeste: 0,
    Sul: 0,
    Sudoeste: 0,
    Oeste: 0,
    Noroeste: 0,
    Indefinido: 0
  };

  registros.forEach((registro) => {
    const direcao = converterDirecaoVento(registro.vento_direcao);

    if (!distribuicao[direcao]) {
      distribuicao[direcao] = 0;
    }

    distribuicao[direcao]++;
  });

  let direcaoPredominante = "Indefinido";
  let quantidade = 0;

  Object.entries(distribuicao).forEach(([direcao, total]) => {
    if (direcao !== "Indefinido" && total > quantidade) {
      direcaoPredominante = direcao;
      quantidade = total;
    }
  });

  const totalRegistros = registros.length || 1;
  const percentual = (quantidade / totalRegistros) * 100;

  return {
    direcao: direcaoPredominante,
    quantidade,
    percentual,
    distribuicao
  };
}

export function gerarAlertasCriticos(registros) {
  const alertas = [];

  registros.forEach((registro) => {
    const temperatura = obterNumero(registro.temperatura);
    const umidade = obterNumero(registro.umidade);
    const vento = obterNumero(registro.vento_velocidade);
    const chuva = obterNumero(registro.precipitacao);
    const radiacaoSolar = obterNumero(registro.radiacao_solar);

    if (temperatura >= 35) {
      alertas.push({
        tipo: "Temperatura elevada",
        nivel: "Crítico",
        valor: `${temperatura.toFixed(1)}°C`,
        limite: "35°C",
        mensagem: `Temperatura de ${temperatura.toFixed(
          1
        )}°C acima da faixa crítica.`,
        data_hora: registro.data_hora
      });
    }

    if (umidade > 0 && umidade <= 30) {
      alertas.push({
        tipo: "Umidade baixa",
        nivel: "Atenção",
        valor: `${umidade.toFixed(1)}%`,
        limite: "30%",
        mensagem: `Umidade de ${umidade.toFixed(
          1
        )}% abaixo da faixa recomendada.`,
        data_hora: registro.data_hora
      });
    }

    if (vento >= 50) {
      alertas.push({
        tipo: "Vento forte",
        nivel: "Crítico",
        valor: `${vento.toFixed(1)} km/h`,
        limite: "50 km/h",
        mensagem: `Vento de ${vento.toFixed(
          1
        )} km/h acima da faixa crítica.`,
        data_hora: registro.data_hora
      });
    }

    if (chuva >= 20) {
      alertas.push({
        tipo: "Chuva intensa",
        nivel: "Atenção",
        valor: `${chuva.toFixed(1)} mm`,
        limite: "20 mm",
        mensagem: `Precipitação de ${chuva.toFixed(
          1
        )} mm identificada no período.`,
        data_hora: registro.data_hora
      });
    }

    if (radiacaoSolar >= 800) {
      alertas.push({
        tipo: "Radiação solar elevada",
        nivel: "Crítico",
        valor: `${radiacaoSolar.toFixed(1)} W/m²`,
        limite: "800 W/m²",
        mensagem: `Radiação solar de ${radiacaoSolar.toFixed(
          1
        )} W/m² acima da faixa crítica.`,
        data_hora: registro.data_hora
      });
    }
  });

  return alertas;
}

export function calcularAnaliseTecnica(registros) {
  if (!registros || registros.length === 0) {
    return {
      quantidade: 0,
      temperaturaMedia: 0,
      temperaturaMaxima: 0,
      temperaturaMinima: 0,
      umidadeMedia: 0,
      ventoMedio: 0,
      pressaoMedia: 0,
      chuvaTotal: 0,
      radiacaoSolarMedia: 0,
      radiacaoSolarMaxima: 0,
      potencialSolar: "Sem dados",
      energiaSolarEstimada: 0,
      ventoPredominante: {
        direcao: "Indefinido",
        quantidade: 0,
        percentual: 0,
        distribuicao: {}
      },
      alertas: []
    };
  }

  const temperaturas = registros.map((r) => obterNumero(r.temperatura));
  const umidades = registros.map((r) => obterNumero(r.umidade));
  const ventos = registros.map((r) => obterNumero(r.vento_velocidade));
  const pressoes = registros.map((r) => obterNumero(r.pressao));
  const chuvas = registros.map((r) => obterNumero(r.precipitacao));
  const radiacoes = registros.map((r) => obterNumero(r.radiacao_solar));

  const radiacaoSolarMedia = calcularMedia(radiacoes);
  const ventoPredominante = calcularVentoPredominante(registros);
  const alertas = gerarAlertasCriticos(registros);

  return {
    quantidade: registros.length,
    temperaturaMedia: calcularMedia(temperaturas),
    temperaturaMaxima: Math.max(...temperaturas),
    temperaturaMinima: Math.min(...temperaturas),
    umidadeMedia: calcularMedia(umidades),
    ventoMedio: calcularMedia(ventos),
    pressaoMedia: calcularMedia(pressoes),
    chuvaTotal: calcularSoma(chuvas),
    radiacaoSolarMedia,
    radiacaoSolarMaxima: Math.max(...radiacoes),
    potencialSolar: classificarPotencialSolar(radiacaoSolarMedia),
    energiaSolarEstimada: calcularEnergiaSolarEstimativa(radiacaoSolarMedia),
    ventoPredominante,
    alertas
  };
}