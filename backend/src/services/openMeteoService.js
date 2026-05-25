const axios = require("axios");

function encontrarValorHorarioMaisProximo(hourly, nomeCampo) {
  if (!hourly || !hourly.time || !hourly[nomeCampo]) {
    return 0;
  }

  const agora = new Date();

  let menorDiferenca = Infinity;
  let indiceMaisProximo = 0;

  hourly.time.forEach((horario, index) => {
    const dataHorario = new Date(horario);
    const diferenca = Math.abs(agora - dataHorario);

    if (diferenca < menorDiferenca) {
      menorDiferenca = diferenca;
      indiceMaisProximo = index;
    }
  });

  return Number(hourly[nomeCampo][indiceMaisProximo] || 0);
}

async function buscarClimaAtual(latitude, longitude) {
  const url = "https://api.open-meteo.com/v1/forecast";

  const response = await axios.get(url, {
    params: {
      latitude,
      longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation",
        "weather_code",
        "pressure_msl",
        "wind_speed_10m",
        "wind_direction_10m"
      ].join(","),
      hourly: [
        "shortwave_radiation"
      ].join(","),
      forecast_days: 1,
      timezone: "America/Sao_Paulo"
    }
  });

  const dados = response.data;
  const radiacaoSolarAtual = encontrarValorHorarioMaisProximo(
    dados.hourly,
    "shortwave_radiation"
  );

  return {
    ...dados,
    current: {
      ...(dados.current || {}),
      shortwave_radiation: radiacaoSolarAtual,
      radiacao_solar: radiacaoSolarAtual
    }
  };
}

async function buscarPrevisaoHoraria(latitude, longitude) {
  const url = "https://api.open-meteo.com/v1/forecast";

  const response = await axios.get(url, {
    params: {
      latitude,
      longitude,
      hourly: [
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation",
        "pressure_msl",
        "wind_speed_10m",
        "shortwave_radiation"
      ].join(","),
      forecast_days: 3,
      timezone: "America/Sao_Paulo"
    }
  });

  return response.data;
}

async function buscarCoordenadasPorCidade(nomeCidade) {
  const url = "https://nominatim.openstreetmap.org/search";

  const response = await axios.get(url, {
    params: {
      q: nomeCidade,
      format: "json",
      addressdetails: 1,
      limit: 5,
      countrycodes: "br"
    },
    headers: {
      "User-Agent": "MeteoTrack/1.0 contato@meteotrack.local"
    }
  });

  return response.data;
}

module.exports = {
  buscarClimaAtual,
  buscarPrevisaoHoraria,
  buscarCoordenadasPorCidade
};