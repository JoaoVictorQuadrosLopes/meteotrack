const express = require("express");

const {
  verificarStatusSistema
} = require("../controllers/statusController");

const router = express.Router();

router.get("/", verificarStatusSistema);

module.exports = router;