"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
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

import type { MapPoint, MapCluster } from "@/lib/spatialIndex";
import type { Viewport } from "@/lib/useViewportMerchants";
import { formatDistance, distanceKm } from "@/lib/geo";

const PHOTO_ZOOM_SHOW = 14;
const PHOTO_ZOOM_HIDE = 13;
/** Cadrage de départ : la ville et ses abords, de quoi voir une vingtaine de
 *  points sans zoomer. */
const ZOOM_INITIAL = 12;

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
 * Leaflet mesure son conteneur une fois, à la création. Sur téléphone, la
 * hauteur en `dvh` change quand la barre d'adresse se replie, et une bande de
 * tuiles grises apparaissait sur le bord : on lui redit la taille à chaque
 * changement.
 */
function SuivreTaille() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/** Rejoindre le nouveau point de référence sans toucher au zoom choisi par le
 *  visiteur, et sans contrarier un déplacement en cours. */
function Recenter({ center }: { center: Center }) {
  const map = useMap();
  const premier = useRef(true);

  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    map.flyTo([center.lat, center.lon], Math.max(map.getZoom(), ZOOM_INITIAL), {
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
  points,
  clusters,
  onViewport,
  focus,
  center,
  selectedSlug,
}: {
  points: MapPoint[];
  clusters: MapCluster[];
  onViewport: (v: Viewport) => void;
  focus?: { lat: number; lon: number; n: number };
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

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={ZOOM_INITIAL}
      scrollWheelZoom
      className="h-full w-full"
    >
      <ZoomTracker onZoom={handleZoom} />
      <SuivreTaille />
      <Recenter center={center} />
      <ViewportWatcher onViewport={onViewport} />
      {focus && <FlyTo focus={focus} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker
        position={[center.lat, center.lon]}
        icon={
          center.kind === "hopital" ? createHospitalIcon() : createUserIcon()
        }
      >
        <Popup>
          <strong>{center.label}</strong>
          <br />
          <span className="text-xs">
            {center.kind === "hopital"
              ? "Point de repère : les distances sont mesurées d'ici"
              : "Votre point de référence"}
          </span>
        </Popup>
      </Marker>

      {clusters.map((c) => (
        <ClusterMarker key={`c${c.id}`} cluster={c} />
      ))}

      {points.map((p) => (
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
    </MapContainer>
  );
}
