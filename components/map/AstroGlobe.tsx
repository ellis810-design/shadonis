import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type LayoutChangeEvent,
} from "react-native";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import { Renderer } from "expo-three";
import * as THREE from "three";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { PlanetaryLine, Planet, GlobeCity } from "../../types";
import { COLORS } from "../../constants/theme";
import { PLANETS } from "../../constants/planets";
import { useMapStore } from "../../stores/mapStore";
import { latLngToVector3 } from "./globe/globeMath";
import { planetaryLinesToGlobeSegments, samePlanetarySegment } from "./globe/lineAdapters";
import { loadRemoteTexture } from "./globe/loadTexture";
import { EARTH_BLUE_MARBLE_URL, EARTH_TOPOLOGY_URL } from "./globe/urls";

const LINE_RADIUS = 1.008;
const ATMOSPHERE_RADIUS = 1.015;
const CAMERA_Z_MIN = 1.5;
const CAMERA_Z_MAX = 5;
const AUTO_ROTATE = 0.0006;
const DAMPING = 0.96;
const ROT_X_CLAMP = 1.2;

const ATMOSPHERE_VERT = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ATMOSPHERE_FRAG = `
varying vec3 vNormal;
void main() {
  float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
  gl_FragColor = vec4(0.3, 0.5, 1.0, 1.0) * intensity * 0.8;
}
`;

export interface AstroGlobeProps {
  planetaryLines: PlanetaryLine[];
  cities?: GlobeCity[];
  searchedCity?: { name: string; lat: number; lng: number } | null;
  selectedLine?: PlanetaryLine | null;
  onLineSelect?: (line: PlanetaryLine | null) => void;
}

function buildLineMeshes(
  THREE: typeof import("three"),
  segments: ReturnType<typeof planetaryLinesToGlobeSegments>
): THREE.Line[] {
  const meshes: THREE.Line[] = [];
  for (const seg of segments) {
    const pts = seg.coords.map(([lat, lng]) =>
      latLngToVector3(THREE, lat, lng, LINE_RADIUS)
    );
    if (pts.length < 2) continue;
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    let line: THREE.Line;
    if (seg.style === "dashed") {
      const mat = new THREE.LineDashedMaterial({
        color: seg.color,
        dashSize: 0.03,
        gapSize: 0.015,
        transparent: true,
        opacity: 1,
      });
      line = new THREE.Line(geom, mat);
      line.computeLineDistances();
    } else {
      const mat = new THREE.LineBasicMaterial({
        color: seg.color,
        transparent: true,
        opacity: 1,
      });
      line = new THREE.Line(geom, mat);
    }
    line.userData.planetaryLine = seg.planetaryLine;
    line.userData.planet = seg.planetaryLine.planet;
    meshes.push(line);
  }
  return meshes;
}

function buildCityDots(
  THREE: typeof import("three"),
  cities: GlobeCity[]
): { mesh: THREE.Mesh; tier: 1 | 2 | 3 }[] {
  return cities.map((c) => {
    const geo = new THREE.SphereGeometry(0.014, 10, 10);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf5f0e8,
      transparent: true,
      opacity: 0.92,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const p = latLngToVector3(THREE, c.lat, c.lng, 1.02);
    mesh.position.copy(p);
    mesh.userData.city = c;
    return { mesh, tier: c.tier };
  });
}

export default function AstroGlobe({
  planetaryLines,
  cities = [],
  searchedCity,
  selectedLine,
  onLineSelect,
}: AstroGlobeProps) {
  const layoutRef = useRef({ width: 1, height: 1 });
  const [glReady, setGlReady] = useState(false);
  const [legendPlanets, setLegendPlanets] = useState<Planet[]>([]);

  const togglePlanet = useMapStore((s) => s.togglePlanet);
  const visiblePlanets = useMapStore((s) => s.visiblePlanets);

  const globeSegments = useMemo(
    () => planetaryLinesToGlobeSegments(planetaryLines),
    [planetaryLines]
  );

  useEffect(() => {
    const set = new Set<Planet>();
    for (const l of planetaryLines) set.add(l.planet);
    setLegendPlanets(Array.from(set));
  }, [planetaryLines]);

  const mergedCities = useMemo(() => {
    const list = [...cities];
    if (searchedCity) {
      const dup = list.some(
        (c) =>
          c.name === searchedCity.name &&
          Math.abs(c.lat - searchedCity.lat) < 0.01 &&
          Math.abs(c.lng - searchedCity.lng) < 0.01
      );
      if (!dup) {
        list.push({
          name: searchedCity.name,
          lat: searchedCity.lat,
          lng: searchedCity.lng,
          tier: 1,
        });
      }
    }
    return list;
  }, [cities, searchedCity]);

  const ctxRef = useRef<{
    renderer: Renderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    globeGroup: THREE.Group;
    lineMeshes: THREE.Line[];
    cityEntries: { mesh: THREE.Mesh; tier: 1 | 2 | 3 }[];
    raycaster: THREE.Raycaster;
    raf: number;
  } | null>(null);

  const velocityRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const cameraZRef = useRef(2.8);
  const pinchStartZRef = useRef(2.8);
  const lastPanRef = useRef({ x: 0, y: 0 });

  const updateLineOpacity = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    for (const line of ctx.lineMeshes) {
      const pl = line.userData.planetaryLine as PlanetaryLine;
      const mat = line.material as THREE.LineBasicMaterial | THREE.LineDashedMaterial;
      if (!selectedLine) {
        mat.opacity = 1;
      } else if (samePlanetarySegment(selectedLine, pl)) {
        mat.opacity = 1;
      } else {
        mat.opacity = 0.12;
      }
      mat.transparent = true;
    }
  }, [selectedLine]);

  useEffect(() => {
    updateLineOpacity();
  }, [updateLineOpacity]);

  useEffect(() => {
    if (!glReady) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    for (const lm of ctx.lineMeshes) {
      ctx.globeGroup.remove(lm);
      lm.geometry.dispose();
      (lm.material as THREE.Material).dispose();
    }
    const next = buildLineMeshes(THREE, globeSegments);
    for (const lm of next) ctx.globeGroup.add(lm);
    ctx.lineMeshes = next;
    updateLineOpacity();
  }, [glReady, globeSegments, updateLineOpacity]);

  useEffect(() => {
    if (!glReady) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    for (const { mesh } of ctx.cityEntries) {
      ctx.globeGroup.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    const entries = buildCityDots(THREE, mergedCities);
    for (const { mesh } of entries) ctx.globeGroup.add(mesh);
    ctx.cityEntries = entries;
  }, [glReady, mergedCities]);

  const handlePick = useCallback(
    (nx: number, ny: number) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const { width, height } = layoutRef.current;
      if (width < 2 || height < 2) return;
      const ndcX = (nx / width) * 2 - 1;
      const ndcY = -(ny / height) * 2 + 1;
      ctx.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), ctx.camera);
      ctx.raycaster.params.Line = { threshold: 0.03 };
      const hits = ctx.raycaster.intersectObjects(ctx.lineMeshes, false);
      if (hits.length > 0) {
        const pl = hits[0].object.userData.planetaryLine as PlanetaryLine;
        onLineSelect?.(pl);
      } else {
        onLineSelect?.(null);
      }
    },
    [onLineSelect]
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    layoutRef.current = { width, height };
    const ctx = ctxRef.current;
    if (ctx && width > 0 && height > 0) {
      ctx.camera.aspect = width / height;
      ctx.camera.updateProjectionMatrix();
      ctx.renderer.setSize(width, height);
    }
  }, []);

  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      const { drawingBufferWidth: w, drawingBufferHeight: h } = gl;
      layoutRef.current = {
        width: layoutRef.current.width > 1 ? layoutRef.current.width : w,
        height: layoutRef.current.height > 1 ? layoutRef.current.height : h,
      };

      const renderer = new Renderer({ gl });
      renderer.setSize(w, h);
      renderer.setClearColor(new THREE.Color(COLORS.globeBackground));

      const scene = new THREE.Scene();
      const aspect = w / Math.max(h, 1);
      const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
      camera.position.z = cameraZRef.current;

      scene.add(new THREE.AmbientLight(0x556688, 0.5));
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(5, 2, 5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x334466, 0.3);
      fill.position.set(-3, -1, -3);
      scene.add(fill);

      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      let earth: THREE.Mesh | null = null;
      try {
        const [mapTex, bumpTex] = await Promise.all([
          loadRemoteTexture(THREE, EARTH_BLUE_MARBLE_URL),
          loadRemoteTexture(THREE, EARTH_TOPOLOGY_URL),
        ]);
        mapTex.colorSpace = THREE.SRGBColorSpace;
        bumpTex.wrapS = THREE.RepeatWrapping;
        bumpTex.wrapT = THREE.RepeatWrapping;
        const earthGeo = new THREE.SphereGeometry(1, 96, 96);
        const earthMat = new THREE.MeshPhongMaterial({
          map: mapTex,
          bumpMap: bumpTex,
          bumpScale: 0.05,
          specular: new THREE.Color(0x333333),
          shininess: 5,
        });
        earth = new THREE.Mesh(earthGeo, earthMat);
        globeGroup.add(earth);
      } catch {
        const earthGeo = new THREE.SphereGeometry(1, 64, 64);
        const earthMat = new THREE.MeshPhongMaterial({ color: 0x2244aa });
        earth = new THREE.Mesh(earthGeo, earthMat);
        globeGroup.add(earth);
      }

      const atmoGeo = new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 64, 64);
      const atmoMat = new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERT,
        fragmentShader: ATMOSPHERE_FRAG,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      });
      globeGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

      const raycaster = new THREE.Raycaster();

      ctxRef.current = {
        renderer,
        scene,
        camera,
        globeGroup,
        lineMeshes: [],
        cityEntries: [],
        raycaster,
        raf: 0,
      };

      setGlReady(true);

      const tick = () => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        ctx.raf = requestAnimationFrame(tick);

        velocityRef.current.x *= DAMPING;
        velocityRef.current.y *= DAMPING;

        const speed = Math.hypot(velocityRef.current.x, velocityRef.current.y);
        if (speed < 0.00015) {
          rotationRef.current.y += AUTO_ROTATE;
        } else {
          rotationRef.current.y += velocityRef.current.y;
          rotationRef.current.x += velocityRef.current.x;
        }
        rotationRef.current.x = Math.max(
          -ROT_X_CLAMP,
          Math.min(ROT_X_CLAMP, rotationRef.current.x)
        );
        ctx.globeGroup.rotation.set(rotationRef.current.x, rotationRef.current.y, 0);

        ctx.camera.position.z = cameraZRef.current;

        const z = ctx.camera.position.z;
        for (const { mesh, tier } of ctx.cityEntries) {
          mesh.visible =
            tier === 1 || (tier === 2 && z < 2.5) || (tier === 3 && z < 2.0);
          const t = (z - CAMERA_Z_MIN) / (CAMERA_Z_MAX - CAMERA_Z_MIN);
          const s = THREE.MathUtils.lerp(0.22, 0.35, THREE.MathUtils.clamp(t, 0, 1));
          mesh.scale.setScalar(s);
        }

        ctx.renderer.render(ctx.scene, ctx.camera);
        gl.endFrameEXP();
      };

      tick();
    },
    []
  );

  useEffect(() => {
    return () => {
      const ctx = ctxRef.current;
      if (ctx) {
        cancelAnimationFrame(ctx.raf);
        for (const line of ctx.lineMeshes) {
          ctx.globeGroup.remove(line);
          line.geometry.dispose();
          (line.material as THREE.Material).dispose();
        }
        for (const { mesh } of ctx.cityEntries) {
          ctx.globeGroup.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
        }
        ctx.renderer.dispose();
        ctxRef.current = null;
      }
      setGlReady(false);
    };
  }, []);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      lastPanRef.current = { x: 0, y: 0 };
    })
    .onUpdate((e) => {
      const dx = e.translationX - lastPanRef.current.x;
      const dy = e.translationY - lastPanRef.current.y;
      lastPanRef.current = { x: e.translationX, y: e.translationY };
      velocityRef.current.y -= dx * 0.004;
      velocityRef.current.x += dy * 0.004;
    })
    .onEnd((e) => {
      if (Math.hypot(e.translationX, e.translationY) < 14) {
        handlePick(e.x, e.y);
      }
    });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      pinchStartZRef.current = cameraZRef.current;
    })
    .onUpdate((e) => {
      const next = pinchStartZRef.current / e.scale;
      cameraZRef.current = Math.max(CAMERA_Z_MIN, Math.min(CAMERA_Z_MAX, next));
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  return (
    <View style={styles.root} onLayout={onLayout}>
      <GestureDetector gesture={composed}>
        <GLView style={styles.gl} onContextCreate={onContextCreate} />
      </GestureDetector>

      <View style={styles.legend} pointerEvents="box-none">
        <Text style={styles.legendTitle}>Planets</Text>
        {legendPlanets.map((planet) => {
          const meta = PLANETS[planet];
          const on = visiblePlanets.has(planet);
          return (
            <TouchableOpacity
              key={planet}
              style={[styles.legendRow, !on && styles.legendRowOff]}
              onPress={() => togglePlanet(planet)}
            >
              <View style={[styles.legendDot, { backgroundColor: meta.color }]} />
              <Text style={[styles.legendLabel, !on && styles.legendLabelOff]}>
                {meta.displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.globeBackground },
  gl: { flex: 1 },
  legend: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: COLORS.globeCardSurface,
    borderWidth: 1,
    borderColor: COLORS.globeCardBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    maxWidth: 160,
    gap: 6,
  },
  legendTitle: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  legendRowOff: { opacity: 0.45 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: COLORS.cream, fontSize: 13, fontWeight: "500" },
  legendLabelOff: { color: COLORS.creamMuted },
});
