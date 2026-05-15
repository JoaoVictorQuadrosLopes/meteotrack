const express = require("express");
const cors = require("cors");
require("dotenv").config();

const locaisRoutes = require("./routes/locaisRoutes");
const registrosRoutes = require("./routes/registrosRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const estacoesRoutes = require("./routes/estacoesRoutes");
const statusRoutes = require("./routes/statusRoutes");

const { iniciarColetaAutomatica } = require("./jobs/coletaAutomatica");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "API MeteoTrack funcionando!"
  });
});

app.use("/api/locais", locaisRoutes);
app.use("/api/registros", registrosRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/estacoes", estacoesRoutes);
app.use("/api/status", statusRoutes);
iniciarColetaAutomatica();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});