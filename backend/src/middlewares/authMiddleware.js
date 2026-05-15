const admin = require("firebase-admin");
require("../config/firebase");

async function autenticarUsuario(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        erro: "Token de autenticação não informado."
      });
    }

    const token = authHeader.split(" ")[1];
    const usuario = await admin.auth().verifyIdToken(token);

    req.usuario = usuario;

    return next();
  } catch (error) {
    console.error("Erro na autenticação:", error);

    return res.status(401).json({
      erro: "Token inválido ou expirado."
    });
  }
}

module.exports = autenticarUsuario;