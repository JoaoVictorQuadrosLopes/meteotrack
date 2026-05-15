const axios = require("axios");
const db = require("../config/firebase");

async function verificarStatusSistema(req, res) {
  const status = {
    backend: {
      nome: "API Backend",
      online: true,
      mensagem: "Backend funcionando normalmente."
    },
    firebase: {
      nome: "Firebase Firestore",
      online: false,
      mensagem: ""
    },
    weatherApi: {
      nome: "API Meteorológica",
      online: false,
      mensagem: ""
    },
    dados: {
      locais: 0,
      registros: 0,
      relatorios: 0,
      estacoes: 0
    },
    verificado_em: new Date().toISOString()
  };

  try {
    const locaisSnapshot = await db
      .collection("locais_monitorados")
      .where("usuario_id", "==", req.usuario.uid)
      .get();

    const registrosSnapshot = await db
      .collection("registros_meteorologicos")
      .where("usuario_id", "==", req.usuario.uid)
      .get();

    const relatoriosSnapshot = await db
      .collection("relatorios")
      .where("usuario_id", "==", req.usuario.uid)
      .get();

    const estacoesSnapshot = await db
      .collection("estacoes_locais")
      .where("usuario_id", "==", req.usuario.uid)
      .get();

    status.firebase.online = true;
    status.firebase.mensagem = "Conexão com Firestore funcionando.";

    status.dados.locais = locaisSnapshot.size;
    status.dados.registros = registrosSnapshot.size;
    status.dados.relatorios = relatoriosSnapshot.size;
    status.dados.estacoes = estacoesSnapshot.size;
  } catch (error) {
    console.error("Erro ao verificar Firebase:", error.message);

    status.firebase.online = false;
    status.firebase.mensagem = `Falha ao conectar com Firestore: ${error.message}`;
  }

  try {
    const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
      timeout: 15000,
      params: {
        latitude: -24.9555,
        longitude: -53.4552,
        current:
          "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,pressure_msl,wind_speed_10m,wind_direction_10m",
        timezone: "America/Sao_Paulo"
      }
    });

    if (response.data && response.data.current) {
      status.weatherApi.online = true;
      status.weatherApi.mensagem = "API meteorológica respondendo normalmente.";
    } else {
      status.weatherApi.online = false;
      status.weatherApi.mensagem =
        "API respondeu, mas não retornou o campo current.";
    }
  } catch (error) {
    console.error("Erro ao verificar API meteorológica:", error.message);

    status.weatherApi.online = false;
    status.weatherApi.mensagem = `Falha ao consultar API meteorológica: ${error.message}`;
  }

  return res.json(status);
}

module.exports = {
  verificarStatusSistema
};