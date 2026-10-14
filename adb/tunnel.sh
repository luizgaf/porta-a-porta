#!/usr/bin/env bash
set -euo pipefail

# Redireciona portas do celular Android (conectado por USB) para este computador via adb reverse.
# Assim o app no aparelho acessa 127.0.0.1 como se fosse o computador:
#   8081 -> servidor do Expo (Metro), usado pelo npm run start:local
#   3000 -> API do back-end
#
# Uso:
#   ./adb/tunnel.sh            # cria os túneis
#   ./adb/tunnel.sh status     # mostra os túneis ativos
#   ./adb/tunnel.sh clear      # remove os túneis

PORTAS=(8081 3000)

case "${1:-setup}" in
  setup)
    for porta in "${PORTAS[@]}"; do
      echo "Criando túnel adb reverse para a porta ${porta}..."
      adb reverse "tcp:${porta}" "tcp:${porta}"
    done
    echo "Pronto. O aparelho acessa o Expo em 127.0.0.1:8081 e a API em http://127.0.0.1:3000"
    ;;
  status)
    echo "Túneis adb reverse ativos:"
    adb reverse --list
    ;;
  clear)
    echo "Removendo os túneis adb reverse..."
    adb reverse --remove-all
    ;;
  *)
    echo "Uso: $0 {setup|status|clear}"
    exit 1
    ;;
esac
