const crypto = require("crypto");
const db = require("../config/firebase");

function gerarChaveEstacao() {
  return `mtk_${crypto.randomBytes(12).toString("hex")}`;
}

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

async function listarEstacoes(req, res) {
  try {
    const snapshot = await db
      .collection("estacoes_locais")
      .where("usuario_id", "==", req.usuario.uid)
      .get();

    const estacoes = [];

    for (const doc of snapshot.docs) {
      const dados = doc.data();

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

      const ultimaLeitura = converterDataFirestore(dados.ultima_leitura_em);
      const criadoEm = converterDataFirestore(dados.criado_em);

      estacoes.push({
        id: doc.id,
        ...dados,
        local_nome,
        cidade,
        estado,
        ultima_leitura_em: ultimaLeitura ? ultimaLeitura.toISOString() : null,
        criado_em: criadoEm ? criadoEm.toISOString() : null
      });
    }

    estacoes.sort((a, b) => {
      return new Date(b.criado_em || 0) - new Date(a.criado_em || 0);
    });

    return res.json(estacoes);
  } catch (error) {
    console.error("Erro ao listar estações:", error);

    return res.status(500).json({
      erro: "Erro ao listar estações locais."
    });
  }
}

async function criarEstacao(req, res) {
  try {
    const {
      nome,
      local_id,
      modelo,
      descricao
    } = req.body;

    if (!nome || !local_id) {
      return res.status(400).json({
        erro: "Nome da estação e local vinculado são obrigatórios."
      });
    }

    const localDoc = await db
      .collection("locais_monitorados")
      .doc(local_id)
      .get();

    if (!localDoc.exists) {
      return res.status(404).json({
        erro: "Local monitorado não encontrado."
      });
    }

    const local = localDoc.data();

    if (local.usuario_id !== req.usuario.uid) {
      return res.status(403).json({
        erro: "Você não tem permissão para vincular esta estação a este local."
      });
    }

    const novaEstacao = {
      nome,
      local_id,
      usuario_id: req.usuario.uid,
      modelo: modelo || "ESP32 + Sensor",
      descricao: descricao || "",
      station_key: gerarChaveEstacao(),
      ativa: true,
      ultima_leitura_em: null,
      ultima_temperatura: null,
      ultima_umidade: null,
      ultima_pressao: null,
      ultima_vento_velocidade: null,
      ultima_vento_direcao: null,
      ultima_precipitacao: null,
      criado_em: new Date()
    };

    const docRef = await db
      .collection("estacoes_locais")
      .add(novaEstacao);

    return res.status(201).json({
      id: docRef.id,
      ...novaEstacao,
      criado_em: novaEstacao.criado_em.toISOString()
    });
  } catch (error) {
    console.error("Erro ao criar estação:", error);

    return res.status(500).json({
      erro: "Erro ao criar estação local."
    });
  }
}

async function alternarStatusEstacao(req, res) {
  try {
    const { id } = req.params;

    const estacaoRef = db.collection("estacoes_locais").doc(id);
    const estacaoDoc = await estacaoRef.get();

    if (!estacaoDoc.exists) {
      return res.status(404).json({
        erro: "Estação local não encontrada."
      });
    }

    const estacao = estacaoDoc.data();

    if (estacao.usuario_id !== req.usuario.uid) {
      return res.status(403).json({
        erro: "Você não tem permissão para alterar esta estação."
      });
    }

    await estacaoRef.update({
      ativa: !estacao.ativa
    });

    return res.json({
      mensagem: "Status da estação atualizado com sucesso.",
      ativa: !estacao.ativa
    });
  } catch (error) {
    console.error("Erro ao alterar status da estação:", error);

    return res.status(500).json({
      erro: "Erro ao alterar status da estação."
    });
  }
}

async function deletarEstacao(req, res) {
  try {
    const { id } = req.params;

    const estacaoRef = db.collection("estacoes_locais").doc(id);
    const estacaoDoc = await estacaoRef.get();

    if (!estacaoDoc.exists) {
      return res.status(404).json({
        erro: "Estação local não encontrada."
      });
    }

    const estacao = estacaoDoc.data();

    if (estacao.usuario_id !== req.usuario.uid) {
      return res.status(403).json({
        erro: "Você não tem permissão para excluir esta estação."
      });
    }

    await estacaoRef.delete();

    return res.json({
      mensagem: "Estação local excluída com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir estação:", error);

    return res.status(500).json({
      erro: "Erro ao excluir estação local."
    });
  }
}

async function receberDadosEstacao(req, res) {
  try {
    const {
      station_key,
      temperatura,
      umidade,
      pressao,
      vento_velocidade,
      vento_direcao,
      precipitacao,
      nebulosidade,
      visibilidade
    } = req.body;

    if (!station_key) {
      return res.status(400).json({
        erro: "A chave da estação é obrigatória."
      });
    }

    const snapshot = await db
      .collection("estacoes_locais")
      .where("station_key", "==", station_key)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        erro: "Chave da estação inválida."
      });
    }

    const estacaoDoc = snapshot.docs[0];
    const estacao = estacaoDoc.data();

    if (!estacao.ativa) {
      return res.status(403).json({
        erro: "Esta estação está inativa."
      });
    }

    const novoRegistro = {
      local_id: estacao.local_id,
      estacao_id: estacaoDoc.id,
      usuario_id: estacao.usuario_id,
      data_hora: new Date(),
      temperatura: Number(temperatura || 0),
      umidade: Number(umidade || 0),
      pressao: Number(pressao || 0),
      vento_velocidade: Number(vento_velocidade || 0),
      vento_direcao: Number(vento_direcao || 0),
      precipitacao: Number(precipitacao || 0),
      nebulosidade: Number(nebulosidade || 0),
      visibilidade: Number(visibilidade || 0),
      origem: "estacao_local",
      observacao: `Registro recebido da estação ${estacao.nome}.`,
      criado_em: new Date()
    };

    const registroRef = await db
      .collection("registros_meteorologicos")
      .add(novoRegistro);

    await db
      .collection("estacoes_locais")
      .doc(estacaoDoc.id)
      .update({
        ultima_leitura_em: new Date(),
        ultima_temperatura: Number(temperatura || 0),
        ultima_umidade: Number(umidade || 0),
        ultima_pressao: Number(pressao || 0),
        ultima_vento_velocidade: Number(vento_velocidade || 0),
        ultima_vento_direcao: Number(vento_direcao || 0),
        ultima_precipitacao: Number(precipitacao || 0)
      });

    return res.status(201).json({
      mensagem: "Dados da estação recebidos e salvos com sucesso.",
      registro_id: registroRef.id,
      estacao_id: estacaoDoc.id
    });
  } catch (error) {
    console.error("Erro ao receber dados da estação:", error);

    return res.status(500).json({
      erro: "Erro ao receber dados da estação local."
    });
  }
}

module.exports = {
  listarEstacoes,
  criarEstacao,
  alternarStatusEstacao,
  deletarEstacao,
  receberDadosEstacao
};