const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const morgane = require("morgan");

const app = express();
const port = 3001;

// Middleware pour traiter le corps des requêtes JSON
app.use(bodyParser.json());
app.use(morgane("dev"));
app.use(
  cors({
    origin: ["http://localhost:3000", "https://www-ilimihikepass.onrender.com"],
    credentials: true,
  })
);

// Point de terminaison pour la vérification du code
app.post("/verification", (req, res) => {
  const { code } = req.body;

  // Charger le fichier CSV
  fs.readFile("./final_tokens.csv", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Erreur de lecture du fichier CSV." });
    }

    const lines = data.split("\n").slice(0);

    // Parser le fichier CSV en excluant la première colonne (colonne d'indices)
    const codes = lines.map((line) => {
      const [indices, Numero, Token, Valide] = line.split(",");
      return { indices, Numero, Token, Valide };
    });
    // Recherche du code dans le fichier CSV
    const codeInfo = codes.find((row) => row.Token === code);
    // console.log(codes);

    if (codeInfo && codeInfo.Valide === `False\r`) {
      return res
        .status(401)
        .json({ error: "Ce code a deja ete utilise. Accès refusé." });
    }

    if (codeInfo && codeInfo.Valide === `True\r`) {
      // Mettre à jour l'attribut 'Valide' à false
      codeInfo.Valide = `False\r`;

      // Écrire les modifications dans le fichier CSV
      const updatedCodes = codes
        .map((row) => `${row.indices},${row.Numero},${row.Token},${row.Valide}`)
        .join("\n");
      fs.writeFile("./final_tokens.csv", updatedCodes, (err) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ error: "Erreur d'écriture du fichier CSV." });
        }

        // Notifier que le code est valide
        res.json({ message: "Code valide. Accès accordé." });
      });
    } else {
      // Notifier que le code est invalide
      res.status(401).json({ error: "Code invalide", codes });
    }
  });
});

app.get("/", (req, res) => {
  return res.status(200).json("success");
});

// Démarrer le serveur sur le port spécifié
app.listen(port, () => {
  console.log(`Serveur backend démarré sur le port ${port}`);
});
