const express = require("express");
const autenticarUsuario = require("../middlewares/authMiddleware");

const {
  listarEstacoes,
  criarEstacao,
  alternarStatusEstacao,
  deletarEstacao,
  receberDadosEstacao
} = require("../controllers/estacoesController");

const router = express.Router();

router.post("/dados", receberDadosEstacao);

router.use(autenticarUsuario);

router.get("/", listarEstacoes);
router.post("/", criarEstacao);
router.patch("/:id/status", alternarStatusEstacao);
router.delete("/:id", deletarEstacao);

module.exports = router;