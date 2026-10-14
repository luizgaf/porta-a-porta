// Inicia o Expo em 127.0.0.1 para uso com o túnel adb (adb/tunnel.sh ou adb\tunnel.cmd).
// Em Node para funcionar igual no Windows, macOS e Linux, sem depender da sintaxe do terminal.
// Argumentos extras são repassados ao Expo, ex.: npm run start:local -- --clear
const { spawn } = require('child_process');

const env = {
  ...process.env,
  // Endereço que o Metro anuncia ao app (o aparelho chega nele pelo túnel adb da porta 8081)
  REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1',
  // API acessada pelo túnel adb da porta 3000
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000/api',
};

const expo = spawn('npx', ['expo', 'start', '--localhost', '--port', '8081', ...process.argv.slice(2)], {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

expo.on('exit', (codigo) => process.exit(codigo ?? 0));
