const axios = require("axios");

/**
 * Cache simples em memória.
 * Ajuda a evitar muitas chamadas na API externa.
 *
 * Observação:
 * Em hospedagens como Render, esse cache limpa quando o servidor reinicia.
 * Mesmo assim já reduz bastante o consumo durante o uso normal.
 */
const cache = new Map();

const TEMPO_CACHE_CLIMA_ATUAL = 20 * 60 * 1000; // 20 minutos
const TEMPO_CACHE_PREVISAO = 60 * 60 * 1000; // 1 hora
const TEMPO_CACHE_CIDADE = 24 * 60 * 60 * 1000; // 24 horas
const TEMPO_CACHE_EXPIRADO_ACEITAVEL = 24 * 60 * 60 * 1000; // 24 horas como fallback

function criarChaveCache(prefixo, dados) {
  return `${prefixo}:${JSON.stringify(dados)}`;
}

function salvarCache(chave, dados) {
  cache.set(chave, {
    dados,
    criadoEm: Date.now()
  });
}

function buscarCache(chave, tempoMaximo) {
  const item = cache.get(chave);

  if (!item) {
    return null;
  }

  const idade = Date.now() - item.criadoEm;

  if (idade > tempoMaximo) {
    return null;
  }

  return item.dados;
}

function buscarCacheMesmoExpirado(chave) {
  const item = cache.get(chave);

  if (!item) {
    return null;
  }

  const idade = Date.now() - item.criadoEm;

  if (idade > TEMPO_CACHE_EXPIRADO_ACEITAVEL) {
    return null;
  }

  return item.dados;
}

function normalizarCoordenada(valor) {
  return Number(valor).toFixed(4);
}

function obterMensagemErro(error) {
  return (
    error.response?.data?.reason ||
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Erro desconhecido ao consultar API externa."
  );
}

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
  const lat = normalizarCoordenada(latitude);
  const lon = normalizarCoordenada(longitude);

  const chaveCache = criarChaveCache("clima-atual", {
    latitude: lat,
    longitude: lon
  });

  const cacheValido = buscarCache(chaveCache, TEMPO_CACHE_CLIMA_ATUAL);

  if (cacheValido) {
    return {
      ...cacheValido,
      origem_dados: "cache"
    };
  }

  const url = "https://api.open-meteo.com/v1/forecast";

  try {
    const response = await axios.get(url, {
      params: {
        latitude: lat,
        longitude: lon,
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
          "shortwave_radiation",
          "precipitation_probability",
          "wind_speed_10m",
          "wind_direction_10m"
        ].join(","),
        forecast_days: 1,
        timezone: "America/Sao_Paulo"
      },
      timeout: 10000
    });

    const dados = response.data;

    const radiacaoSolarAtual = encontrarValorHorarioMaisProximo(
      dados.hourly,
      "shortwave_radiation"
    );

    const probabilidadeChuvaAtual = encontrarValorHorarioMaisProximo(
      dados.hourly,
      "precipitation_probability"
    );

    const ventoAtual = encontrarValorHorarioMaisProximo(
      dados.hourly,
      "wind_speed_10m"
    );

    const direcaoVentoAtual = encontrarValorHorarioMaisProximo(
      dados.hourly,
      "wind_direction_10m"
    );

    const resultado = {
      ...dados,
      origem_dados: "api",
      current: {
        ...(dados.current || {}),

        shortwave_radiation: radiacaoSolarAtual,
        radiacao_solar: radiacaoSolarAtual,

        precipitation_probability: probabilidadeChuvaAtual,
        probabilidade_chuva: probabilidadeChuvaAtual,

        wind_speed_10m:
          dados.current?.wind_speed_10m !== undefined
            ? dados.current.wind_speed_10m
            : ventoAtual,

        wind_direction_10m:
          dados.current?.wind_direction_10m !== undefined
            ? dados.current.wind_direction_10m
            : direcaoVentoAtual
      }
    };

    salvarCache(chaveCache, resultado);

    return resultado;
  } catch (error) {
    const mensagem = obterMensagemErro(error);

    console.error("Erro ao buscar clima atual:", mensagem);

    const cacheExpirado = buscarCacheMesmoExpirado(chaveCache);

    if (cacheExpirado) {
      return {
        ...cacheExpirado,
        origem_dados: "cache_expirado",
        aviso:
          "A API externa falhou ou atingiu o limite diário. Exibindo últimos dados disponíveis em cache.",
        erro_api: mensagem
      };
    }

    throw new Error(`Erro ao buscar clima atual: ${mensagem}`);
  }
}

async function buscarPrevisaoHoraria(latitude, longitude) {
  const lat = normalizarCoordenada(latitude);
  const lon = normalizarCoordenada(longitude);

  const chaveCache = criarChaveCache("previsao-horaria", {
    latitude: lat,
    longitude: lon
  });

  const cacheValido = buscarCache(chaveCache, TEMPO_CACHE_PREVISAO);

  if (cacheValido) {
    return {
      ...cacheValido,
      origem_dados: "cache"
    };
  }

  const url = "https://api.open-meteo.com/v1/forecast";

  try {
    const response = await axios.get(url, {
      params: {
        latitude: lat,
        longitude: lon,
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
          "temperature_2m",
          "relative_humidity_2m",
          "apparent_temperature",
          "precipitation",
          "precipitation_probability",
          "pressure_msl",
          "wind_speed_10m",
          "wind_direction_10m",
          "shortwave_radiation"
        ].join(","),
        forecast_days: 3,
        timezone: "America/Sao_Paulo"
      },
      timeout: 10000
    });

    const resultado = {
      ...response.data,
      origem_dados: "api"
    };

    salvarCache(chaveCache, resultado);

    return resultado;
  } catch (error) {
    const mensagem = obterMensagemErro(error);

    console.error("Erro ao buscar previsão horária:", mensagem);

    const cacheExpirado = buscarCacheMesmoExpirado(chaveCache);

    if (cacheExpirado) {
      return {
        ...cacheExpirado,
        origem_dados: "cache_expirado",
        aviso:
          "A API externa falhou ou atingiu o limite diário. Exibindo últimos dados disponíveis em cache.",
        erro_api: mensagem
      };
    }

    throw new Error(`Erro ao buscar previsão horária: ${mensagem}`);
  }
}

async function buscarCoordenadasPorCidade(nomeCidade) {
  const cidadeNormalizada = String(nomeCidade || "").trim().toLowerCase();

  if (!cidadeNormalizada) {
    return [];
  }

  const chaveCache = criarChaveCache("cidade", {
    cidade: cidadeNormalizada
  });

  const cacheValido = buscarCache(chaveCache, TEMPO_CACHE_CIDADE);

  if (cacheValido) {
    return cacheValido;
  }

  const url = "https://nominatim.openstreetmap.org/search";

  try {
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
      },
      timeout: 10000
    });

    salvarCache(chaveCache, response.data);

    return response.data;
  } catch (error) {
    const mensagem = obterMensagemErro(error);

    console.error("Erro ao buscar coordenadas por cidade:", mensagem);

    const cacheExpirado = buscarCacheMesmoExpirado(chaveCache);

    if (cacheExpirado) {
      return cacheExpirado;
    }

    throw new Error(`Erro ao buscar coordenadas por cidade: ${mensagem}`);
  }
}

module.exports = {
  buscarClimaAtual,
  buscarPrevisaoHoraria,
  buscarCoordenadasPorCidade
};