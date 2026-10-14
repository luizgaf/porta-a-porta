@echo off
rem Versão para Windows (cmd ou PowerShell) do adb/tunnel.sh.
rem Redireciona as portas 8081 (Expo) e 3000 (API) do celular Android para este computador.
rem Uso: adb\tunnel.cmd [setup^|status^|clear]

set ACAO=%1
if "%ACAO%"=="" set ACAO=setup

if /I "%ACAO%"=="setup" (
  echo Criando tuneis adb reverse para as portas 8081 e 3000...
  adb reverse tcp:8081 tcp:8081 || exit /b 1
  adb reverse tcp:3000 tcp:3000 || exit /b 1
  echo Pronto. O aparelho acessa o Expo em 127.0.0.1:8081 e a API em http://127.0.0.1:3000
  exit /b 0
)
if /I "%ACAO%"=="status" (
  adb reverse --list
  exit /b 0
)
if /I "%ACAO%"=="clear" (
  adb reverse --remove-all
  exit /b 0
)
echo Uso: adb\tunnel.cmd [setup^|status^|clear]
exit /b 1
