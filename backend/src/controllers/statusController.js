const db = require("../config/firebase");
const { buscarClimaAtual } = require("../services/openMeteoService");

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
      relatorios: 0
    },
    verificado_em: new Date().toISOString()
  };

  try {
    const locaisSnapshot = await db.collection("locais_monitorados").get();
    const registrosSnapshot = await db.collection("registros_meteorologicos").get();
    const relatoriosSnapshot = await db.collection("relatorios").get();

    status.firebase.online = true;
    status.firebase.mensagem = "Conexão com Firestore funcionando.";

    status.dados.locais = locaisSnapshot.size;
    status.dados.registros = registrosSnapshot.size;
    status.dados.relatorios = relatoriosSnapshot.size;
  } catch (error) {
    console.error("Erro ao verificar Firebase:", error);

    status.firebase.online = false;
    status.firebase.mensagem = "Falha ao conectar com Firestore.";
  }

  try {
    await buscarClimaAtual(-24.9555, -53.4552);

    status.weatherApi.online = true;
    status.weatherApi.mensagem = "API meteorológica respondendo normalmente.";
  } catch (error) {
    console.error("Erro ao verificar API meteorológica:", error);

    status.weatherApi.online = false;
    status.weatherApi.mensagem = "Falha ao consultar API meteorológica.";
  }

  return res.json(status);
}

module.exports = {
  verificarStatusSistema
};