const express = require("express");
const cors = require("cors");
require("dotenv").config();

const locaisRoutes = require("./routes/locaisRoutes");
const registrosRoutes = require("./routes/registrosRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const relatoriosRoutes = require("./routes/relatoriosRoutes");
const statusRoutes = require("./routes/statusRoutes");
const estacoesRoutes = require("./routes/estacoesRoutes");

const autenticarUsuario = require("./middlewares/authMiddleware");
const { iniciarColetaAutomatica } = require("./jobs/coletaAutomatica");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "API MeteoTrack funcionando!"
  });
});

// Rota pública: busca clima/cidade, não precisa login
app.use("/api/weather", weatherRoutes);

// Rotas protegidas: precisam do token do Firebase
app.use("/api/locais", autenticarUsuario, locaisRoutes);
app.use("/api/registros", autenticarUsuario, registrosRoutes);
app.use("/api/relatorios", autenticarUsuario, relatoriosRoutes);
app.use("/api/status", autenticarUsuario, statusRoutes);

// Estações: /dados fica pública dentro da própria rota, o resto é protegido lá
app.use("/api/estacoes", estacoesRoutes);

iniciarColetaAutomatica();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});