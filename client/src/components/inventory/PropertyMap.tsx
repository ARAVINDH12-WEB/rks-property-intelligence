import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Property } from '../../types/index.js';
import { useApp } from '../../context/AppContext.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatCurrencyINR, formatSqFt, formatRate } from '../../utils/formatters.js';
import { Eye } from 'lucide-react';

interface PropertyMapProps {
  properties: Property[];
}

export const PropertyMap: React.FC<PropertyMapProps> = ({ properties }) => {
  const { setSelectedPropertyId } = useApp();

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
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 14px; height: 14px; background: ${pinColor}; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 10px ${pinColor};"></div>
        <div style="position: absolute; width: 28px; height: 28px; border: 1.5px solid ${pinColor}; border-radius: 50%; opacity: 0.6; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: svgHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  // Center map on average or first coordinate (defaults to South India / Chennai)
  const defaultCenter: [number, number] =
    mapProps.length > 0
      ? [Number(mapProps[0].latitude), Number(mapProps[0].longitude)]
      : [12.9716, 77.5946];

  return (
    <div className="relative h-[640px] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[#12161F] shadow-2xl">
      {mapProps.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center text-zinc-400">
          <p className="text-base font-semibold text-white">No properties with coordinates available</p>
          <p className="text-xs text-zinc-500 mt-1">
            Add Latitude & Longitude to properties in their editing workspace to visualize on the map.
          </p>
        </div>
      ) : (
        <MapContainer
          center={defaultCenter}
          zoom={9}
          scrollWheelZoom={true}
          className="h-full w-full z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {mapProps.map((prop) => (
            <Marker
              key={prop.id}
              position={[Number(prop.latitude), Number(prop.longitude)]}
              icon={createCustomIcon(prop.status)}
            >
              <Popup className="rks-leaflet-popup">
                <div className="p-1 min-w-[220px] font-sans text-zinc-900">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                    <span className="font-mono font-bold text-sm text-black">
                      {prop.property_code}
                    </span>
                    <StatusBadge status={prop.status} size="sm" />
                  </div>

                  <div className="mt-2 text-xs font-semibold text-zinc-800 truncate">
                    {prop.project_name}
                  </div>
                  <div className="text-[11px] text-zinc-500">{prop.city}</div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 bg-zinc-100 rounded-lg p-2 font-mono text-[11px]">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-sans">Area</span>
                      <div className="font-bold text-zinc-900">{formatSqFt(prop.area_sqft)}</div>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-sans">Rate</span>
                      <div className="font-bold text-amber-700">₹{prop.rate_per_sqft}</div>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-zinc-200 flex justify-between items-baseline">
                      <span className="text-[9px] text-zinc-500 uppercase font-sans">Total</span>
                      <span className="font-bold text-emerald-700 text-xs">
                        {formatCurrencyINR(prop.total_price, true)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPropertyId(prop.id)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 py-1.5 text-xs font-bold text-white hover:bg-black transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Property Details</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 rounded-xl border border-zinc-700/80 bg-[#12161F]/90 p-3 shadow-xl backdrop-blur-md text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-1">
          Inventory Status
        </span>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <span className="text-zinc-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm" />
          <span className="text-zinc-300">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm" />
          <span className="text-zinc-300">Sold</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-sm" />
          <span className="text-zinc-300">Upcoming</span>
        </div>
      </div>
    </div>
  );
};
