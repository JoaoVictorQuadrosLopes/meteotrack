const db = require("../config/firebase");
const { buscarClimaAtual } = require("../services/openMeteoService");

function converterDataFirestore(data) {
  if (!data) return null;

  if (data.toDate && typeof data.toDate === "function") {
    return data.toDate();
  }

  if (data._seconds) {
    return new Date(data._seconds * 1000);
  }

  if (data.seconds) {
    return new Date(data.seconds * 1000);
  }

  return new Date(data);
}

async function buscarLocalDoUsuario(localId, usuarioId) {
  const localDoc = await db.collection("locais_monitorados").doc(localId).get();

  if (!localDoc.exists) {
    return null;
  }

  const local = localDoc.data();

  if (local.usuario_id !== usuarioId) {
    return null;
  }

  return {
    id: localDoc.id,
    ...local
  };
}

async function listarRegistros(req, res) {
  try {
    const { local_id, data_inicio, data_fim } = req.query;

    let query = db
      .collection("registros_meteorologicos")
      .where("usuario_id", "==", req.usuario.uid);

    if (local_id) {
      query = query.where("local_id", "==", local_id);
    }

    const snapshot = await query.get();

    let registros = [];

    for (const doc of snapshot.docs) {
      const dados = doc.data();
      const dataConvertida = converterDataFirestore(dados.data_hora);

      if (data_inicio) {
        const inicio = new Date(`${data_inicio}T00:00:00`);

        if (!dataConvertida || dataConvertida < inicio) {
          continue;
        }
      }

      if (data_fim) {
        const fim = new Date(`${data_fim}T23:59:59`);

        if (!dataConvertida || dataConvertida > fim) {
          continue;
        }
      }

      let local_nome = "Local não encontrado";
      let cidade = "";
      let estado = "";

      if (dados.local_id) {
        const localDoc = await db
          .collection("locais_monitorados")
          .doc(dados.local_id)
          .get();

        if (localDoc.exists) {
          const localData = localDoc.data();

          if (localData.usuario_id === req.usuario.uid) {
            local_nome = localData.nome;
            cidade = localData.cidade || "";
            estado = localData.estado || "";
          }
        }
      }

      registros.push({
        id: doc.id,
        ...dados,
        data_hora: dataConvertida ? dataConvertida.toISOString() : null,
        local_nome,
        cidade,
        estado
      });
    }

    registros.sort((a, b) => {
      return new Date(b.data_hora || 0) - new Date(a.data_hora || 0);
    });

    return res.json(registros);
  } catch (error) {
    console.error("Erro ao listar registros:", error);

    return res.status(500).json({
      erro: "Erro ao listar registros meteorológicos."
    });
  }
}

async function criarRegistro(req, res) {
  try {
    const {
      local_id,
      data_hora,
      temperatura,
      umidade,
      pressao,
      vento_velocidade,
      vento_direcao,
      precipitacao,
      nebulosidade,
      visibilidade,
      origem,
      observacao
    } = req.body;

    if (!local_id || !data_hora) {
      return res.status(400).json({
        erro: "Local e data/hora são obrigatórios."
      });
    }

    const local = await buscarLocalDoUsuario(local_id, req.usuario.uid);

    if (!local) {
      return res.status(403).json({
        erro: "Local não encontrado ou sem permissão."
      });
    }

    const novoRegistro = {
      local_id,
      usuario_id: req.usuario.uid,
      data_hora: new Date(data_hora),
      temperatura: Number(temperatura || 0),
      umidade: Number(umidade || 0),
      pressao: Number(pressao || 0),
      vento_velocidade: Number(vento_velocidade || 0),
      vento_direcao: Number(vento_direcao || 0),
      precipitacao: Number(precipitacao || 0),
      nebulosidade: Number(nebulosidade || 0),
      visibilidade: Number(visibilidade || 0),
      origem: origem || "manual",
      observacao: observacao || "",
      criado_em: new Date()
    };

    const docRef = await db
      .collection("registros_meteorologicos")
      .add(novoRegistro);

    return res.status(201).json({
      id: docRef.id,
      ...novoRegistro,
      data_hora: novoRegistro.data_hora.toISOString(),
      criado_em: novoRegistro.criado_em.toISOString()
    });
  } catch (error) {
    console.error("Erro ao criar registro:", error);

    return res.status(500).json({
      erro: "Erro ao criar registro meteorológico."
    });
  }
}

async function coletarRegistroAtual(req, res) {
  try {
    const { localId } = req.params;

    const local = await buscarLocalDoUsuario(localId, req.usuario.uid);

    if (!local) {
      return res.status(404).json({
        erro: "Local não encontrado ou sem permissão."
      });
    }

    if (!local.latitude || !local.longitude) {
      return res.status(400).json({
        erro: "O local não possui latitude e longitude cadastradas."
      });
    }

    const dadosClima = await buscarClimaAtual(local.latitude, local.longitude);
    const climaAtual = dadosClima.current;

    const novoRegistro = {
      local_id: localId,
      usuario_id: req.usuario.uid,
      data_hora: new Date(),
      temperatura: Number(climaAtual.temperature_2m || 0),
      umidade: Number(climaAtual.relative_humidity_2m || 0),
      pressao: Number(climaAtual.pressure_msl || 0),
      vento_velocidade: Number(climaAtual.wind_speed_10m || 0),
      vento_direcao: Number(climaAtual.wind_direction_10m || 0),
      precipitacao: Number(climaAtual.precipitation || 0),
      nebulosidade: Number(climaAtual.cloud_cover || 0),
      visibilidade: Number(climaAtual.visibility || 0),
      origem: "api",
      observacao: `Registro automático coletado para ${local.nome}.`,
      criado_em: new Date()
    };

    const docRef = await db
      .collection("registros_meteorologicos")
      .add(novoRegistro);

    return res.status(201).json({
      mensagem: "Registro meteorológico coletado com sucesso.",
      registro: {
        id: docRef.id,
        ...novoRegistro,
        data_hora: novoRegistro.data_hora.toISOString(),
        criado_em: novoRegistro.criado_em.toISOString()
      },
      local: {
        id: localId,
        nome: local.nome,
        cidade: local.cidade,
        estado: local.estado || ""
      }
    });
  } catch (error) {
    console.error("Erro ao coletar registro atual:", error);

    return res.status(500).json({
      erro: "Erro ao coletar registro meteorológico atual."
    });
  }
}

async function coletarRegistrosTodosLocais(req, res) {
  try {
    const snapshot = await db
      .collection("locais_monitorados")
      .where("usuario_id", "==", req.usuario.uid)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        erro: "Nenhum local monitorado encontrado."
      });
    }

    const resultados = [];

    for (const doc of snapshot.docs) {
      const localId = doc.id;
      const local = doc.data();

      try {
        if (!local.latitude || !local.longitude) {
          resultados.push({
            local_id: localId,
            local_nome: local.nome,
            sucesso: false,
            erro: "Local sem coordenadas."
          });

          continue;
        }

        const dadosClima = await buscarClimaAtual(local.latitude, local.longitude);
        const climaAtual = dadosClima.current;

        const novoRegistro = {
          local_id: localId,
          usuario_id: req.usuario.uid,
          data_hora: new Date(),
          temperatura: Number(climaAtual.temperature_2m || 0),
          umidade: Number(climaAtual.relative_humidity_2m || 0),
          pressao: Number(climaAtual.pressure_msl || 0),
          vento_velocidade: Number(climaAtual.wind_speed_10m || 0),
          vento_direcao: Number(climaAtual.wind_direction_10m || 0),
          precipitacao: Number(climaAtual.precipitation || 0),
          nebulosidade: Number(climaAtual.cloud_cover || 0),
          visibilidade: Number(climaAtual.visibility || 0),
          origem: "api",
          observacao: `Registro automático coletado para ${local.nome}.`,
          criado_em: new Date()
        };

        const registroRef = await db
          .collection("registros_meteorologicos")
          .add(novoRegistro);

        resultados.push({
          local_id: localId,
          local_nome: local.nome,
          cidade: local.cidade,
          sucesso: true,
          registro_id: registroRef.id
        });
      } catch (error) {
        console.error(`Erro ao coletar local ${local.nome}:`, error);

        resultados.push({
          local_id: localId,
          local_nome: local.nome,
          sucesso: false,
          erro: "Erro ao coletar dados deste local."
        });
      }
    }

    return res.status(201).json({
      mensagem: "Coleta finalizada.",
      total: resultados.length,
      sucessos: resultados.filter((item) => item.sucesso).length,
      falhas: resultados.filter((item) => !item.sucesso).length,
      resultados
    });
  } catch (error) {
    console.error("Erro ao coletar todos:", error);

    return res.status(500).json({
      erro: "Erro ao coletar registros de todos os locais."
    });
  }
}

async function deletarRegistro(req, res) {
  try {
    const { id } = req.params;

    const registroRef = db.collection("registros_meteorologicos").doc(id);
    const registroDoc = await registroRef.get();

    if (!registroDoc.exists) {
      return res.status(404).json({
        erro: "Registro não encontrado."
      });
    }

    const registro = registroDoc.data();

    if (registro.usuario_id !== req.usuario.uid) {
      return res.status(403).json({
        erro: "Você não tem permissão para excluir este registro."
      });
    }

    await registroRef.delete();

    return res.json({
      mensagem: "Registro excluído com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir registro:", error);

    return res.status(500).json({
      erro: "Erro ao excluir registro meteorológico."
    });
  }
}

module.exports = {
  listarRegistros,
  criarRegistro,
  coletarRegistroAtual,
  coletarRegistrosTodosLocais,
  deletarRegistro
};