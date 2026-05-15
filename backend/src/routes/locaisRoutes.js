const express = require("express");

const {
  listarLocais,
  buscarLocalPorId,
  criarLocal,
  atualizarLocal,
  deletarLocal
} = require("../controllers/locaisController");

const router = express.Router();

router.get("/", listarLocais);
router.get("/:id", buscarLocalPorId);
router.post("/", criarLocal);
router.put("/:id", atualizarLocal);
router.delete("/:id", deletarLocal);

module.exports = router;