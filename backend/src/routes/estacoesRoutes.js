const express = require("express");

const {
  listarEstacoes,
  criarEstacao,
  alternarStatusEstacao,
  deletarEstacao,
  receberDadosEstacao
} = require("../controllers/estacoesController");

const router = express.Router();

router.get("/", listarEstacoes);
router.post("/", criarEstacao);
router.patch("/:id/status", alternarStatusEstacao);
router.delete("/:id", deletarEstacao);

// Rota usada pelo ESP32/Arduino para enviar medições
router.post("/dados", receberDadosEstacao);

module.exports = router;