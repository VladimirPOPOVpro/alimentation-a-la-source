"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
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
} from "@/lib/mapIcons";
import type { MerchantWithDistance } from "@/lib/merchants";
import { formatDistance } from "@/lib/geo";

const PHOTO_ZOOM_SHOW = 14;
const PHOTO_ZOOM_HIDE = 13;

function ZoomTracker({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (e) => onZoom(e.target.getZoom()),
  });
  return null;
}

/**
 * Recentre la carte quand le visiteur change de point de référence, et ajuste
 * le zoom pour que le cercle du rayon tienne à l'écran. Sans ça, choisir une
 * adresse à Lille laisserait la carte sur le Var.
 */
function Recenter({ center, radiusKm }: { center: Center; radiusKm: number }) {
  const map = useMap();
  const first = useRef(true);

  useEffect(() => {
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
  }, [map, center.lat, center.lon, radiusKm]);

  return null;
}

export default function MapView({
  merchants,
  radiusKm,
  center,
  selectedSlug,
}: {
  merchants: MerchantWithDistance[];
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

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
    >
      <ZoomTracker onZoom={handleZoom} />
      <Recenter center={center} radiusKm={radiusKm} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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

      {merchants.map((m) => (
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
                {CATEGORY_LABELS[m.categorie]} · {formatDistance(m.distanceKm)}
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
