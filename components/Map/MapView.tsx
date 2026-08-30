"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import Link from "next/link";
import type { Center } from "@/lib/geo";
import { CATEGORY_LABELS } from "@/lib/categories";
import {
  createCategoryIcon,
  createPhotoIcon,
  createHospitalIcon,
  createUserIcon,
  createClusterIcon,
} from "@/lib/mapIcons";

import type {
  MapPoint,
  MapCluster,
  MerchantListEntry,
} from "@/lib/spatialIndex";
import type { Viewport } from "@/lib/useViewportMerchants";
import { formatDistance, distanceKm } from "@/lib/geo";

const PHOTO_ZOOM_SHOW = 14;
const PHOTO_ZOOM_HIDE = 13;

function ZoomTracker({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (e) => onZoom(e.target.getZoom()),
  });
  return null;
}

/**
 * Rapporte la vue courante au parent, qui décide quoi charger.
 *
 * `moveend` couvre le déplacement comme le zoom, et se déclenche une fois
 * l'animation terminée : on n'interroge donc pas le serveur pendant qu'une
 * inertie de trackpad est encore en cours.
 */
function ViewportWatcher({
  onViewport,
}: {
  onViewport: (v: Viewport) => void;
}) {
  const map = useMap();

  const rapporter = useCallback(() => {
    const b = map.getBounds();
    onViewport({
      west: b.getWest(),
      south: b.getSouth(),
      east: b.getEast(),
      north: b.getNorth(),
      zoom: map.getZoom(),
    });
  }, [map, onViewport]);

  useMapEvents({ moveend: rapporter });

  // Première vue : sans ça la carte resterait vide jusqu'au premier geste.
  const amorce = useRef(false);
  useEffect(() => {
    if (amorce.current) return;
    amorce.current = true;
    rapporter();
  }, [rapporter]);

  return null;
}

/**
 * Recentre la carte quand le visiteur change de point de référence.
 *
 * En mode rayon, le cadrage suit aussi le rayon pour que le cercle tienne à
 * l'écran. En mode exploration il n'y a pas de rayon : on se contente de
 * rejoindre le nouveau point, sans jamais contrarier un déplacement en cours.
 */
function Recenter({
  center,
  radiusKm,
  suivreRayon,
}: {
  center: Center;
  radiusKm: number;
  suivreRayon: boolean;
}) {
  const map = useMap();
  const first = useRef(true);

  useEffect(() => {
    if (!suivreRayon && !first.current) return;
    const bounds: [[number, number], [number, number]] = [
      [center.lat - radiusKm / 111, center.lon - radiusKm / 78],
      [center.lat + radiusKm / 111, center.lon + radiusKm / 78],
    ];
    if (first.current) {
      first.current = false;
      map.fitBounds(bounds, { padding: [24, 24] });
    } else {
      map.flyToBounds(bounds, { padding: [24, 24], duration: 0.8 });
    }
  }, [map, center.lat, center.lon, radiusKm, suivreRayon]);

  return null;
}

/** En mode exploration, rejoindre le nouveau point de référence sans toucher
 *  au zoom choisi par le visiteur. */
function RecenterLibre({ center }: { center: Center }) {
  const map = useMap();
  const premier = useRef(true);

  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    map.flyTo([center.lat, center.lon], Math.max(map.getZoom(), 12), {
      duration: 0.8,
    });
  }, [map, center.lat, center.lon]);

  return null;
}

/**
 * Emmène la carte vers un point choisi dans la liste (résultat trouvé ailleurs
 * en France). Le compteur `n` sert de déclencheur : cliquer deux fois sur le
 * même résultat doit y ramener, même si les coordonnées n'ont pas changé.
 */
function FlyTo({ focus }: { focus: { lat: number; lon: number; n: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([focus.lat, focus.lon], Math.max(map.getZoom(), 13), {
      duration: 1,
    });
  }, [map, focus.lat, focus.lon, focus.n]);
  return null;
}

/** Un groupe : cliquer dessus zoome juste assez pour qu'il se sépare. */
function ClusterMarker({ cluster }: { cluster: MapCluster }) {
  const map = useMap();
  return (
    <Marker
      position={[cluster.y, cluster.x]}
      icon={createClusterIcon(cluster.count)}
      eventHandlers={{
        click: () =>
          map.flyTo([cluster.y, cluster.x], cluster.expansionZoom, {
            duration: 0.6,
          }),
      }}
      keyboard
      title={`${cluster.count} marchands — cliquer pour zoomer`}
    />
  );
}

export default function MapView({
  mode = "rayon",
  merchants,
  points = [],
  clusters = [],
  onViewport,
  focus,
  radiusKm,
  center,
  selectedSlug,
}: {
  mode?: "rayon" | "exploration";
  merchants: MerchantListEntry[];
  points?: MapPoint[];
  clusters?: MapCluster[];
  onViewport?: (v: Viewport) => void;
  focus?: { lat: number; lon: number; n: number };
  radiusKm: number;
  center: Center;
  selectedSlug?: string;
}) {
  const [showPhotos, setShowPhotos] = useState(false);

  const handleZoom = (zoom: number) => {
    setShowPhotos((prev) => {
      if (zoom >= PHOTO_ZOOM_SHOW) return true;
      if (zoom <= PHOTO_ZOOM_HIDE) return false;
      return prev;
    });
  };

  const exploration = mode === "exploration";

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
    >
      <ZoomTracker onZoom={handleZoom} />
      {exploration ? (
        <RecenterLibre center={center} />
      ) : (
        <Recenter center={center} radiusKm={radiusKm} suivreRayon />
      )}
      {onViewport && <ViewportWatcher onViewport={onViewport} />}
      {focus && <FlyTo focus={focus} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {!exploration && (
        <Circle
          center={[center.lat, center.lon]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "#4c8c4a",
            fillColor: "#4c8c4a",
            fillOpacity: 0.06,
            weight: 1.5,
            dashArray: "6 6",
          }}
        />
      )}

      <Marker
        position={[center.lat, center.lon]}
        icon={
          center.kind === "hopital" ? createHospitalIcon() : createUserIcon()
        }
      >
        <Popup>
          <strong>{center.label}</strong>
          {center.kind !== "hopital" && (
            <>
              <br />
              <span className="text-xs">Votre point de référence</span>
            </>
          )}
        </Popup>
      </Marker>

      {exploration &&
        clusters.map((c) => <ClusterMarker key={`c${c.id}`} cluster={c} />)}

      {exploration &&
        points.map((p) => (
          <Marker
            key={p.s}
            position={[p.y, p.x]}
            icon={
              showPhotos
                ? createPhotoIcon(p.i, p.c, p.s === selectedSlug, p.n)
                : createCategoryIcon(p.c, p.s === selectedSlug)
            }
          >
            <Popup>
              <div className="min-w-[170px]">
                <div
                  className="popup-thumb"
                  style={{ backgroundImage: `url('${p.i}')` }}
                />
                <p className="mb-0.5 font-semibold text-brand-green-dark">
                  {p.n}
                </p>
                <p className="mb-1 text-xs text-foreground/60">
                  {CATEGORY_LABELS[p.c]} ·{" "}
                  {formatDistance(distanceKm(center.lat, center.lon, p.y, p.x))}
                </p>
                <Link
                  href={`/marchand/${p.s}`}
                  className="text-sm font-medium text-brand-green underline underline-offset-2"
                >
                  Voir la fiche →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

      {!exploration &&
        merchants.map((m) => (
          <Marker
            key={m.slug}
            position={[m.lat, m.lon]}
            icon={
              showPhotos
                ? createPhotoIcon(
                    m.image_url,
                    m.categorie,
                    m.slug === selectedSlug,
                    m.nom
                  )
                : createCategoryIcon(m.categorie, m.slug === selectedSlug)
            }
          >
            <Popup>
              <div className="min-w-[170px]">
                <div
                  className="popup-thumb"
                  style={{ backgroundImage: `url('${m.image_url}')` }}
                />
                <p className="mb-0.5 font-semibold text-brand-green-dark">
                  {m.nom}
                </p>
                <p className="mb-1 text-xs text-foreground/60">
                  {CATEGORY_LABELS[m.categorie]} ·{" "}
                  {formatDistance(m.distanceKm)}
                </p>
                <Link
                  href={`/marchand/${m.slug}`}
                  className="text-sm font-medium text-brand-green underline underline-offset-2"
                >
                  Voir la fiche →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
