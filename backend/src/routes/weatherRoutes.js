const express = require("express");

const {
  obterClimaAtual,
  obterPrevisaoHoraria,
  obterCoordenadasCidade
} = require("../controllers/weatherController");

const router = express.Router();

router.get("/atual", obterClimaAtual);
router.get("/previsao", obterPrevisaoHoraria);
router.get("/buscar-cidade", obterCoordenadasCidade);

module.exports = router;