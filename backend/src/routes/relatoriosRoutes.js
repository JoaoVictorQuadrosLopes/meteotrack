const express = require("express");

const {
  listarRelatorios,
  criarRelatorio,
  deletarRelatorio
} = require("../controllers/relatoriosController");

const router = express.Router();

router.get("/", listarRelatorios);
router.post("/", criarRelatorio);
router.delete("/:id", deletarRelatorio);

module.exports = router;