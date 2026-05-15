const express = require("express");

const {
  listarLocais,
  criarLocal,
  deletarLocal,
  buscarLocalPorId
} = require("../controllers/locaisController");

const router = express.Router();

router.get("/", listarLocais);
router.post("/", criarLocal);
router.delete("/:id", deletarLocal);
router.get("/:id", buscarLocalPorId);

module.exports = router;