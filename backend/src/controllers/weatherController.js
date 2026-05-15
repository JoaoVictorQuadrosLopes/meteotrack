const {
  buscarClimaAtual,
  buscarPrevisaoHoraria,
  buscarCoordenadasPorCidade
} = require("../services/openMeteoService");

async function obterClimaAtual(req, res) {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        erro: "Latitude e longitude são obrigatórias."
      });
    }

    const dados = await buscarClimaAtual(latitude, longitude);

    return res.json(dados);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao buscar dados meteorológicos."
    });
  }
}

async function obterPrevisaoHoraria(req, res) {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        erro: "Latitude e longitude são obrigatórias."
      });
    }

    const dados = await buscarPrevisaoHoraria(latitude, longitude);

    return res.json(dados);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao buscar previsão horária."
    });
  }
}

async function obterCoordenadasCidade(req, res) {
  try {
    const { cidade } = req.query;

    if (!cidade) {
      return res.status(400).json({
        erro: "Informe o nome da cidade."
      });
    }

    const resultados = await buscarCoordenadasPorCidade(cidade);

    if (!resultados || resultados.length === 0) {
      return res.status(404).json({
        erro: "Cidade não encontrada."
      });
    }

    const resultado = resultados[0];
    const endereco = resultado.address || {};

    const nomeCidade =
      endereco.city ||
      endereco.town ||
      endereco.village ||
      endereco.municipality ||
      cidade;

    return res.json({
      nome: nomeCidade,
      cidade: nomeCidade,
      estado: endereco.state || "",
      pais: endereco.country || "Brasil",
      latitude: Number(resultado.lat),
      longitude: Number(resultado.lon),
      endereco_completo: resultado.display_name
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao buscar coordenadas da cidade."
    });
  }
}

module.exports = {
  obterClimaAtual,
  obterPrevisaoHoraria,
  obterCoordenadasCidade
};