import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
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
import { PALETTE } from "../../constants/designSystem";
import { useMapStore } from "../../stores/mapStore";
import { latLngToVector3 } from "./globe/globeMath";
import { planetaryLinesToGlobeSegments, samePlanetarySegment } from "./globe/lineAdapters";
import { loadRemoteTexture } from "./globe/loadTexture";
import { EARTH_BLUE_MARBLE_URL, EARTH_TOPOLOGY_URL } from "./globe/urls";

/** Slightly above Earth surface so lines read clearly over the globe texture. */
const LINE_RADIUS = 1.018;
const ATMOSPHERE_RADIUS = 1.015;
const CAMERA_Z_MIN = 1.5;
const CAMERA_Z_MAX = 5;
const AUTO_ROTATE = 0.00025;
/** Drag-to-spin sensitivity. Lower = calmer. */
const PAN_SENSITIVITY = 0.0014;
const DAMPING = 0.96;
const ROT_X_CLAMP = 1.2;
/** How much each tap of the +/− zoom button moves the camera. */
const ZOOM_BUTTON_STEP = 0.35;

/* ------------------------- Label sprite helper ------------------------- */

/**
 * Build a small text sprite (web-only — uses a 2D canvas to render the
 * glyphs into a CanvasTexture, which Three then samples on a Sprite).
 * Returns null on platforms where `document` isn't available, so callers
 * can skip the label gracefully.
 */
function makeTextSprite(
  THREE: typeof import("three"),
  text: string,
  color: string,
  scale: { w: number; h: number } = { w: 0.18, h: 0.045 },
): import("three").Sprite | null {
  if (typeof document === "undefined") return null;

  // Pass "glyph\nCODE" to render two stacked lines (used for planet
  // line labels: ☉ on top, MC under). Single line otherwise.
  const lines = text.split("\n");
  const isStacked = lines.length > 1;

  const dpr = 2;
  const canvas = document.createElement("canvas");
  canvas.width = 256 * dpr;
  canvas.height = (isStacked ? 110 : 64) * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(0,0,0,0.85)";

  if (isStacked) {
    // Top: planet glyph (a touch larger so the unicode symbol reads at
    // a similar visual weight as the angle code below it).
    ctx.font = '600 36px "Inter", "Apple Symbols", "Segoe UI Symbol", system-ui, sans-serif';
    ctx.strokeText(lines[0], 128, 30);
    ctx.fillStyle = color;
    ctx.fillText(lines[0], 128, 30);

    // Bottom: angle code
    ctx.font = '700 24px "Inter", system-ui, sans-serif';
    ctx.strokeText(lines[1], 128, 78);
    ctx.fillStyle = color;
    ctx.fillText(lines[1], 128, 78);
  } else {
    ctx.font = '600 26px "Inter", system-ui, sans-serif';
    ctx.strokeText(text, 128, 32);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  // Stacked labels are roughly 1.7× taller than single-line ones; the
  // canvas height ratio above is 110/64 ≈ 1.72.
  const finalH = isStacked ? scale.h * 1.7 : scale.h;
  sprite.scale.set(scale.w, finalH, 1);
  sprite.renderOrder = 2;
  return sprite;
}

// Atmosphere is now a plain back-faced MeshBasicMaterial (see below).
// The previous custom ShaderMaterial caused intermittent shader-compile
// failures inside Three's getUniforms on web.

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
        transparent: false,
        opacity: 1,
        depthTest: true,
        depthWrite: true,
      });
      line = new THREE.Line(geom, mat);
      line.computeLineDistances();
    } else {
      const mat = new THREE.LineBasicMaterial({
        color: seg.color,
        transparent: false,
        opacity: 1,
        depthTest: true,
        depthWrite: true,
      });
      line = new THREE.Line(geom, mat);
    }
    line.userData.planetaryLine = seg.planetaryLine;
    line.userData.planet = seg.planetaryLine.planet;
    // Render *after* the opaque earth so the depth buffer is populated
    // when the lines draw — back-of-globe segments get correctly hidden.
    line.renderOrder = 1;

    // Tag the line with the planet's glyph stacked above its angle code
    // (e.g. ☉ over MC). Sprite is a child of the line so it inherits
    // the line's visibility toggling and depth-test occlusion.
    const planetMeta = PLANETS[seg.planetaryLine.planet];
    const planetGlyph = planetMeta?.glyph ?? "";
    const angleLabel = seg.planetaryLine.angle.toUpperCase();
    const colorHex = "#" + seg.color.toString(16).padStart(6, "0");
    const labelSprite = makeTextSprite(
      THREE,
      `${planetGlyph}\n${angleLabel}`,
      colorHex,
    );
    if (labelSprite) {
      const mid = pts[Math.floor(pts.length / 2)];
      // Push the label slightly off the surface so it sits above the line.
      const out = mid.clone().normalize().multiplyScalar(LINE_RADIUS + 0.035);
      labelSprite.position.copy(out);
      line.add(labelSprite);
    }

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

    // Major cities (tier 1) get a small text label so users can see
    // where the lines cross. Tier 2/3 stay unlabeled to keep clutter
    // down at low zoom levels — they're already small.
    if (c.tier === 1) {
      const label = makeTextSprite(THREE, c.name, "#F5F0E8", {
        w: 0.22,
        h: 0.055,
      });
      if (label) {
        // Local offset along the surface normal so the label sits
        // just outside the dot, away from globe center.
        const out = mesh.position.clone().normalize().multiplyScalar(0.05);
        label.position.copy(out);
        mesh.add(label);
      }
    }

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

  // Hold the GLView render until the parent has a stable, non-zero layout.
  // Without this, expo-gl creates the WebGL drawing buffer at the initial
  // (sometimes 0×0 or layout-default) size and can never grow it again,
  // which is what made the globe render as a tiny tile in the corner.
  const [stableLayout, setStableLayout] = useState<{ w: number; h: number } | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const globeSegments = useMemo(
    () => planetaryLinesToGlobeSegments(planetaryLines),
    [planetaryLines]
  );

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

      if (!selectedLine || samePlanetarySegment(selectedLine, pl)) {
        // Active state — fully opaque, depth-tested so the back of the
        // globe occludes lines on the far side.
        mat.opacity = 1;
        mat.transparent = false;
        mat.depthTest = true;
        mat.depthWrite = true;
      } else {
        // Dimmed (a different line is selected). We need transparency
        // for the 0.12 fade, but keep depth-test on so far-side
        // segments still get hidden by the globe.
        mat.opacity = 0.12;
        mat.transparent = true;
        mat.depthTest = true;
        mat.depthWrite = false;
      }
      mat.needsUpdate = true;
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

      // Hit-test threshold scales with camera distance so the lines
      // stay easy to tap regardless of zoom. At z=2.8 (default) →
      // ~0.07 world units, ~7% of the globe radius.
      const z = ctx.camera.position.z;
      ctx.raycaster.params.Line = { threshold: 0.025 * z };

      const hits = ctx.raycaster.intersectObjects(ctx.lineMeshes, false);
      if (hits.length > 0) {
        // Prefer the closest hit *to the camera* (i.e. on the visible
        // hemisphere) — Three already returns hits sorted near-to-far.
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
    if (width <= 0 || height <= 0) return;
    layoutRef.current = { width, height };

    // Resize the live renderer for fluid feedback during a drag-resize.
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.camera.aspect = width / height;
      ctx.camera.updateProjectionMatrix();
      ctx.renderer.setSize(width, height);
    }

    // Debounced remount: when the layout settles to a meaningfully new
    // size, change the GLView's key so a fresh GL context is created at
    // the correct drawing-buffer dimensions. (expo-gl can't resize the
    // backing buffer once it's allocated.)
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      const w = Math.round(width);
      const h = Math.round(height);
      setStableLayout((prev) => {
        if (!prev) return { w, h };
        if (Math.abs(prev.w - w) > 24 || Math.abs(prev.h - h) > 24) {
          return { w, h };
        }
        return prev;
      });
    }, 180);
  }, []);

  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      // expo-gl returns `null` from getShaderInfoLog / getProgramInfoLog where
      // browser WebGL returns "". Three.js 0.166+ calls `.trim()` on the
      // result, which crashes ("Cannot read properties of null (reading
      // 'trim')") on the very first WebGLProgram compile. Patch both lookups
      // to always return a string.
      const origShaderLog = gl.getShaderInfoLog?.bind(gl);
      const origProgramLog = gl.getProgramInfoLog?.bind(gl);
      if (origShaderLog) {
        (gl as any).getShaderInfoLog = (shader: WebGLShader) =>
          origShaderLog(shader) ?? "";
      }
      if (origProgramLog) {
        (gl as any).getProgramInfoLog = (program: WebGLProgram) =>
          origProgramLog(program) ?? "";
      }

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

      // Soft atmosphere — back-faced sphere with additive transparent fill.
      // (We previously used a custom ShaderMaterial here, but Three.js's
      // shader compiler choked on it across some browser/driver combos with
      // a "Cannot read properties of null (reading 'trim')" error inside
      // getUniforms. The simpler material gives an indistinguishable look.)
      const atmoGeo = new THREE.SphereGeometry(ATMOSPHERE_RADIUS * 1.04, 48, 48);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: 0x4d80ff,
        transparent: true,
        opacity: 0.10,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
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

        try {
          ctx.renderer.render(ctx.scene, ctx.camera);
          gl.endFrameEXP();
        } catch (err) {
          // Cancel the loop on a fatal render error rather than spamming the
          // error overlay every frame.
          if (ctx.raf) cancelAnimationFrame(ctx.raf);
          ctx.raf = 0;
          // eslint-disable-next-line no-console
          console.error("[AstroGlobe] render failed:", err);
        }
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
      velocityRef.current.y -= dx * PAN_SENSITIVITY;
      velocityRef.current.x += dy * PAN_SENSITIVITY;
    })
    .onEnd((e) => {
      // Treat anything under ~22px of total movement as a tap, not a drag.
      // Mobile fingers and trackpad clicks both produce small incidental
      // motion; the old 14px threshold made the picker miss on real
      // taps that wobbled slightly.
      if (Math.hypot(e.translationX, e.translationY) < 22) {
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

  const zoomBy = useCallback((delta: number) => {
    const next = cameraZRef.current + delta;
    cameraZRef.current = Math.max(CAMERA_Z_MIN, Math.min(CAMERA_Z_MAX, next));
  }, []);

  return (
    <View style={styles.root} onLayout={onLayout}>
      {/* The GLView only mounts once we have a real layout. Its key
          changes whenever the layout meaningfully changes, forcing a
          fresh GL context at the correct drawing-buffer size. */}
      {stableLayout && (
        <GestureDetector gesture={composed}>
          <GLView
            key={`gl-${stableLayout.w}x${stableLayout.h}`}
            style={styles.gl}
            onContextCreate={onContextCreate}
          />
        </GestureDetector>
      )}

      {/* Zoom controls — work the same on web (click) and touch. The
          stack is bottom-right of the globe pane, balancing the Line
          Types legend at bottom-left. */}
      <View style={styles.zoomStack} pointerEvents="box-none">
        <ZoomButton label="+" onPress={() => zoomBy(-ZOOM_BUTTON_STEP)} />
        <View style={styles.zoomDivider} />
        <ZoomButton label="−" onPress={() => zoomBy(ZOOM_BUTTON_STEP)} />
      </View>
    </View>
  );
}

interface ZoomButtonProps {
  label: string;
  onPress: () => void;
}

function ZoomButton({ label, onPress }: ZoomButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={(state: any) => [
        styles.zoomBtn,
        state.hovered && styles.zoomBtnHover,
        state.pressed && styles.zoomBtnPressed,
      ]}
    >
      <Text style={styles.zoomBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.globeBackground },
  gl: { flex: 1 },
  zoomStack: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "rgba(10,10,10,0.78)",
    borderWidth: 1,
    borderColor: PALETTE.surfaceBorder,
    borderRadius: 8,
    overflow: "hidden",
    width: 36,
  },
  zoomDivider: {
    height: 1,
    backgroundColor: PALETTE.surfaceBorder,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnHover: {
    backgroundColor: PALETTE.accentMuted,
  },
  zoomBtnPressed: {
    backgroundColor: "rgba(255,124,188,0.20)",
  },
  zoomBtnText: {
    color: PALETTE.accent,
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
    textAlign: "center",
  },
});
