const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const shimDir = path.resolve(__dirname, "shims");

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    if (moduleName === "react-native-maps") {
      return {
        filePath: path.resolve(shimDir, "react-native-maps.js"),
        type: "sourceFile",
      };
    }

    if (
      moduleName === "react-native/Libraries/Utilities/codegenNativeComponent" ||
      moduleName.endsWith("/codegenNativeComponent")
    ) {
      return {
        filePath: path.resolve(shimDir, "codegenNativeComponent.js"),
        type: "sourceFile",
      };
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
