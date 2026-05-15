const cron = require("node-cron");
const db = require("../config/firebase");
const { buscarClimaAtual } = require("../services/openMeteoService");

async function coletarRegistrosAutomaticamente() {
  try {
    console.log("Iniciando coleta automática de registros meteorológicos...");

    const snapshot = await db.collection("locais_monitorados").get();

    if (snapshot.empty) {
      console.log("Nenhum local monitorado encontrado para coleta automática.");
      return;
    }

    let sucessos = 0;
    let falhas = 0;

    for (const doc of snapshot.docs) {
      const localId = doc.id;
      const local = doc.data();

      try {
        if (!local.latitude || !local.longitude) {
          console.log(`Local sem coordenadas: ${local.nome}`);
          falhas++;
          continue;
        }

        const dadosClima = await buscarClimaAtual(
          local.latitude,
          local.longitude
        );

        const climaAtual = dadosClima.current;

        const novoRegistro = {
          local_id: localId,
          data_hora: new Date(),
          temperatura: Number(climaAtual.temperature_2m || 0),
          umidade: Number(climaAtual.relative_humidity_2m || 0),
          pressao: Number(climaAtual.pressure_msl || 0),
          vento_velocidade: Number(climaAtual.wind_speed_10m || 0),
          vento_direcao: Number(climaAtual.wind_direction_10m || 0),
          precipitacao: Number(climaAtual.precipitation || 0),
          nebulosidade: Number(climaAtual.cloud_cover || 0),
          visibilidade: Number(climaAtual.visibility || 0),
          origem: "automatica",
          observacao: `Registro automático coletado para ${local.nome}.`,
          criado_em: new Date()
        };

        await db.collection("registros_meteorologicos").add(novoRegistro);

        console.log(`Registro automático salvo: ${local.nome}`);
        sucessos++;
      } catch (error) {
        console.error(`Erro ao coletar dados de ${local.nome}:`, error.message);
        falhas++;
      }
    }

    console.log(
      `Coleta automática finalizada. Sucessos: ${sucessos} | Falhas: ${falhas}`
    );
  } catch (error) {
    console.error("Erro geral na coleta automática:", error);
  }
}

function iniciarColetaAutomatica() {
  // Executa a cada 1 hora.
  cron.schedule("0 * * * *", async () => {
    await coletarRegistrosAutomaticamente();
  });

  console.log("Coleta automática configurada para executar a cada 1 hora.");
}

module.exports = {
  iniciarColetaAutomatica,
  coletarRegistrosAutomaticamente
};