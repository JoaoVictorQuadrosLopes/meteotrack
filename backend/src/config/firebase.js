const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const keyPath = path.join(__dirname, "firebaseKey.json");

  if (!fs.existsSync(keyPath)) {
    throw new Error(
      "Firebase key não encontrada. Configure FIREBASE_SERVICE_ACCOUNT ou adicione firebaseKey.json localmente."
    );
  }

  serviceAccount = require("./firebaseKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;