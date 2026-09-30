import { Redirect } from 'expo-router';

export default function Index() {
  // Ajuste para a rota que faz sentido iniciar (ex: login)
  return <Redirect href="/(auth)" />; 
}
