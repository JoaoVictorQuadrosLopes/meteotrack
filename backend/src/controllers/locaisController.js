const db = require("../config/firebase");

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

async function listarLocais(req, res) {
  try {
    const snapshot = await db
      .collection("locais_monitorados")
      .where("usuario_id", "==", req.usuario.uid)
      .get();

    const locais = snapshot.docs.map((doc) => {
      const dados = doc.data();
      const criadoEm = converterDataFirestore(dados.criado_em);

      return {
        id: doc.id,
        ...dados,
        criado_em: criadoEm ? criadoEm.toISOString() : null
      };
    });

    locais.sort((a, b) => {
      return new Date(b.criado_em || 0) - new Date(a.criado_em || 0);
    });

    return res.json(locais);
  } catch (error) {
    console.error("Erro ao listar locais:", error);

    return res.status(500).json({
      erro: "Erro ao listar locais monitorados."
    });
  }
}

async function buscarLocalPorId(req, res) {
  try {
    const { id } = req.params;

    const localDoc = await db
      .collection("locais_monitorados")
      .doc(id)
      .get();

    if (!localDoc.exists) {
      return res.status(404).json({
        erro: "Local não encontrado."
      });
    }

    const local = localDoc.data();

    if (local.usuario_id !== req.usuario.uid) {
      return res.status(403).json({
        erro: "Você não tem permissão para acessar este local."
      });
    }

    const criadoEm = converterDataFirestore(local.criado_em);

    return res.json({
      id: localDoc.id,
      ...local,
      criado_em: criadoEm ? criadoEm.toISOString() : null
    });
  } catch (error) {
    console.error("Erro ao buscar local:", error);

    return res.status(500).json({
      erro: "Erro ao buscar local monitorado."
    });
  }
}

async function criarLocal(req, res) {
  try {
    const {
      nome,
      cidade,
      estado,
      pais,
      latitude,
      longitude,
      tipo
    } = req.body;

    if (!nome || !cidade || !latitude || !longitude) {
      return res.status(400).json({
        erro: "Nome, cidade, latitude e longitude são obrigatórios."
      });
    }

    const novoLocal = {
      nome,
      cidade,
      estado: estado || "",
      pais: pais || "Brasil",
      latitude: Number(latitude),
      longitude: Number(longitude),
      tipo: tipo || "Cidade",
      ativo: true,
      usuario_id: req.usuario.uid,
      criado_em: new Date()
    };

    const docRef = await db
      .collection("locais_monitorados")
      .add(novoLocal);

    return res.status(201).json({
      id: docRef.id,
      ...novoLocal,
      criado_em: novoLocal.criado_em.toISOString()
    });
  } catch (error) {
    console.error("Erro ao criar local:", error);

    return res.status(500).json({
      erro: "Erro ao criar local monitorado."
    });
  }
}

async function atualizarLocal(req, res) {
  try {
    const { id } = req.params;

    const {
      nome,
      cidade,
      estado,
      pais,
      latitude,
      longitude,
      tipo,
      ativo
    } = req.body;

    const localRef = db
      .collection("locais_monitorados")
      .doc(id);

    const localDoc = await localRef.get();

    if (!localDoc.exists) {
      return res.status(404).json({
        erro: "Local não encontrado."
      });
    }

    const local = localDoc.data();

    if (local.usuario_id !== req.usuario.uid) {
      return res.status(403).json({
        erro: "Você não tem permissão para atualizar este local."
      });
    }

    const dadosAtualizados = {
      nome: nome || local.nome,
      cidade: cidade || local.cidade,
      estado: estado !== undefined ? estado : local.estado || "",
      pais: pais || local.pais || "Brasil",
      latitude: latitude !== undefined ? Number(latitude) : local.latitude,
      longitude: longitude !== undefined ? Number(longitude) : local.longitude,
      tipo: tipo || local.tipo || "Cidade",
      ativo: ativo !== undefined ? Boolean(ativo) : local.ativo,
      atualizado_em: new Date()
    };

    await localRef.update(dadosAtualizados);

    return res.json({
      mensagem: "Local atualizado com sucesso.",
      id,
      ...local,
      ...dadosAtualizados,
      atualizado_em: dadosAtualizados.atualizado_em.toISOString()
    });
  } catch (error) {
    console.error("Erro ao atualizar local:", error);

    return res.status(500).json({
      erro: "Erro ao atualizar local monitorado."
    });
  }
}

async function deletarLocal(req, res) {
  try {
    const { id } = req.params;

    const localRef = db
      .collection("locais_monitorados")
      .doc(id);

    const localDoc = await localRef.get();

    if (!localDoc.exists) {
      return res.status(404).json({
        erro: "Local não encontrado."
      });
    }

    const local = localDoc.data();

    if (local.usuario_id !== req.usuario.uid) {
      return res.status(403).json({
        erro: "Você não tem permissão para excluir este local."
      });
    }

    await localRef.delete();

    return res.json({
      mensagem: "Local excluído com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir local:", error);

    return res.status(500).json({
      erro: "Erro ao excluir local monitorado."
    });
  }
}

module.exports = {
  listarLocais,
  buscarLocalPorId,
  criarLocal,
  atualizarLocal,
  deletarLocal
};