import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Property } from '../../types/index.js';
import { useApp } from '../../context/AppContext.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatCurrencyINR, formatSqFt } from '../../utils/formatters.js';
import { api } from '../../services/api.js';
import {
  Eye,
  Navigation,
  MapPin,
  Edit3,
  ExternalLink,
  Check,
  Save,
  X,
  Compass,
  Building,
  Link2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface PropertyMapProps {
  properties: Property[];
}

// Sub-component to handle programmatic map view changes (flyTo)
const MapViewController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Preset location hubs for South India real estate corridors
const LOCATION_PRESETS = [
  { name: 'Chennai OMR / Sholinganallur', lat: 12.9010, lng: 80.2279 },
  { name: 'Chennai Guindy / GST Road', lat: 13.0067, lng: 80.2026 },
  { name: 'Bangalore Whitefield', lat: 12.9698, lng: 77.7500 },
  { name: 'Bangalore Electronic City', lat: 12.8399, lng: 77.6770 },
  { name: 'Coimbatore Avinashi Road', lat: 11.0168, lng: 76.9558 },
  { name: 'Hosur SIPCOT Corridor', lat: 12.7409, lng: 77.8253 },
];

export const PropertyMap: React.FC<PropertyMapProps> = ({ properties }) => {
  const { setSelectedPropertyId, activeRole, showToast, refreshInventory } = useApp();
  const isStaff = activeRole !== 'VIEWER';

  // State for map view target
  const [mapTarget, setMapTarget] = useState<{ center: [number, number]; zoom: number }>({
    center: [12.9716, 80.2026], // Default Tamil Nadu / Chennai center
    zoom: 9,
  });

  // State for Edit Location Modal (Admin / Staff)
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [editLat, setEditLat] = useState<string>('');
  const [editLng, setEditLng] = useState<string>('');
  const [editMapsUrl, setEditMapsUrl] = useState<string>('');
  const [mapsUrlError, setMapsUrlError] = useState<string>('');
  const [isSavingLoc, setIsSavingLoc] = useState<boolean>(false);

  // Filter properties with valid coordinates
  const mapProps = properties.filter(
    (p) => p.latitude && p.longitude && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
  );

  // Helper to create custom colored SVG pin icons
  const createCustomIcon = (status: string) => {
    let pinColor = '#10B981'; // green for AVAILABLE
    if (status === 'RESERVED') pinColor = '#F59E0B'; // amber
    if (status === 'SOLD') pinColor = '#EF4444'; // rose
    if (status === 'BLOCKED') pinColor = '#64748B'; // slate
    if (status === 'HOLD') pinColor = '#EAB308'; // yellow
    if (status === 'UPCOMING') pinColor = '#06B6D4'; // cyan

    const svgHtml = `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; width: 16px; height: 16px; background: ${pinColor}; border: 3px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 12px ${pinColor};"></div>
        <div style="position: absolute; width: 30px; height: 30px; border: 1.5px solid ${pinColor}; border-radius: 50%; opacity: 0.7; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: svgHtml,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
    });
  };

  const handleOpenEditLocation = (prop: Property) => {
    setEditingProp(prop);
    setEditLat(String(prop.latitude || '12.9716'));
    setEditLng(String(prop.longitude || '80.2026'));
    setEditMapsUrl('');
    setMapsUrlError('');
  };

  /**
   * Extracts lat/lng from a Google Maps URL.
   * Handles formats:
   *  - https://www.google.com/maps/@12.9716,80.2026,15z
   *  - https://www.google.com/maps/place/.../data=...!3d12.9716!4d80.2026
   *  - https://maps.app.goo.gl/shortlink (prompts user — we can't resolve short links client-side)
   *  - ?q=12.9716,80.2026
   *  - @12.9716,80.2026
   */
  const parseGoogleMapsUrl = (url: string): { lat: string; lng: string } | null => {
    // Pattern 1: @lat,lng in URL
    const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const atMatch = url.match(atPattern);
    if (atMatch) return { lat: atMatch[1], lng: atMatch[2] };

    // Pattern 2: !3d<lat>!4d<lng>
    const dataPattern = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
    const dataMatch = url.match(dataPattern);
    if (dataMatch) return { lat: dataMatch[1], lng: dataMatch[2] };

    // Pattern 3: ?q=lat,lng or &q=lat,lng
    const qPattern = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qMatch = url.match(qPattern);
    if (qMatch) return { lat: qMatch[1], lng: qMatch[2] };

    // Pattern 4: /place/ with ll=lat,lng param
    const llPattern = /ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const llMatch = url.match(llPattern);
    if (llMatch) return { lat: llMatch[1], lng: llMatch[2] };

    return null;
  };

  const handleMapsUrlChange = (url: string) => {
    setEditMapsUrl(url);
    if (!url.trim()) {
      setMapsUrlError('');
      return;
    }
    const coords = parseGoogleMapsUrl(url.trim());
    if (coords) {
      setEditLat(coords.lat);
      setEditLng(coords.lng);
      setMapsUrlError('');
    } else if (url.includes('goo.gl') || url.includes('maps.app')) {
      setMapsUrlError('Short links (goo.gl) cannot be parsed directly. Open the link in your browser, copy the full URL from the address bar, and paste it here.');
    } else {
      setMapsUrlError('Could not extract coordinates. Try opening the location in Google Maps and copying the full URL from the address bar.');
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProp) return;

    const latNum = parseFloat(editLat);
    const lngNum = parseFloat(editLng);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      showToast('Invalid Latitude', 'Please enter a valid latitude (-90 to 90)', 'error');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      showToast('Invalid Longitude', 'Please enter a valid longitude (-180 to 180)', 'error');
      return;
    }

    setIsSavingLoc(true);
    try {
      await api.inlineEdit(editingProp.id, 'latitude', latNum);
      await api.inlineEdit(editingProp.id, 'longitude', lngNum);
      showToast('Location Updated', `${editingProp.property_code} coordinates updated to [${latNum}, ${lngNum}]`, 'success');
      setMapTarget({ center: [latNum, lngNum], zoom: 14 });
      setEditingProp(null);
      refreshInventory();
    } catch (err: any) {
      showToast('Update Failed', err.message, 'error');
    } finally {
      setIsSavingLoc(false);
    }
  };

  const handleApplyPreset = (preset: { lat: number; lng: number }) => {
    setEditLat(String(preset.lat));
    setEditLng(String(preset.lng));
  };

  // Group unique cities from properties
  const uniqueCities = Array.from(new Set(mapProps.map((p) => p.city || p.location_name).filter(Boolean)));

  return (
    <div className="space-y-4">
      {/* Quick Location Fly-to Hub Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1 shrink-0">
          <Compass className="h-3.5 w-3.5" /> Corridors:
        </span>

        <button
          onClick={() => setMapTarget({ center: [12.9716, 80.2026], zoom: 9 })}
          className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm shrink-0"
        >
          All South India (Overview)
        </button>

        {uniqueCities.map((city) => {
          const sampleProp = mapProps.find((p) => (p.city || p.location_name) === city);
          if (!sampleProp) return null;
          return (
            <button
              key={city}
              onClick={() =>
                setMapTarget({
                  center: [Number(sampleProp.latitude), Number(sampleProp.longitude)],
                  zoom: 12,
                })
              }
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all shadow-sm shrink-0"
            >
              <MapPin className="h-3.5 w-3.5 text-indigo-500" />
              <span>{city}</span>
            </button>
          );
        })}
      </div>

      {/* Map Card */}
      <div className="relative h-[660px] w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] shadow-2xl">
        {mapProps.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-zinc-400">
            <MapPin className="h-10 w-10 text-slate-300 dark:text-zinc-700 mb-2" />
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              No properties with GPS coordinates available
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-md">
              Add Latitude & Longitude in the property editor or import batch to visualize interactive plot pins.
            </p>
          </div>
        ) : (
          <MapContainer
            center={mapTarget.center}
            zoom={mapTarget.zoom}
            scrollWheelZoom={true}
            className="h-full w-full z-10 font-sans"
          >
            <MapViewController center={mapTarget.center} zoom={mapTarget.zoom} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {mapProps.map((prop) => {
              const lat = Number(prop.latitude);
              const lng = Number(prop.longitude);
              const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

              return (
                <Marker
                  key={prop.id}
                  position={[lat, lng]}
                  icon={createCustomIcon(prop.status)}
                  eventHandlers={{
                    click: () => {
                      setMapTarget({ center: [lat, lng], zoom: 14 });
                    },
                  }}
                >
                  <Popup className="rks-leaflet-popup">
                    <div className="p-1 min-w-[240px] font-sans text-slate-900 dark:text-zinc-100">
                      {/* Top Code & Status */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {prop.property_code}
                        </span>
                        <StatusBadge status={prop.status} size="sm" />
                      </div>

                      {/* Project & City */}
                      <div className="mt-2 text-xs font-bold text-slate-800 dark:text-zinc-200 truncate flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span>{prop.project_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium pl-5">
                        {prop.city || prop.location_name}
                      </div>

                      {/* Pricing Specs Box */}
                      <div className="mt-2.5 grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-800/80 rounded-xl p-2.5 font-mono text-[11px]">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-sans">Area</span>
                          <div className="font-bold text-slate-900 dark:text-white">{formatSqFt(prop.area_sqft)}</div>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-sans">Rate</span>
                          <div className="font-bold text-amber-600 dark:text-amber-400">₹{prop.rate_per_sqft}/sq.ft</div>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-zinc-700/60 flex justify-between items-baseline">
                          <span className="text-[9px] text-slate-500 uppercase font-sans">Total Price</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            {formatCurrencyINR(prop.total_price, true)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 space-y-1.5">
                        {/* 1. Customer: Navigate / Go to Location in Google Maps */}
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          <span>Get Directions / Go to Location</span>
                          <ExternalLink className="h-3 w-3 opacity-80" />
                        </a>

                        {/* 2. View Full Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedPropertyId(prop.id)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Property Details</span>
                        </button>

                        {/* 3. Admin / Staff: Edit GPS Location */}
                        {isStaff && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditLocation(prop)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3 text-amber-500" />
                            <span>Change Location / Coordinates</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-[#12161F]/95 p-3.5 shadow-2xl backdrop-blur-md text-xs font-sans">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800 pb-1">
            Status Legend
          </span>
          <div className="flex items-center gap-2 pt-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm ring-2 ring-emerald-500/20" />
            <span className="text-slate-700 dark:text-zinc-200 font-medium">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm ring-2 ring-amber-500/20" />
            <span className="text-slate-700 dark:text-zinc-200 font-medium">Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm ring-2 ring-rose-500/20" />
            <span className="text-slate-700 dark:text-zinc-200 font-medium">Sold</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-sm ring-2 ring-cyan-500/20" />
            <span className="text-slate-700 dark:text-zinc-200 font-medium">Upcoming</span>
          </div>
        </div>
      </div>

      {/* Admin / Staff: Edit Location & Coordinates Modal */}
      {editingProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12161F] p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Edit Location Coordinates
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">{editingProp.property_code}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingProp(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4">

              {/* ── Google Maps URL Auto-Extract ── */}
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-900/10 p-3.5 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <Link2 className="h-3.5 w-3.5" />
                  Paste Google Maps Link (Auto-fills coordinates)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={editMapsUrl}
                    onChange={(e) => handleMapsUrlChange(e.target.value)}
                    placeholder="https://www.google.com/maps/@12.9716,80.2026,15z"
                    className="w-full rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-zinc-900 px-3 py-2 pr-8 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-slate-400"
                  />
                  {editMapsUrl && !mapsUrlError && (
                    <CheckCircle2 className="absolute right-2.5 top-2 h-4 w-4 text-emerald-500" />
                  )}
                </div>
                {mapsUrlError ? (
                  <div className="flex items-start gap-1.5 text-[10px] text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{mapsUrlError}</span>
                  </div>
                ) : editMapsUrl && !mapsUrlError ? (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✅ Coordinates extracted → Lat: {editLat}, Lng: {editLng}
                  </p>
                ) : (
                  <p className="text-[10px] text-indigo-500/70 dark:text-indigo-400/60">
                    Open any property in Google Maps → share/copy link → paste here
                  </p>
                )}
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Quick Location Presets (1-Click Fill)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {LOCATION_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-2 text-left text-[11px] font-semibold text-slate-700 dark:text-zinc-300 hover:border-amber-500 hover:text-amber-500 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLat}
                    onChange={(e) => setEditLat(e.target.value)}
                    placeholder="12.9716"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLng}
                    onChange={(e) => setEditLng(e.target.value)}
                    placeholder="80.2026"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingProp(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLoc}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSavingLoc ? 'Saving...' : 'Save Coordinates'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
