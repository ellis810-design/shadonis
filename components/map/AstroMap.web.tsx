import React, { useEffect, useCallback, useRef, useState } from "react";
import { View, ActivityIndicator, Text, TouchableOpacity, ScrollView } from "react-native";
import { X } from "lucide-react-native";
import { useMapStore } from "../../stores/mapStore";
import { useUserStore } from "../../stores/userStore";
import { getPlanetaryLines } from "../../services/astrology";
import { PLANETS, ANGLES } from "../../constants/planets";
import { STATIC_INTERPRETATIONS } from "../../constants/interpretations";
import { COLORS } from "../../constants/theme";
import { PlanetaryLine } from "../../types";

let L: typeof import("leaflet") | null = null;
let leafletLoaded = false;

function loadLeaflet(): Promise<void> {
  if (leafletLoaded && L) return Promise.resolve();
  if (typeof document === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if ((window as any).L) {
      L = (window as any).L;
      leafletLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      L = (window as any).L;
      leafletLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

function LineInfoPanel({ line, onClose }: { line: PlanetaryLine; onClose: () => void }) {
  const planet = PLANETS[line.planet];
  const angle = ANGLES[line.angle];
  const interpretation = STATIC_INTERPRETATIONS.find(
    (i) => i.planet === line.planet && i.angle === line.angle
  );

  return (
    <View style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 32, maxHeight: "55%", zIndex: 1000,
    }}>
      <View style={{ width: 40, height: 4, backgroundColor: "#B8B2A830", borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: `${line.color}20` }}>
            <Text style={{ color: line.color, fontSize: 20 }}>{planet.glyph}</Text>
          </View>
          <View>
            <Text style={{ color: COLORS.cream, fontWeight: "bold", fontSize: 18 }}>
              {planet.displayName} {angle.displayName}
            </Text>
            {interpretation && (
              <Text style={{ color: COLORS.gold, fontSize: 12 }}>{interpretation.shortTheme}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surfaceLight, alignItems: "center", justifyContent: "center" }}>
          <X color={COLORS.creamMuted} size={16} />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {interpretation ? (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ color: COLORS.gold, fontWeight: "600", fontSize: 13, marginBottom: 4 }}>What it feels like</Text>
              <Text style={{ color: COLORS.cream, fontSize: 13, lineHeight: 20 }}>{interpretation.whatItFeelsLike}</Text>
            </View>
            <View>
              <Text style={{ color: COLORS.gold, fontWeight: "600", fontSize: 13, marginBottom: 4 }}>Best for</Text>
              <Text style={{ color: COLORS.cream, fontSize: 13, lineHeight: 20 }}>{interpretation.bestUseCases}</Text>
            </View>
            <View>
              <Text style={{ color: COLORS.gold, fontWeight: "600", fontSize: 13, marginBottom: 4 }}>Watch out</Text>
              <Text style={{ color: COLORS.cream, fontSize: 13, lineHeight: 20 }}>{interpretation.watchOuts}</Text>
            </View>
          </View>
        ) : (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <Text style={{ color: COLORS.creamMuted, fontSize: 13, textAlign: "center" }}>{planet.description}</Text>
            <Text style={{ color: COLORS.creamMuted, fontSize: 11, marginTop: 8, textAlign: "center" }}>Detailed interpretation coming soon.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export function AstroMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const linesLayerRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUserStore();
  const planetaryLines = useMapStore((s) => s.planetaryLines);
  const selectedLine = useMapStore((s) => s.selectedLine);
  const searchedCity = useMapStore((s) => s.searchedCity);
  const isLoadingLines = useMapStore((s) => s.isLoadingLines);
  const visiblePlanets = useMapStore((s) => s.visiblePlanets);
  const visibleAngles = useMapStore((s) => s.visibleAngles);
  const setPlanetaryLines = useMapStore((s) => s.setPlanetaryLines);
  const setSelectedLine = useMapStore((s) => s.setSelectedLine);
  const setLoadingLines = useMapStore((s) => s.setLoadingLines);
  const getFilteredLines = useMapStore((s) => s.getFilteredLines);

  const loadLines = useCallback(async () => {
    if (!user) return;
    setError(null);
    setLoadingLines(true);
    try {
      const lines = await getPlanetaryLines(
        new Date(user.birthDate),
        user.birthTime ? new Date(`2000-01-01T${user.birthTime}`) : null,
        user.birthLat, user.birthLng, user.birthCity, user.birthCountryCode,
      );
      setPlanetaryLines(lines);
    } catch (err: any) {
      console.error("[AstroMap] Error loading lines:", err);
      setError(err?.message || "Failed to load planetary lines");
    } finally {
      setLoadingLines(false);
    }
  }, [user]);

  useEffect(() => { loadLines(); }, [loadLines]);

  // Initialize Leaflet map — uses a callback ref approach via useEffect
  // that re-runs when the div is available (after loading spinner goes away)
  useEffect(() => {
    if (isLoadingLines) return;
    if (mapInstanceRef.current) {
      // Map already created, just make sure it resizes
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
        setMapReady(true);
      }, 50);
      return;
    }

    let mounted = true;

    loadLeaflet().then(() => {
      if (!mounted || !L) return;

      const container = mapContainerRef.current;
      if (!container) return;

      // Ensure container has dimensions before creating map
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Retry after a short delay if container hasn't laid out yet
        setTimeout(() => {
          if (!mounted || mapInstanceRef.current) return;
          const retryRect = container.getBoundingClientRect();
          if (retryRect.width > 0 && retryRect.height > 0) {
            createMap(container, mounted);
          }
        }, 200);
        return;
      }

      createMap(container, mounted);
    });

    function createMap(container: HTMLDivElement, isMounted: boolean) {
      if (!L || mapInstanceRef.current) return;

      const map = L.map(container, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: true,
        attributionControl: false,
        worldCopyJump: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      linesLayerRef.current = L.layerGroup().addTo(map);
      markerLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
        if (isMounted) setMapReady(true);
      }, 100);
    }

    return () => { mounted = false; };
  }, [isLoadingLines]);

  // Draw lines on the map
  useEffect(() => {
    if (!mapReady || !L || !linesLayerRef.current) return;

    linesLayerRef.current.clearLayers();
    const filtered = getFilteredLines();

    filtered.forEach((line) => {
      if (!line.coordinates || line.coordinates.length < 2) return;

      const latLngs = line.coordinates.map((c) => [c.lat, c.lng] as [number, number]);
      const isSelected = selectedLine?.planet === line.planet && selectedLine?.angle === line.angle;

      const polyline = L!.polyline(latLngs, {
        color: isSelected ? "#FFFFFF" : line.color,
        weight: isSelected ? 4 : 2,
        opacity: 0.85,
        dashArray: line.angle === "ic" || line.angle === "dsc" ? "8 4" : undefined,
      });

      polyline.on("click", () => setSelectedLine(line));

      const planet = PLANETS[line.planet];
      if (planet) {
        polyline.bindTooltip(
          `${planet.glyph} ${planet.displayName} ${ANGLES[line.angle]?.displayName || line.angle}`,
          { sticky: true, className: "leaflet-tooltip-dark" }
        );
      }

      polyline.addTo(linesLayerRef.current);
    });
  }, [mapReady, planetaryLines, selectedLine, visiblePlanets, visibleAngles]);

  // Draw city markers
  useEffect(() => {
    if (!mapReady || !L || !markerLayerRef.current) return;
    markerLayerRef.current.clearLayers();

    if (searchedCity) {
      const icon = L.divIcon({
        html: `<div style="background:${COLORS.gold};width:12px;height:12px;border-radius:50%;border:2px solid ${COLORS.background};"></div>`,
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      L.marker([searchedCity.lat, searchedCity.lng], { icon })
        .bindTooltip(searchedCity.name, { permanent: true, direction: "top", className: "leaflet-tooltip-dark" })
        .addTo(markerLayerRef.current);

      mapInstanceRef.current?.flyTo([searchedCity.lat, searchedCity.lng], 5, { duration: 1 });
    }
  }, [mapReady, searchedCity]);

  return (
    <View style={{ flex: 1, position: "relative" }}>
      {/* Map container is ALWAYS in the DOM so Leaflet can attach to it */}
      <div
        ref={mapContainerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: COLORS.background,
        }}
      />

      {/* Loading overlay on top of map */}
      {isLoadingLines && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: COLORS.background, zIndex: 500,
        }}>
          <div style={{ textAlign: "center" }}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={{ color: COLORS.creamMuted, marginTop: 16 }}>Calculating your planetary lines...</Text>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && !isLoadingLines && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(11,13,23,0.85)", zIndex: 500,
        }}>
          <div style={{ textAlign: "center", padding: 24, maxWidth: 400 }}>
            <Text style={{ color: "#FF6B6B", fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Failed to load lines</Text>
            <Text style={{ color: COLORS.creamMuted, fontSize: 13, marginBottom: 16 }}>{error}</Text>
            <TouchableOpacity
              onPress={loadLines}
              style={{
                backgroundColor: COLORS.gold, paddingHorizontal: 24, paddingVertical: 10,
                borderRadius: 12, alignSelf: "center",
              }}
            >
              <Text style={{ color: COLORS.background, fontWeight: "bold", fontSize: 14 }}>Retry</Text>
            </TouchableOpacity>
          </div>
        </div>
      )}

      <style>{`
        .leaflet-tooltip-dark {
          background: ${COLORS.surface};
          color: ${COLORS.cream};
          border: 1px solid ${COLORS.surfaceLight};
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 8px;
        }
        .leaflet-tooltip-dark::before {
          border-top-color: ${COLORS.surface};
        }
        .leaflet-control-zoom a {
          background: ${COLORS.surface} !important;
          color: ${COLORS.cream} !important;
          border-color: ${COLORS.surfaceLight} !important;
        }
        .leaflet-control-zoom a:hover {
          background: ${COLORS.surfaceLight} !important;
        }
        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          background: ${COLORS.background} !important;
        }
      `}</style>

      {selectedLine && (
        <LineInfoPanel line={selectedLine} onClose={() => setSelectedLine(null)} />
      )}
    </View>
  );
}
