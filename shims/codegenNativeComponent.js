// Polyfill for codegenNativeComponent on web
// Native modules call this to register components, but it doesn't exist in react-native-web
import { View } from "react-native";
export default function codegenNativeComponent(name) {
  return View;
}
