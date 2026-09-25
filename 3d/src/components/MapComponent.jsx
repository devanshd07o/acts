import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CAMPUS_BLOCKS, CAMPUS_CENTER, CAMPUS_BOUNDS } from '../data/abesCampusData';

export default function MapComponent({
  clusters,
  selectedCluster,
  onSelectCluster,
  mapType,
  isDroppingPin,
  pinnedCoord,
  onMapClick
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const clusterLayerRef = useRef(null);
  const blocksLayerRef = useRef(null);
  const pinMarkerRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: CAMPUS_CENTER,
      zoom: 17.5,
      minZoom: 16,
      maxZoom: 19.5,
      maxBounds: [
        [28.6270, 77.4390],
        [28.6400, 77.4530]
      ],
      zoomControl: false,
      attributionControl: true
    });

    // Custom zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer (CartoDB Dark Matter)
    tileLayerRef.current = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 20
      }
    ).addTo(map);

    // Blocks Polygon Layer
    const blocksGroup = L.layerGroup().addTo(map);
    blocksLayerRef.current = blocksGroup;

    CAMPUS_BLOCKS.forEach((block) => {
      const polygon = L.polygon(block.polygon, {
        color: block.color,
        weight: 1.5,
        opacity: 0.85,
        fillColor: block.color,
        fillOpacity: 0.12,
        dashArray: '3, 4'
      });

      polygon.bindTooltip(
        `<div class="font-bold text-xs">${block.name}</div><div class="text-[10px] text-slate-400">${block.subtitle}</div>`,
        {
          className: 'abes-building-tooltip',
          direction: 'top',
          offset: [0, -10]
        }
      );

      // On polygon click, trigger select if has cluster or allow query
      polygon.on('click', () => {
        const cluster = clusters.find((c) => c.blockId === block.id);
        if (cluster) {
          onSelectCluster(cluster);
        } else {
          onMapClick({ lat: block.center[0], lng: block.center[1], blockId: block.id });
        }
      });

      blocksGroup.addLayer(polygon);
    });

    // Clusters Layer Group
    clusterLayerRef.current = L.layerGroup().addTo(map);

    // Map click handler
    map.on('click', (e) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when mapType changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    if (mapType === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
          maxZoom: 19
        }
      ).addTo(mapInstanceRef.current);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
          subdomains: 'abcd',
          maxZoom: 20
        }
      ).addTo(mapInstanceRef.current);
    }
  }, [mapType]);

  // Render / Update Dynamic Cluster Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterLayerRef.current) return;

    clusterLayerRef.current.clearLayers();

    clusters.forEach((cluster) => {
      const isSelected = selectedCluster && selectedCluster.id === cluster.id;
      const { heat, totalQueries } = cluster;

      // Construct High-Impact Custom HTML for the Cluster Pin
      let waveMarkup = '';
      if (heat.tier === 'critical') {
        waveMarkup = `
          <div class="absolute -inset-4 rounded-full bg-rose-500/25 pulse-ring-crimson pointer-events-none"></div>
          <div class="absolute -inset-2 rounded-full bg-rose-500/35 animate-ping opacity-50 pointer-events-none"></div>
        `;
      } else if (heat.tier === 'medium') {
        waveMarkup = `
          <div class="absolute -inset-3 rounded-full bg-amber-500/25 pulse-ring-amber pointer-events-none"></div>
        `;
      } else {
        waveMarkup = `
          <div class="absolute -inset-2 rounded-full bg-cyan-500/20 pulse-ring-cyan pointer-events-none"></div>
        `;
      }

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-30'}">
          ${waveMarkup}
          <!-- Main Cluster Core -->
          <div style="box-shadow: ${heat.glowShadow}; background-color: ${heat.color};" 
               class="relative w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-sm border-2 border-white/90 shadow-2xl transition-transform">
            <span>${totalQueries}</span>
            <!-- Heat Indicator Flame/Icon for critical -->
            ${
              heat.tier === 'critical'
                ? `<span class="absolute -top-1 -right-1 flex h-3 w-3">
                     <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span class="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white"></span>
                   </span>`
                : ''
            }
          </div>
          <!-- Spot Name Pill -->
          <div class="absolute top-10 whitespace-nowrap bg-slate-900/90 border border-slate-700/80 px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-200 shadow-lg pointer-events-none backdrop-blur-md">
            ${cluster.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-cluster-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([cluster.lat, cluster.lng], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectCluster(cluster);
      });

      clusterLayerRef.current.addLayer(marker);
    });
  }, [clusters, selectedCluster]);

  // Update Dropped Pin Marker when user is placing a report pin
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (pinMarkerRef.current) {
      mapInstanceRef.current.removeLayer(pinMarkerRef.current);
      pinMarkerRef.current = null;
    }

    if (pinnedCoord) {
      const pinHtml = `
        <div class="relative flex items-center justify-center animate-bounce">
          <div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-[0_0_20px_#10b981] text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="absolute top-9 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
            Selected Spot
          </div>
        </div>
      `;

      const pinIcon = L.divIcon({
        html: pinHtml,
        className: 'custom-pin-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      pinMarkerRef.current = L.marker([pinnedCoord.lat, pinnedCoord.lng], { icon: pinIcon }).addTo(
        mapInstanceRef.current
      );
    }
  }, [pinnedCoord]);

  // Pan to selected cluster smoothly
  useEffect(() => {
    if (selectedCluster && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedCluster.lat, selectedCluster.lng], 18.5, {
        animate: true,
        duration: 0.8
      });
    }
  }, [selectedCluster]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full z-0" />
      {isDroppingPin && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-emerald-900/90 border border-emerald-500/80 text-emerald-200 px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-md shadow-2xl flex items-center gap-2 animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          Click anywhere on ABESEC campus map to pin exact query location
        </div>
      )}
    </div>
  );
}
