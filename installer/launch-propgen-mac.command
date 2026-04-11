#!/bin/bash
# ============================================================
# Orpi PropGen -- Lanceur macOS
# Demarre un serveur local et ouvre l'app dans le navigateur
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
APP_DIR="$SCRIPT_DIR/app"
PORT=8491

echo "Dossier: $SCRIPT_DIR"
echo "App: $APP_DIR"

# Verifier que l'application est presente
if [ ! -f "$APP_DIR/index.html" ]; then
    echo "ERREUR: L'application n'est pas installee correctement."
    echo "Fichier manquant: $APP_DIR/index.html"
    read -p "Appuyez sur Entree pour fermer..."
    exit 1
fi

# Verifier si le port est deja utilise
if lsof -i :$PORT -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Orpi PropGen est deja lance."
    open "http://localhost:$PORT"
    exit 0
fi

# Demarrer le serveur Ruby en arriere-plan
ruby -run -e httpd "$APP_DIR" -p $PORT &
SERVER_PID=$!

# Attendre que le serveur soit pret
sleep 1

# Ouvrir dans le navigateur par defaut
open "http://localhost:$PORT"

echo "Orpi PropGen lance sur http://localhost:$PORT"
echo "Fermez cette fenetre pour arreter le serveur."

# Attendre que l'utilisateur ferme le terminal
wait $SERVER_PID 2>/dev/null
