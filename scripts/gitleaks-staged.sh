#!/bin/sh
# Hook pre-commit (lefthook) : recherche de secrets dans les fichiers indexés.
# Si gitleaks est installé et trouve un secret, le commit est bloqué.
# S'il n'est pas installé, on avertit sans bloquer : la CI (job gitleaks) bloque de toute façon.
if command -v gitleaks >/dev/null 2>&1; then
  exec gitleaks git --pre-commit --staged --redact --no-banner
fi
echo "gitleaks absent localement : installe-le (winget install Gitleaks.Gitleaks). La CI le vérifie de toute façon."
