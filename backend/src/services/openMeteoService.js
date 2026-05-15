const axios = require("axios");

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
      timezone: "America/Sao_Paulo"
    }
  });

  return response.data;
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
        "wind_speed_10m"
      ].join(","),
      forecast_days: 3,
      timezone: "America/Sao_Paulo"
    }
  });

  return response.data;
}

async function buscarCoordenadasPorCidade(nomeCidade) {
  const url = "https://geocoding-api.open-meteo.com/v1/search";

  const response = await axios.get(url, {
    params: {
      name: nomeCidade,
      count: 5,
      language: "pt",
      format: "json"
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