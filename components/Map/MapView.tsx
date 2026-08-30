"use client";

import "leaflet/dist/leaflet.css";
import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
} from "react-leaflet";
import Link from "next/link";
import { HOSPITAL } from "@/lib/geo";
import { CATEGORY_LABELS } from "@/lib/categories";
import {
  createCategoryIcon,
  createPhotoIcon,
  createHospitalIcon,
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

export default function MapView({
  merchants,
  radiusKm,
  selectedSlug,
}: {
  merchants: MerchantWithDistance[];
  radiusKm: number;
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
      center={[HOSPITAL.lat, HOSPITAL.lon]}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
    >
      <ZoomTracker onZoom={handleZoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Circle
        center={[HOSPITAL.lat, HOSPITAL.lon]}
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
        position={[HOSPITAL.lat, HOSPITAL.lon]}
        icon={createHospitalIcon()}
      >
        <Popup>
          <strong>{HOSPITAL.nom}</strong>
          <br />
          {HOSPITAL.adresse}
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
