const express = require("express");
const autenticarUsuario = require("../middlewares/authMiddleware");

const {
  listarRegistros,
  criarRegistro,
  coletarRegistroAtual,
  coletarRegistrosTodosLocais,
  deletarRegistro
} = require("../controllers/registrosController");

const router = express.Router();

router.use(autenticarUsuario);

router.get("/", listarRegistros);
router.post("/", criarRegistro);

router.post("/coletar-todos", coletarRegistrosTodosLocais);
router.post("/coletar/:localId", coletarRegistroAtual);

router.delete("/:id", deletarRegistro);

module.exports = router;