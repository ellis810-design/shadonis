// Web shim for react-native-maps
import React from "react";
import { View } from "react-native";

const MapView = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});
MapView.displayName = "MapView";

export const Marker = (props) => null;
export const Polyline = (props) => null;
export const PROVIDER_GOOGLE = "google";

export default MapView;
