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

// Pública para ESP8266
router.post("/dados", receberDadosEstacao);

// Daqui para baixo exige login
router.use(autenticarUsuario);

router.get("/", listarEstacoes);
router.post("/", criarEstacao);
router.patch("/:id/status", alternarStatusEstacao);
router.delete("/:id", deletarEstacao);

module.exports = router;