const db = require("../config/firebase");

async function listarLocais(req, res) {
  try {
    const snapshot = await db
      .collection("locais_monitorados")
      .orderBy("criado_em", "desc")
      .get();

    const locais = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json(locais);
  } catch (error) {
    console.error(error);

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

    return res.json({
      id: localDoc.id,
      ...localDoc.data()
    });
  } catch (error) {
    console.error(error);

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
      criado_em: new Date()
    };

    const docRef = await db
      .collection("locais_monitorados")
      .add(novoLocal);

    return res.status(201).json({
      id: docRef.id,
      ...novoLocal
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao criar local monitorado."
    });
  }
}

async function deletarLocal(req, res) {
  try {
    const { id } = req.params;

    await db
      .collection("locais_monitorados")
      .doc(id)
      .delete();

    return res.json({
      mensagem: "Local excluído com sucesso."
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao excluir local monitorado."
    });
  }
}

module.exports = {
  listarLocais,
  buscarLocalPorId,
  criarLocal,
  deletarLocal
};