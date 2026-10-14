import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

// Chama `carregarMais` quando a rolagem chega perto do fim da tela.
// Usado nas telas em que a lista fica dentro de um ScrollView (a lista não rola sozinha).
export const aoChegarPertoDoFim =
  (carregarMais: () => void, distancia = 200) =>
  ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - distancia) {
      carregarMais();
    }
  };
