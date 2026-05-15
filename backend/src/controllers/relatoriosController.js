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

async function listarRelatorios(req, res) {
  try {
    const snapshot = await db
      .collection("relatorios")
      .where("usuario_id", "==", req.usuario.uid)
      .get();

    const relatorios = snapshot.docs.map((doc) => {
      const dados = doc.data();
      const geradoEm = converterDataFirestore(dados.gerado_em);

      return {
        id: doc.id,
        ...dados,
        gerado_em: geradoEm ? geradoEm.toISOString() : null
      };
    });

    relatorios.sort((a, b) => {
      return new Date(b.gerado_em || 0) - new Date(a.gerado_em || 0);
    });

    return res.json(relatorios);
  } catch (error) {
    console.error("Erro ao listar relatórios:", error);

    return res.status(500).json({
      erro: "Erro ao listar relatórios."
    });
  }
}

async function criarRelatorio(req, res) {
  try {
    const {
      local_id,
      local_nome,
      cidade,
      estado,
      data_inicio,
      data_fim,
      quantidade_registros,
      temperatura_media,
      chuva_total,
      vento_medio,
      pressao_media
    } = req.body;

    if (!local_id || !local_nome || !data_inicio || !data_fim) {
      return res.status(400).json({
        erro: "Local, data inicial e data final são obrigatórios."
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
        erro: "Você não tem permissão para gerar relatório deste local."
      });
    }

    const novoRelatorio = {
      local_id,
      usuario_id: req.usuario.uid,
      local_nome,
      cidade: cidade || "",
      estado: estado || "",
      data_inicio,
      data_fim,
      quantidade_registros: Number(quantidade_registros || 0),
      temperatura_media: Number(temperatura_media || 0),
      chuva_total: Number(chuva_total || 0),
      vento_medio: Number(vento_medio || 0),
      pressao_media: Number(pressao_media || 0),
      gerado_em: new Date()
    };

    const docRef = await db.collection("relatorios").add(novoRelatorio);

    return res.status(201).json({
      id: docRef.id,
      ...novoRelatorio,
      gerado_em: novoRelatorio.gerado_em.toISOString()
    });
  } catch (error) {
    console.error("Erro ao salvar relatório:", error);

    return res.status(500).json({
      erro: "Erro ao salvar relatório."
    });
  }
}

async function deletarRelatorio(req, res) {
  try {
    const { id } = req.params;

    const relatorioRef = db.collection("relatorios").doc(id);
    const relatorioDoc = await relatorioRef.get();

    if (!relatorioDoc.exists) {
      return res.status(404).json({
        erro: "Relatório não encontrado."
      });
    }

    const relatorio = relatorioDoc.data();

    if (relatorio.usuario_id !== req.usuario.uid) {
      return res.status(403).json({
        erro: "Você não tem permissão para excluir este relatório."
      });
    }

    await relatorioRef.delete();

    return res.json({
      mensagem: "Relatório excluído com sucesso."
    });
  } catch (error) {
    console.error("Erro ao excluir relatório:", error);

    return res.status(500).json({
      erro: "Erro ao excluir relatório."
    });
  }
}

module.exports = {
  listarRelatorios,
  criarRelatorio,
  deletarRelatorio
};