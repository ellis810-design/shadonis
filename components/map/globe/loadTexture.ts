import type * as THREE from "three";
import { Platform } from "react-native";

export async function loadRemoteTexture(
  THREE: typeof import("three"),
  uri: string
): Promise<InstanceType<typeof THREE.Texture>> {
  if (Platform.OS === "web") {
    const loader = new THREE.TextureLoader();
    return new Promise((resolve, reject) => {
      loader.load(uri, resolve, undefined, reject);
    });
  }

  const { Asset } = await import("expo-asset");
  const { loadTextureAsync } = await import("expo-three");
  const asset = Asset.fromURI(uri);
  await asset.downloadAsync();
  return loadTextureAsync({ asset });
}
