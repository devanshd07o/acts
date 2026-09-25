import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CAMPUS_BLOCKS } from '../data/campusData';

// Projects a 3D point to screen space
function toScreenPos(pos3D, camera, renderer) {
  const v = pos3D.clone().project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  return {
    x: ((v.x + 1) / 2) * rect.width + rect.left,
    y: ((-v.y + 1) / 2) * rect.height + rect.top,
    visible: v.z < 1.0
  };
}

export default function CampusLabels({ clusters, cameraRef, rendererRef, sceneRef, onBuildingClick }) {
  const [labels, setLabels] = useState([]);
  const rafRef = useRef(null);

  const updateLabels = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current) return;
    const cam = cameraRef.current;
    const rdr = rendererRef.current;

    const next = CAMPUS_BLOCKS.map(block => {
      const cluster = clusters.find(c => c.blockId === block.id);
      const worldPos = new THREE.Vector3(block.x, block.h + block.beaconOffsetY + 14, block.z);
      const screen = toScreenPos(worldPos, cam, rdr);

      return {
        id: block.id,
        name: block.name,
        shortName: block.shortName,
        code: block.code,
        accentColor: block.accentColor,
        heat: cluster?.heat || null,
        count: cluster?.totalQueries || 0,
        x: screen.x,
        y: screen.y,
        visible: screen.visible
      };
    });

    setLabels(next);
    rafRef.current = requestAnimationFrame(updateLabels);
  }, [clusters, cameraRef, rendererRef]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(updateLabels);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [updateLabels]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      {labels.map(label => {
        if (!label.visible || label.x < -60 || label.y < -60) return null;
        return (
          <button
            key={label.id}
            onClick={() => onBuildingClick?.(label.id)}
            className="campus-label pointer-events-auto"
            style={{
              left: label.x,
              top: label.y,
              opacity: label.visible ? 1 : 0
            }}
          >
            {/* Name chip */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white font-semibold text-xs shadow-lg mb-1"
              style={{
                background: label.accentColor,
                boxShadow: `0 2px 12px ${label.accentColor}66, 0 1px 3px rgba(0,0,0,0.2)`
              }}
            >
              <span className="text-[10px] opacity-75 font-mono">{label.shortName}</span>
              <span className="max-w-[90px] truncate">{label.name.split(' ').slice(0,2).join(' ')}</span>
            </div>

            {/* Heat badge */}
            {label.count > 0 && (
              <div
                className="flex items-center justify-center mx-auto w-6 h-6 rounded-full text-white text-[10px] font-bold shadow-md"
                style={{
                  background: label.heat?.color || label.accentColor,
                  boxShadow: `0 0 10px ${label.heat?.color || label.accentColor}88`
                }}
              >
                {label.count}
              </div>
            )}

            {/* Connector line */}
            <svg
              className="absolute left-1/2 -translate-x-1/2 top-full"
              width="2" height="16"
              style={{ pointerEvents: 'none' }}
            >
              <line x1="1" y1="0" x2="1" y2="16"
                stroke={label.accentColor} strokeWidth="1.5" strokeDasharray="3 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
