import type * as THREE from "three";

export function latLngToVector3(
  THREE: typeof import("three"),
  lat: number,
  lng: number,
  radius: number
): InstanceType<typeof THREE.Vector3> {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}
