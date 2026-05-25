const cron = require("node-cron");
const db = require("../config/firebase");
const { buscarClimaAtual } = require("../services/openMeteoService");

async function coletarRegistrosAutomaticos() {
  try {
    console.log("Iniciando coleta automática de registros...");

    const snapshot = await db.collection("locais_monitorados").get();

    if (snapshot.empty) {
      console.log("Nenhum local monitorado encontrado.");
      return;
    }

    let total = 0;
    let sucessos = 0;
    let falhas = 0;

    for (const doc of snapshot.docs) {
      const localId = doc.id;
      const local = doc.data();

      total++;

      try {
        if (!local.latitude || !local.longitude) {
          console.log(`Local ${local.nome} sem latitude/longitude.`);
          falhas++;
          continue;
        }

        if (!local.usuario_id) {
          console.log(`Local ${local.nome} sem usuario_id.`);
          falhas++;
          continue;
        }

        const dadosClima = await buscarClimaAtual(
          local.latitude,
          local.longitude
        );

        const climaAtual = dadosClima.current || {};

        const novoRegistro = {
          local_id: localId,
          usuario_id: local.usuario_id,
          data_hora: new Date(),

          temperatura: Number(climaAtual.temperature_2m || 0),
          umidade: Number(climaAtual.relative_humidity_2m || 0),
          pressao: Number(climaAtual.pressure_msl || 0),
          vento_velocidade: Number(climaAtual.wind_speed_10m || 0),
          vento_direcao: Number(climaAtual.wind_direction_10m || 0),
          precipitacao: Number(climaAtual.precipitation || 0),
          nebulosidade: Number(climaAtual.cloud_cover || 0),
          visibilidade: Number(climaAtual.visibility || 0),
          radiacao_solar: Number(climaAtual.shortwave_radiation || 0),

          origem: "api_automatica",
          observacao: `Registro automático coletado para ${local.nome}.`,
          criado_em: new Date()
        };

        const registroRef = await db
          .collection("registros_meteorologicos")
          .add(novoRegistro);

        console.log(
          `Registro salvo para ${local.nome}. ID: ${registroRef.id}`
        );

        sucessos++;
      } catch (error) {
        console.error(`Erro ao coletar dados de ${local.nome}:`, error.message);
        falhas++;
      }
    }

    console.log("Coleta automática finalizada:", {
      total,
      sucessos,
      falhas
    });
  } catch (error) {
    console.error("Erro geral na coleta automática:", error);
  }
}

function iniciarColetaAutomatica() {
  cron.schedule("*/10 * * * *", async () => {
    await coletarRegistrosAutomaticos();
  });

  console.log("Coleta automática agendada para rodar a cada 10 minutos.");
}

module.exports = {
  iniciarColetaAutomatica,
  coletarRegistrosAutomaticos
};