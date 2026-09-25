import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CAMPUS_BLOCKS } from '../data/campusData';

// ─── Custom 3D Mesh Builders ───────────────────────────────────────────────────

// Circular Staircase Tower + Central Sitting Quadrangle Link
function buildStairTowerAndCourtyard(block) {
  const group = new THREE.Group();
  group.userData = { blockId: block.id };
  const { w, h } = block;

  // Central Glass Cylinder
  const cylMat = new THREE.MeshLambertMaterial({ color: '#f1f5f9' });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, h, 18), cylMat);
  cyl.position.y = h / 2;
  cyl.castShadow = true;
  cyl.userData = { blockId: block.id };
  group.add(cyl);

  // Vertical Glass Ribs
  const glMat = new THREE.MeshLambertMaterial({
    color: '#38bdf8',
    transparent: true,
    opacity: 0.75
  });
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(1.4, h * 0.9, 0.8), glMat);
    rib.position.set(Math.cos(a) * (w / 2 - 0.4), h / 2, Math.sin(a) * (w / 2 - 0.4));
    group.add(rib);
  }

  // Roof cornice
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(w / 2 + 1.2, w / 2 + 1.2, 2.5, 18),
    new THREE.MeshLambertMaterial({ color: '#cbd5e1' })
  );
  rim.position.y = h + 1.25;
  group.add(rim);

  // Connecting colonnade wings East and West
  [-1, 1].forEach(side => {
    const conn = new THREE.Mesh(
      new THREE.BoxGeometry(28, 12, 12),
      new THREE.MeshLambertMaterial({ color: '#f8fafc' })
    );
    conn.position.set(side * 22, 6, 0);
    conn.castShadow = true;
    group.add(conn);

    // Archway opening
    const archHole = new THREE.Mesh(
      new THREE.BoxGeometry(16, 8, 13),
      new THREE.MeshLambertMaterial({ color: '#334155' })
    );
    archHole.position.set(side * 22, 4, 0);
    group.add(archHole);
  });

  // Central Sitting Area (Paved Quadrangle with benches & planters)
  const quadPave = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 26),
    new THREE.MeshLambertMaterial({ color: '#e2e8f0' })
  );
  quadPave.rotation.x = -Math.PI / 2;
  quadPave.position.set(0, 0.15, 16);
  group.add(quadPave);

  // Sitting stone benches in courtyard
  [[-10, 16], [10, 16], [-10, 24], [10, 24]].forEach(([bx, bz]) => {
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(7, 1.8, 2.4),
      new THREE.MeshLambertMaterial({ color: '#94a3b8' })
    );
    bench.position.set(bx, 0.9, bz);
    bench.castShadow = true;
    group.add(bench);
  });

  group.position.set(block.x, 0, block.z);
  return group;
}

// Nescafe Corner & Circular Plaza (Round brick seating with metal grilling & tree)
function buildNescafeCorner(block) {
  const group = new THREE.Group();
  group.userData = { blockId: block.id };

  // 1. Raised circular brick bench base
  const outerR = 11, innerR = 7;
  const brickMat = new THREE.MeshLambertMaterial({ color: '#b45309' }); // Terracotta brick
  const stoneMat = new THREE.MeshLambertMaterial({ color: '#e2e8f0' }); // Stone seat top
  const grillMat = new THREE.MeshLambertMaterial({ color: '#1e293b' }); // Dark wrought-iron grill

  const brickRing = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR, outerR, 1.8, 24),
    brickMat
  );
  brickRing.position.y = 0.9;
  brickRing.castShadow = true;
  group.add(brickRing);

  // Stone coping seat top
  const seatTop = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR + 0.4, outerR + 0.4, 0.4, 24),
    stoneMat
  );
  seatTop.position.y = 1.9;
  group.add(seatTop);

  // Inner planter dirt circle
  const planter = new THREE.Mesh(
    new THREE.CylinderGeometry(innerR, innerR, 2.1, 20),
    new THREE.MeshLambertMaterial({ color: '#166534' })
  );
  planter.position.y = 1.05;
  group.add(planter);

  // 2. Decorative circular metal grilling / railing around planter
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 3.2, 5),
      grillMat
    );
    post.position.set(Math.cos(a) * innerR, 2.1 + 1.6, Math.sin(a) * innerR);
    group.add(post);
  }
  const topRail = new THREE.Mesh(
    new THREE.TorusGeometry(innerR, 0.16, 6, 24),
    grillMat
  );
  topRail.rotation.x = Math.PI / 2;
  topRail.position.y = 5.3;
  group.add(topRail);

  // 3. Shady Amaltas Tree in center of circular planter
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.6, 12, 6),
    new THREE.MeshLambertMaterial({ color: '#78350f' })
  );
  trunk.position.set(0, 6, 0);
  trunk.castShadow = true;
  group.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(8.5, 8, 6),
    new THREE.MeshLambertMaterial({ color: '#ca8a04' }) // Golden yellow blossom
  );
  canopy.scale.set(1.2, 0.7, 1.2);
  canopy.position.set(0, 15, 0);
  canopy.castShadow = true;
  group.add(canopy);

  // Yellow highlight clusters
  [[-3, 17, 3], [3, 16, -2], [0, 18, -3], [-3, 15, -3]].forEach(([sx, sy, sz]) => {
    const cluster = new THREE.Mesh(
      new THREE.SphereGeometry(3.8, 6, 5),
      new THREE.MeshLambertMaterial({ color: '#eab308' })
    );
    cluster.position.set(sx, sy, sz);
    group.add(cluster);
  });

  // 4. Iconic Red Nescafe Kiosk next to the circular bench
  const kioskGroup = new THREE.Group();
  const redMat = new THREE.MeshLambertMaterial({ color: '#dc2626' });
  const kioskBody = new THREE.Mesh(new THREE.BoxGeometry(9, 6.5, 6), redMat);
  kioskBody.position.set(0, 3.25, 0);
  kioskBody.castShadow = true;
  kioskGroup.add(kioskBody);

  // Service counter window
  const windowOpening = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 2.6, 0.4),
    new THREE.MeshLambertMaterial({ color: '#1e293b' })
  );
  windowOpening.position.set(0, 3.8, 3.05);
  kioskGroup.add(windowOpening);

  const counterShelf = new THREE.Mesh(
    new THREE.BoxGeometry(7, 0.4, 1.2),
    new THREE.MeshLambertMaterial({ color: '#ffffff' })
  );
  counterShelf.position.set(0, 2.4, 3.6);
  kioskGroup.add(counterShelf);

  // Nescafe branded white roof fascia
  const kioskRoof = new THREE.Mesh(
    new THREE.BoxGeometry(10.5, 1.2, 7.5),
    new THREE.MeshLambertMaterial({ color: '#ffffff' })
  );
  kioskRoof.position.set(0, 6.8, 0);
  kioskRoof.castShadow = true;
  kioskGroup.add(kioskRoof);

  // Nescafe Red sign plaque
  const signPlaque = new THREE.Mesh(
    new THREE.BoxGeometry(7.5, 1.8, 0.3),
    new THREE.MeshLambertMaterial({ color: '#991b1b' })
  );
  signPlaque.position.set(0, 7.8, 3.8);
  kioskGroup.add(signPlaque);

  kioskGroup.position.set(13, 0, 4);
  kioskGroup.rotation.y = -Math.PI / 4;
  group.add(kioskGroup);

  group.position.set(block.x, 0, block.z);
  return group;
}

// Campus Mandir (Temple) — White marble sanctum with stepped plinth and brass spire
function buildTemple(block) {
  const group = new THREE.Group();
  group.userData = { blockId: block.id };
  const { w, d } = block;

  const marble = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  const gold = new THREE.MeshLambertMaterial({
    color: '#f59e0b',
    emissive: new THREE.Color('#d97706').multiplyScalar(0.2)
  });

  // 1. Stepped Plinth (3 tiers)
  [
    { sw: w, sd: d, sh: 1.2, sy: 0.6 },
    { sw: w - 3, sd: d - 3, sh: 1.0, sy: 1.7 },
    { sw: w - 6, sd: d - 6, sh: 0.8, sy: 2.6 }
  ].forEach(({ sw, sd, sh, sy }) => {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), marble);
    plinth.position.y = sy;
    plinth.castShadow = true;
    group.add(plinth);
  });

  // 2. Sanctum Chamber (Garbhagriha)
  const sanctumW = 10, sanctumH = 8;
  const sanctum = new THREE.Mesh(new THREE.BoxGeometry(sanctumW, sanctumH, sanctumW), marble);
  sanctum.position.set(0, 3 + sanctumH / 2, -2);
  sanctum.castShadow = true;
  group.add(sanctum);

  // 3. Ornate Mandapa Pillars (Front portico)
  [-4, 4].forEach(px => {
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 7.5, 8), marble);
    pil.position.set(px, 3 + 3.75, 5);
    pil.castShadow = true;
    group.add(pil);
  });

  // Portico canopy
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(11, 1.2, 8), marble);
  canopy.position.set(0, 3 + 7.5, 3.5);
  group.add(canopy);

  // 4. Pyramidal Shikhar (Temple Spire)
  const shikhar = new THREE.Mesh(
    new THREE.ConeGeometry(6.5, 9, 4),
    marble
  );
  shikhar.rotation.y = Math.PI / 4;
  shikhar.position.set(0, 11 + 4.5, -2);
  shikhar.castShadow = true;
  group.add(shikhar);

  // Golden Brass Kalash & Trishul
  const kalash = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), gold);
  kalash.position.set(0, 20.6, -2);
  group.add(kalash);

  const pinnacle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 2.5, 6), gold);
  pinnacle.position.set(0, 22.2, -2);
  group.add(pinnacle);

  // Temple entrance brass bell arch
  const bellArch = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.25, 6, 12, Math.PI),
    gold
  );
  bellArch.position.set(0, 8.5, 7.2);
  group.add(bellArch);

  group.position.set(block.x, 0, block.z);
  return group;
}

// Campus Cafes & Eateries Hub — 2-Storey building with terrace and outdoor umbrellas
function buildCafesBlock(block) {
  const group = new THREE.Group();
  group.userData = { blockId: block.id };
  const { w, d, h } = block;

  const cafeWall = new THREE.MeshLambertMaterial({ color: block.wallColor });
  const woodTrim = new THREE.MeshLambertMaterial({ color: '#78350f' });
  const warmGlass = new THREE.MeshLambertMaterial({
    color: '#fef08a',
    transparent: true,
    opacity: 0.8
  });

  // Main 2-storey structure
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cafeWall);
  body.position.y = h / 2;
  body.castShadow = body.receiveShadow = true;
  group.add(body);

  // Floor divider awning
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(w + 2, 1.4, d + 2),
    woodTrim
  );
  awning.position.y = h / 2;
  group.add(awning);

  // Large display windows for cafes
  [-w / 3, 0, w / 3].forEach(wx => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 0.5), warmGlass);
    win.position.set(wx, h * 0.28, d / 2 + 0.2);
    group.add(win);

    const winUpper = new THREE.Mesh(new THREE.BoxGeometry(7, 4.5, 0.5), warmGlass);
    winUpper.position.set(wx, h * 0.74, d / 2 + 0.2);
    group.add(winUpper);
  });

  // Outdoor terrace / patio deck in front
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(w + 8, 0.6, 12),
    new THREE.MeshLambertMaterial({ color: '#e2e8f0' })
  );
  deck.position.set(0, 0.3, d / 2 + 6);
  group.add(deck);

  // Cafe umbrella tables on patio
  [-12, 0, 12].forEach(tx => {
    // Table
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 1.6, 12),
      woodTrim
    );
    table.position.set(tx, 0.8, d / 2 + 6);
    group.add(table);

    // Umbrella pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 6, 6),
      new THREE.MeshLambertMaterial({ color: '#334155' })
    );
    pole.position.set(tx, 3.3, d / 2 + 6);
    group.add(pole);

    // Umbrella cone
    const umbrella = new THREE.Mesh(
      new THREE.ConeGeometry(4.2, 1.8, 8),
      new THREE.MeshLambertMaterial({ color: '#ea580c' }) // Vibrant orange umbrella
    );
    umbrella.position.set(tx, 6.2, d / 2 + 6);
    group.add(umbrella);
  });

  group.position.set(block.x, 0, block.z);
  return group;
}

// Connector Bridge between Bhabha and Ramanujan
function buildConnectorBridge(x1, z1, x2, z2) {
  const group = new THREE.Group();
  const dz = Math.abs(z2 - z1);
  const midZ = (z1 + z2) / 2;

  // Covered corridor bridge
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(16, 20, dz),
    new THREE.MeshLambertMaterial({ color: '#f1f5f9' })
  );
  bridge.position.set(x1, 10, midZ);
  bridge.castShadow = true;
  group.add(bridge);

  // Windows along corridor
  const winMat = new THREE.MeshLambertMaterial({ color: '#93c5fd', transparent: true, opacity: 0.8 });
  for (let z = -dz / 2 + 5; z < dz / 2; z += 9) {
    [-8.1, 8.1].forEach(sideX => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5, 5), winMat);
      win.position.set(x1 + sideX, 12, midZ + z);
      group.add(win);
    });
  }

  // Supporting pillars underneath
  [-dz / 4, dz / 4].forEach(pz => {
    const pil = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 6, 8),
      new THREE.MeshLambertMaterial({ color: '#cbd5e1' })
    );
    pil.position.set(x1, 3, midZ + pz);
    pil.castShadow = true;
    group.add(pil);
  });

  return group;
}

// Elevated Campus Water Tank with "ABES" branding
function buildWaterTank(x, z) {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: '#e2e8f0' });
  const tankH = 38;

  // 4 Support Legs
  [[-7, -7], [7, -7], [7, 7], [-7, 7]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, tankH, 8), mat);
    leg.position.set(lx, tankH / 2, lz);
    leg.castShadow = true;
    group.add(leg);
  });

  // Cross braces
  [12, 24].forEach(by => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(9.8, 0.6, 6, 16), mat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = by;
    group.add(ring);
  });

  // Massive Reservoir
  const res = new THREE.Mesh(new THREE.CylinderGeometry(14, 13, 14, 20), mat);
  res.position.y = tankH + 7;
  res.castShadow = true;
  group.add(res);

  // Dome cap
  const cap = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  cap.position.y = tankH + 14;
  group.add(cap);

  // Bold "ABES" blue band on reservoir
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(14.2, 14.2, 4.5, 20),
    new THREE.MeshLambertMaterial({ color: '#1e3a8a' }) // Dark navy blue band
  );
  band.position.y = tankH + 7;
  group.add(band);

  group.position.set(x, 0, z);
  return group;
}

// Rooftop Solar Array for Dayanand Bhawan (DNB)
function buildSolarPanels(w, d, roofY) {
  const group = new THREE.Group();
  const panelMat = new THREE.MeshLambertMaterial({ color: '#1e293b' }); // Dark solar blue
  const frameMat = new THREE.MeshLambertMaterial({ color: '#94a3b8' });

  for (let row = -d / 3; row <= d / 3; row += 8) {
    for (let col = -w / 3; col <= w / 3; col += 10) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 5), panelMat);
      panel.rotation.x = -Math.PI / 7; // Angled facing south towards sun
      panel.position.set(col, roofY + 2.2, row);
      panel.castShadow = true;
      group.add(panel);

      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 4), frameMat);
      stand.position.set(col, roofY + 1, row);
      group.add(stand);
    }
  }
  return group;
}

// ─── Standard Building Builder ─────────────────────────────────────────────────
function buildBuilding(block) {
  if (block.id === 'stair_tower') return buildStairTowerAndCourtyard(block);
  if (block.id === 'nescafe_corner') return buildNescafeCorner(block);
  if (block.id === 'temple') return buildTemple(block);
  if (block.id === 'cafes_block') return buildCafesBlock(block);

  const group = new THREE.Group();
  group.userData = { blockId: block.id };
  const { w, d, h } = block;
  const wallMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(block.wallColor) });

  // Main Building Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.y = h / 2;
  body.castShadow = body.receiveShadow = true;
  body.userData = { blockId: block.id };
  group.add(body);

  // Arched Colonnade on Front Academic Blocks (Bhabha & Aryabhata)
  if (['bhabha', 'aryabhata'].includes(block.id)) {
    const archH = h / block.floors;
    const nPil = Math.floor(w / 11);
    const gap = w / (nPil + 1);
    const pilMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const archMat = new THREE.MeshLambertMaterial({ color: '#f1f5f9' });

    for (let i = 0; i < nPil; i++) {
      const px = -w / 2 + gap * (i + 1);
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, archH * 0.85, 10), pilMat);
      pil.position.set(px, archH * 0.42, d / 2 + 2.4);
      pil.castShadow = true;
      group.add(pil);

      const arch = new THREE.Mesh(new THREE.BoxGeometry(gap - 1.2, 2.2, 1.8), archMat);
      arch.position.set(px, archH - 1.1, d / 2 + 2.4);
      group.add(arch);
    }
    const colSlab = new THREE.Mesh(new THREE.BoxGeometry(w + 3, 1.8, 6), wallMat);
    colSlab.position.set(0, archH, d / 2 + 2.2);
    group.add(colSlab);
  }

  // Auditorium Wing Extrusion on Business School Block
  if (block.id === 'business_school') {
    const audiRoof = new THREE.Mesh(
      new THREE.CylinderGeometry(w * 0.42, w * 0.42, d * 0.7, 16, 1, false, 0, Math.PI),
      new THREE.MeshLambertMaterial({ color: '#6d28d9' }) // Royal auditorium curve
    );
    audiRoof.rotation.z = Math.PI / 2;
    audiRoof.position.set(0, h + 1, 0);
    group.add(audiRoof);
  }

  // Kalpana Chawla (Tallest Block) - Modern glass architectural vertical spine & antennae
  if (block.id === 'kalpana') {
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(8, h, 2),
      new THREE.MeshLambertMaterial({ color: '#312e81' })
    );
    spine.position.set(0, h / 2, d / 2 + 0.8);
    group.add(spine);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.7, 18, 6),
      new THREE.MeshLambertMaterial({ color: '#94a3b8' })
    );
    mast.position.set(w * 0.3, h + 9, 0);
    group.add(mast);
  }

  // Rooftop Solar Panels on Dayanand Bhawan
  if (block.id === 'boys_hostel_1') {
    group.add(buildSolarPanels(w, d, h));
  }

  // Roof Slab
  const roofH = 2.4;
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 2.5, roofH, d + 2.5),
    new THREE.MeshLambertMaterial({ color: new THREE.Color(block.roofColor) })
  );
  roof.position.y = h + roofH / 2;
  roof.castShadow = true;
  group.add(roof);

  // Roof Water Tank on blocks
  if (block.floors >= 4) {
    const tank = new THREE.Mesh(
      new THREE.BoxGeometry(7, 6, 7),
      new THREE.MeshLambertMaterial({ color: '#64748b' })
    );
    tank.position.set(w * 0.25, h + roofH + 3, d * 0.25);
    group.add(tank);
  }

  // Floor Separator Horizontal Stripes
  for (let f = 1; f < block.floors; f++) {
    const fy = (h / block.floors) * f;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.6, 1.4, d + 0.6),
      new THREE.MeshLambertMaterial({
        color: new THREE.Color(block.wallColor).lerp(new THREE.Color('#94a3b8'), 0.3)
      })
    );
    stripe.position.y = fy + 0.7;
    group.add(stripe);
  }

  // Windows Grid
  const winMat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(block.windowColor),
    transparent: true,
    opacity: 0.82
  });
  const wCols = Math.max(2, Math.floor(w / 11));
  const colGap = w / (wCols + 1);
  const rowGap = h / (block.floors + 1);

  for (let r = 0; r < block.floors; r++) {
    for (let c = 0; c < wCols; c++) {
      const wGeo = new THREE.BoxGeometry(5.8, 4.4, 0.4);
      const win = new THREE.Mesh(wGeo, winMat);
      win.position.set(-w / 2 + colGap * (c + 1), rowGap * (r + 1), d / 2 + 0.2);
      group.add(win);
    }
  }

  group.position.set(block.x, 0, block.z);
  return group;
}

// ─── ABES Main Entrance Arch (3 Dome pillars + Red Signboard on NH-09) ─────────
function buildEntranceArch(x, z) {
  const g = new THREE.Group();
  const white = new THREE.MeshLambertMaterial({ color: '#f8fafc' });
  const red = new THREE.MeshLambertMaterial({ color: '#991b1b' });

  // 3 Central Dome Pillars
  [-20, 0, 20].forEach(px => {
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 24, 10), white);
    pil.position.set(px, 12, 0);
    pil.castShadow = true;
    g.add(pil);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(3.8, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      white
    );
    dome.position.set(px, 24, 0);
    dome.castShadow = true;
    g.add(dome);

    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.0, 3.5, 6), white);
    pin.position.set(px, 28, 0);
    g.add(pin);
  });

  // Connecting beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(46, 4.5, 5), white);
  beam.position.set(0, 22, 0);
  g.add(beam);

  // Big Red Signboard
  const sign = new THREE.Mesh(new THREE.BoxGeometry(38, 7.5, 1.8), red);
  sign.position.set(0, 17.5, 3);
  g.add(sign);

  const whiteText = new THREE.Mesh(
    new THREE.BoxGeometry(34, 4.5, 0.4),
    new THREE.MeshLambertMaterial({ color: '#ffffff' })
  );
  whiteText.position.set(0, 17.5, 4.1);
  g.add(whiteText);

  // Guard Cabins
  [-36, 36].forEach(bx => {
    const booth = new THREE.Mesh(
      new THREE.BoxGeometry(8, 11, 9),
      new THREE.MeshLambertMaterial({ color: '#f1f5f9' })
    );
    booth.position.set(bx, 5.5, 0);
    booth.castShadow = true;
    g.add(booth);
  });

  g.position.set(x, 0, z);
  return g;
}

// ─── Massive Floodlit Cricket Stadium ──────────────────────────────────────────
function buildCricketStadium(x, z, w = 140, d = 105) {
  const g = new THREE.Group();
  g.userData = { blockId: 'sports' };

  // Green Turf (Oval Plane)
  const turf = new THREE.Mesh(
    new THREE.CylinderGeometry(w / 2, w / 2, 0.4, 32),
    new THREE.MeshLambertMaterial({ color: '#4ade80' })
  );
  turf.scale.set(1, 1, d / w);
  turf.position.set(0, 0.2, 0);
  turf.receiveShadow = true;
  g.add(turf);

  // Inner 30-yard Circle
  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(w * 0.28, w * 0.28 + 0.6, 32),
    new THREE.MeshLambertMaterial({ color: '#bbf7d0', side: THREE.DoubleSide })
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.scale.set(1, d / w, 1);
  innerRing.position.y = 0.42;
  g.add(innerRing);

  // Central Clay Cricket Pitch
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 26),
    new THREE.MeshLambertMaterial({ color: '#d4b896' })
  );
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.set(0, 0.44, 0);
  g.add(pitch);

  // White Crease Markings & Stumps
  [-11, 11].forEach(sy => {
    [-1, 0, 1].forEach(stumpX => {
      const stump = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 2.2, 5),
        new THREE.MeshLambertMaterial({ color: '#ffffff' })
      );
      stump.position.set(stumpX * 0.8, 1.5, sy);
      g.add(stump);
    });
  });

  // White Boundary Rope Line (36 points)
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 1.2, 4),
      new THREE.MeshLambertMaterial({ color: '#ffffff' })
    );
    post.position.set(Math.cos(a) * (w / 2 - 2), 0.6, Math.sin(a) * (d / 2 - 2));
    g.add(post);
  }

  // 4 Giant Floodlight Towers at Corners
  [
    [-w / 2 - 8, -d / 2 - 8],
    [w / 2 + 8, -d / 2 - 8],
    [w / 2 + 8, d / 2 + 8],
    [-w / 2 - 8, d / 2 + 8]
  ].forEach(([fx, fz]) => {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.8, 42, 6),
      new THREE.MeshLambertMaterial({ color: '#94a3b8' })
    );
    mast.position.set(fx, 21, fz);
    mast.castShadow = true;
    g.add(mast);

    const bank = new THREE.Mesh(
      new THREE.BoxGeometry(10, 3.5, 4),
      new THREE.MeshLambertMaterial({
        color: '#fef08a',
        emissive: new THREE.Color('#fde047').multiplyScalar(0.4)
      })
    );
    bank.position.set(fx, 42, fz);
    g.add(bank);
  });

  // Commentary Pavilion Tower on East Boundary
  const pav = new THREE.Mesh(
    new THREE.BoxGeometry(16, 18, 14),
    new THREE.MeshLambertMaterial({ color: '#b91c1c' }) // Red brick pavilion tower
  );
  pav.position.set(w / 2 + 10, 9, 0);
  pav.castShadow = true;
  g.add(pav);

  const pavRoof = new THREE.Mesh(
    new THREE.BoxGeometry(18, 2, 16),
    new THREE.MeshLambertMaterial({ color: '#f8fafc' })
  );
  pavRoof.position.set(w / 2 + 10, 19, 0);
  g.add(pavRoof);

  g.position.set(x, 0, z);
  return g;
}

// ─── Half-Olympic Swimming Pool ───────────────────────────────────────────────
function buildSwimmingPool(x, z, w = 42, d = 24) {
  const g = new THREE.Group();
  g.userData = { blockId: 'swimming_pool' };

  // Tiled Paved Surround Deck
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(w + 10, 1.2, d + 10),
    new THREE.MeshLambertMaterial({ color: '#f1f5f9' })
  );
  deck.position.set(0, 0.6, 0);
  deck.receiveShadow = true;
  g.add(deck);

  // Pool Basin / Coping Rim
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(w, 1.4, d),
    new THREE.MeshLambertMaterial({ color: '#cbd5e1' })
  );
  rim.position.set(0, 0.7, 0);
  g.add(rim);

  // Crystal Clear Pool Water
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 3, d - 3),
    new THREE.MeshLambertMaterial({
      color: '#0284c7',
      transparent: true,
      opacity: 0.85
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 1.35, 0);
  g.add(water);

  // 6 Competition Lane Divider Floats
  for (let lane = -2.5; lane <= 2.5; lane++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(w - 4, 0.35, 0.35),
      new THREE.MeshLambertMaterial({ color: lane % 2 === 0 ? '#f97316' : '#ffffff' })
    );
    line.position.set(0, 1.5, lane * ((d - 4) / 6));
    g.add(line);
  }

  // Diving Starting Blocks on West Edge
  for (let b = -2.5; b <= 2.5; b++) {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.2, 1.6),
      new THREE.MeshLambertMaterial({ color: '#2563eb' })
    );
    block.position.set(-w / 2 + 1.2, 1.8, b * ((d - 4) / 6));
    g.add(block);
  }

  g.position.set(x, 0, z);
  return g;
}

// ─── Trees & Vegetation ───────────────────────────────────────────────────────
function buildTree(x, z, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8 * s, 1.2 * s, 7 * s, 5),
    new THREE.MeshLambertMaterial({ color: '#7c4a1e' })
  );
  trunk.position.set(0, 3.5 * s, 0);
  trunk.castShadow = true;
  g.add(trunk);

  [[12, 8, '#15803d'], [9, 6.5, '#16a34a'], [6, 5, '#22c55e']].forEach(([h, r, col], i) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(r * s, h * s, 7),
      new THREE.MeshLambertMaterial({ color: col })
    );
    cone.position.y = (6 + i * 2.8 + h / 2) * s;
    cone.castShadow = true;
    g.add(cone);
  });

  g.position.set(x, 0, z);
  return g;
}

function buildAmaltasTree(x, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.2, 7.5, 6),
    new THREE.MeshLambertMaterial({ color: '#78350f' })
  );
  trunk.position.set(0, 3.75, 0);
  trunk.castShadow = true;
  g.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(6.5, 8, 5),
    new THREE.MeshLambertMaterial({ color: '#ca8a04' }) // Golden amber
  );
  canopy.scale.set(1.1, 0.65, 1.1);
  canopy.position.set(0, 10, 0);
  canopy.castShadow = true;
  g.add(canopy);

  [[-2.5, 11, 2], [2.5, 10.5, -2], [0, 11.5, -2.5]].forEach(([sx, sy, sz]) => {
    const spot = new THREE.Mesh(
      new THREE.SphereGeometry(3, 6, 4),
      new THREE.MeshLambertMaterial({ color: '#eab308' })
    );
    spot.position.set(sx, sy, sz);
    g.add(spot);
  });

  g.position.set(x, 0, z);
  return g;
}

// ─── Human figure (Correct scale: ~4.8 units tall = ~1.75m relative to 12-unit floor height) ────
function buildHuman() {
  const g = new THREE.Group();
  const skinMat = new THREE.MeshLambertMaterial({ color: '#fcd34d' });
  const hairMat = new THREE.MeshLambertMaterial({ color: '#1e293b' });
  const jacketMat = new THREE.MeshLambertMaterial({ color: '#2563eb' }); // College blue hoodie
  const pantsMat = new THREE.MeshLambertMaterial({ color: '#334155' });  // Dark denim
  const shoeMat = new THREE.MeshLambertMaterial({ color: '#0f172a' });
  const bagMat = new THREE.MeshLambertMaterial({ color: '#dc2626' });   // Red student backpack

  // Head & Hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 7), skinMat);
  head.position.set(0, 4.35, 0);
  head.castShadow = true;
  g.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.51, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
  hair.position.set(0, 4.45, 0);
  g.add(hair);

  // Torso (Jacket)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.8, 0.7), jacketMat);
  torso.position.set(0, 3.0, 0);
  torso.castShadow = true;
  g.add(torso);

  // Student Backpack
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.5), bagMat);
  backpack.position.set(0, 3.05, -0.55);
  backpack.castShadow = true;
  g.add(backpack);

  // Legs & Shoes
  [-0.36, 0.36].forEach(lx => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.44, 2.0, 0.44), pantsMat);
    leg.position.set(lx, 1.05, 0);
    leg.castShadow = true;
    g.add(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.7), shoeMat);
    shoe.position.set(lx, 0.18, 0.12);
    shoe.castShadow = true;
    g.add(shoe);
  });

  // Arms
  [-0.85, 0.85].forEach(ax => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.6, 0.36), jacketMat);
    arm.position.set(ax, 2.9, 0);
    arm.castShadow = true;
    g.add(arm);
  });

  return g;
}

// ─── Campus Perimeter Boundary Wall (Deep expansive campus Z = +45 to -475) ─────────
function buildBoundaryWall() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: '#94a3b8' });
  const wallH = 7.5, wallT = 2.4;

  // North wall (Z = -475, behind hostels)
  const nw = new THREE.Mesh(new THREE.BoxGeometry(320, wallH, wallT), mat);
  nw.position.set(0, wallH / 2, -475);
  nw.castShadow = true;
  g.add(nw);

  // South wall (Z = +45, facing NH-09)
  const sw = new THREE.Mesh(new THREE.BoxGeometry(320, wallH, wallT), mat);
  sw.position.set(0, wallH / 2, 45);
  sw.castShadow = true;
  g.add(sw);

  // West wall (X = -150)
  const ww = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, 520), mat);
  ww.position.set(-150, wallH / 2, -215);
  ww.castShadow = true;
  g.add(ww);

  // East wall (X = +150)
  const ew = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, 520), mat);
  ew.position.set(150, wallH / 2, -215);
  ew.castShadow = true;
  g.add(ew);

  return g;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Campus3DScene({ clusters, onBuildingClick, cameraMode }) {
  const mountRef = useRef(null);
  const labelDomsRef = useRef({});
  const stateRef = useRef({
    renderer: null, scene: null, camera: null,
    human: null, buildings: [], beacons: [],
    rafId: null,
    orbit: {
      theta: 0.05, phi: 0.78, radius: 460,
      tTheta: 0.05, tPhi: 0.78, tRadius: 460,
      target: new THREE.Vector3(0, 22, -180),
      tTarget: new THREE.Vector3(0, 22, -180)
    },
    fps: { x: 0, y: 4.8, z: 28, yaw: 0, pitch: -0.02 },
    input: {
      keys: {}, lastTouchDist: 0,
      isDragging: false, lastX: 0, lastY: 0, velX: 0, velY: 0,
      pointerLocked: false
    },
    humanT: 0, lastTime: 0
  });

  const cameraModeRef = useRef(cameraMode);
  useEffect(() => { cameraModeRef.current = cameraMode; }, [cameraMode]);

  // Scene setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const st = stateRef.current;

    const getW = () => container.clientWidth || window.innerWidth || 1200;
    const getH = () => container.clientHeight || window.innerHeight || 800;
    const initW = getW();
    const initH = getH();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(initW, initH);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0xdbeafe);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    st.renderer = renderer;

    // Camera
    const camera = new THREE.PerspectiveCamera(58, initW / initH, 0.5, 3000);
    st.camera = camera;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xdbeafe, 0.00045);
    st.scene = scene;

    // Sky Sphere
    const skyGeo = new THREE.SphereGeometry(2200, 16, 8);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0xbfdbfe, side: THREE.BackSide });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Lighting
    scene.add(new THREE.AmbientLight(0xe0f2fe, 0.85));
    const sun = new THREE.DirectionalLight(0xfff7ed, 2.2);
    sun.position.set(220, 420, 180);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -500;
    sun.shadow.camera.right = sun.shadow.camera.top = 500;
    sun.shadow.camera.far = 1600;
    sun.shadow.bias = -0.0008;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xbfdbfe, 0xd1fae5, 0.45));

    // Base Green Campus Ground (Spans entire deep campus)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1200),
      new THREE.MeshLambertMaterial({ color: 0x86efac })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -215);
    ground.receiveShadow = true;
    scene.add(ground);

    // NH-09 Highway (outside south gate)
    const nh09 = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 45),
      new THREE.MeshLambertMaterial({ color: 0x64748b })
    );
    nh09.rotation.x = -Math.PI / 2;
    nh09.position.set(0, 0.05, 65);
    scene.add(nh09);

    // Highway yellow dividers
    for (let i = -450; i < 450; i += 32) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 1.8),
        new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(i, 0.1, 65);
      scene.add(line);
    }

    // ── Campus Paved Avenues & Paths ──
    const pathMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const addPath = (cx, cz, pw, pd) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), pathMat);
      p.rotation.x = -Math.PI / 2;
      p.position.set(cx, 0.08, cz);
      scene.add(p);
    };

    // 1. Entrance Driveway (Gate to Nescafe Plaza)
    addPath(0, 28, 26, 34);
    // 2. Front Plaza E-W connector (Cafes - Nescafe - Mandir)
    addPath(0, 12, 220, 18);
    // 3. Front Academic Boulevard (In front of Bhabha & Aryabhata)
    addPath(0, -32, 240, 18);
    // 4. Central Academic Boulevard (Between Front Row and Central Row)
    addPath(0, -95, 260, 20);
    // 5. North Promenade (Behind KC leading to Cricket Stadium)
    addPath(0, -195, 270, 22);
    // 6. Perimeter Walkways around Cricket Ground
    addPath(-95, -275, 16, 130);
    addPath(95, -275, 16, 130);
    // 7. Hostels & Pool Boulevard (Behind Cricket Stadium, in front of hostels & pool)
    addPath(0, -345, 280, 22);
    // 8. West Avenue (Connecting Gate -> Cafes -> Bhabha -> Ramanujan -> Girls Hostel)
    addPath(-120, -215, 18, 500);
    // 9. East Avenue (Connecting Gate -> Temple -> Aryabhata -> Business School -> Boys Hostels)
    addPath(120, -215, 18, 500);

    // ── Boundary Wall ──
    scene.add(buildBoundaryWall());

    // ── ABES Main Entrance Gate 1 ──
    scene.add(buildEntranceArch(0, 38));

    // ── Connector Bridge (Bhabha to Ramanujan) ──
    scene.add(buildConnectorBridge(-70, -55, -70, -135));

    // ── Large Floodlit Cricket Stadium ──
    scene.add(buildCricketStadium(0, -275, 150, 110));

    // ── Half-Olympic Swimming Pool ──
    scene.add(buildSwimmingPool(-25, -375, 46, 26));

    // ── Elevated Campus Water Tank with "ABES" branding ──
    scene.add(buildWaterTank(40, -450));

    // ── Campus Buildings ──
    st.buildings = CAMPUS_BLOCKS
      .filter(b => b.id !== 'gate' && b.id !== 'sports' && b.id !== 'swimming_pool')
      .map(b => {
        const bg = buildBuilding(b);
        scene.add(bg);
        return bg;
      });

    // ── Trees & Green Landscaping (Generously spaced) ──
    const greenTrees = [
      // Along West Wall
      [-135, -40, 1.2], [-135, -95, 1.1], [-135, -160, 1.2], [-135, -230, 1.0], [-135, -310, 1.1], [-135, -380, 1.2],
      // Along East Wall
      [135, -40, 1.2], [135, -95, 1.1], [135, -160, 1.2], [135, -230, 1.0], [135, -310, 1.1], [135, -380, 1.2],
      // Far North Boundary behind hostels
      [-120, -440, 1.2], [-60, -440, 1.1], [0, -440, 1.2], [70, -440, 1.1], [130, -440, 1.0],
      // Surrounding Hostels & Pool
      [-120, -360, 1.1], [-55, -360, 1.0], [10, -360, 1.1], [80, -360, 1.0], [135, -360, 1.1],
      // Between Academic Blocks & Ground (Wide green buffer)
      [-100, -180, 1.2], [-40, -180, 1.1], [40, -180, 1.1], [100, -180, 1.2],
      [-70, -205, 1.1], [70, -205, 1.1]
    ];
    greenTrees.forEach(([x, z, s]) => scene.add(buildTree(x, z, s)));

    // Front Amaltas Trees (Golden yellow laburnum along front entrance & Mandir)
    const amaltasTrees = [
      [-30, 24], [30, 24], [-30, 0], [30, 0],
      [-95, 12], [-85, -10], [85, -10], [95, 12],
      [-25, -55], [25, -55]
    ];
    amaltasTrees.forEach(([x, z]) => scene.add(buildAmaltasTree(x, z)));

    // ── Animated Walking Human ──
    const human = buildHuman();
    scene.add(human);
    st.human = human;

    // ── Window Resize ──
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Input Listeners ──
    const inp = st.input;

    const onMouseDown = (e) => {
      if (cameraModeRef.current !== 'orbit') return;
      if (e.button !== 0) return;
      inp.isDragging = true;
      inp.lastX = e.clientX;
      inp.lastY = e.clientY;
      inp.velX = 0; inp.velY = 0;
    };

    const onMouseMove = (e) => {
      if (cameraModeRef.current === 'firstperson') {
        if (!inp.pointerLocked) return;
        const dx = e.movementX || 0;
        const dy = e.movementY || 0;
        const fps = st.fps;
        fps.yaw -= dx * 0.0022;
        fps.pitch = Math.max(-1.1, Math.min(0.5, fps.pitch - dy * 0.0022));
        return;
      }
      if (!inp.isDragging) return;
      const dx = e.clientX - inp.lastX, dy = e.clientY - inp.lastY;
      inp.lastX = e.clientX; inp.lastY = e.clientY;
      inp.velX = dx * 0.005; inp.velY = dy * 0.004;
      const o = st.orbit;
      o.tTheta -= dx * 0.007;
      o.tPhi = Math.max(0.12, Math.min(1.42, o.tPhi + dy * 0.005));
    };

    const onMouseUp = () => { inp.isDragging = false; };

    const onCanvasClick = (e) => {
      if (cameraModeRef.current === 'firstperson') {
        renderer.domElement.requestPointerLock();
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);

      const meshes = [];
      scene.traverse(c => {
        if (c.isMesh && c.userData?.blockId) meshes.push(c);
      });
      const hits = raycaster.intersectObjects(meshes, true);
      if (hits.length) {
        let obj = hits[0].object;
        while (obj && !obj.userData?.blockId) obj = obj.parent;
        if (obj?.userData?.blockId) {
          const id = obj.userData.blockId;
          onBuildingClick?.(id);
          const bl = CAMPUS_BLOCKS.find(b => b.id === id);
          if (bl) {
            st.orbit.tTarget.set(bl.x, bl.h * 0.45, bl.z);
            st.orbit.tRadius = Math.max(160, Math.min(320, bl.w * 2.8));
            st.orbit.tPhi = 0.82;
          }
        }
      }
    };

    const onPointerLockChange = () => {
      inp.pointerLocked = document.pointerLockElement === renderer.domElement;
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const onWheel = (e) => {
      if (cameraModeRef.current !== 'orbit') return;
      const o = st.orbit;
      o.tRadius = Math.max(80, Math.min(1100, o.tRadius + e.deltaY * 0.55));
      e.preventDefault();
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        inp.lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else {
        inp.isDragging = true;
        inp.lastX = e.touches[0].clientX;
        inp.lastY = e.touches[0].clientY;
        inp.velX = 0; inp.velY = 0;
      }
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        st.orbit.tRadius = Math.max(80, Math.min(1100, st.orbit.tRadius + (inp.lastTouchDist - d) * 1.2));
        inp.lastTouchDist = d;
      } else if (e.touches.length === 1 && inp.isDragging) {
        const dx = e.touches[0].clientX - inp.lastX;
        const dy = e.touches[0].clientY - inp.lastY;
        inp.lastX = e.touches[0].clientX;
        inp.lastY = e.touches[0].clientY;
        if (cameraModeRef.current === 'firstperson') {
          st.fps.yaw -= dx * 0.004;
          st.fps.pitch = Math.max(-1.1, Math.min(0.5, st.fps.pitch - dy * 0.004));
        } else {
          inp.velX = dx * 0.005; inp.velY = dy * 0.004;
          const o = st.orbit;
          o.tTheta -= dx * 0.008;
          o.tPhi = Math.max(0.12, Math.min(1.42, o.tPhi + dy * 0.006));
        }
      }
    };

    const onTouchEnd = () => { inp.isDragging = false; };
    const onKeyDown = (e) => { inp.keys[e.code] = true; };
    const onKeyUp = (e) => { inp.keys[e.code] = false; };
    const onKeyEscape = (e) => {
      if (e.code === 'Escape' && inp.pointerLocked) document.exitPointerLock();
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('click', onCanvasClick);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onKeyEscape);

    // ── Render Loop ──
    const animate = (now) => {
      st.rafId = requestAnimationFrame(animate);
      const dt = Math.min((now - (st.lastTime || now)) / 16.67, 3);
      st.lastTime = now;
      st.humanT += 0.045 * dt;

      const mode = cameraModeRef.current;
      const o = st.orbit;
      const fps = st.fps;

      // Camera Modes
      if (mode === 'firstperson') {
        const isSprinting = inp.keys['ShiftLeft'] || inp.keys['ShiftRight'];
        const sp = (isSprinting ? 2.5 : 1.1) * dt;
        const fwdX = -Math.sin(fps.yaw);
        const fwdZ = -Math.cos(fps.yaw);
        const rgtX = Math.cos(fps.yaw);
        const rgtZ = -Math.sin(fps.yaw);

        if (inp.keys['KeyW'] || inp.keys['ArrowUp']) { fps.x += fwdX * sp; fps.z += fwdZ * sp; }
        if (inp.keys['KeyS'] || inp.keys['ArrowDown']) { fps.x -= fwdX * sp; fps.z -= fwdZ * sp; }
        if (inp.keys['KeyA'] || inp.keys['ArrowLeft']) { fps.x -= rgtX * sp; fps.z -= rgtZ * sp; }
        if (inp.keys['KeyD'] || inp.keys['ArrowRight']) { fps.x += rgtX * sp; fps.z += rgtZ * sp; }

        fps.y = 4.8; // Realistic eye level
        camera.position.set(fps.x, fps.y, fps.z);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = fps.yaw;
        camera.rotation.x = fps.pitch;

      } else if (mode === 'top') {
        const lf = 0.08 * dt;
        o.phi += (0.08 - o.phi) * lf;
        o.radius += (820 - o.radius) * lf;
        o.theta += (0 - o.theta) * lf;
        o.target.lerp(new THREE.Vector3(0, 0, -215), lf);
        camera.position.set(
          o.target.x + o.radius * Math.sin(o.phi) * Math.sin(o.theta),
          o.radius * Math.cos(o.phi),
          o.target.z + o.radius * Math.sin(o.phi) * Math.cos(o.theta)
        );
        camera.lookAt(o.target);

      } else {
        // Orbit
        const lf = 0.1 * dt;
        o.theta += (o.tTheta - o.theta) * lf;
        o.phi += (o.tPhi - o.phi) * lf;
        o.radius += (o.tRadius - o.radius) * lf;
        o.target.lerp(o.tTarget, 0.08 * dt);
        if (!inp.isDragging) {
          o.tTheta += inp.velX * 0.84;
          o.tPhi = Math.max(0.12, Math.min(1.42, o.tPhi + inp.velY * 0.84));
          inp.velX *= 0.84; inp.velY *= 0.84;
        }
        camera.position.set(
          o.target.x + o.radius * Math.sin(o.phi) * Math.sin(o.theta),
          o.target.y + o.radius * Math.cos(o.phi),
          o.target.z + o.radius * Math.sin(o.phi) * Math.cos(o.theta)
        );
        camera.lookAt(o.target);
      }

      // Human walk animation along front boulevard
      const h = st.human;
      if (h) {
        const t = st.humanT;
        h.position.x = 25 + Math.sin(t * 0.12) * 55;
        h.position.y = Math.abs(Math.sin(t * 2.5)) * 0.4;
        h.position.z = -32 + Math.cos(t * 0.09) * 12;
        const dx = Math.cos(t * 0.12) * 55 * 0.12;
        const dz = -Math.sin(t * 0.09) * 12 * 0.09;
        if (Math.abs(dx) + Math.abs(dz) > 0.005) h.rotation.y = Math.atan2(dx, dz);
      }

      // Beacons animation
      st.beacons.forEach(b => { b.rotation.y += 0.025 * dt; });

      renderer.render(scene, camera);

      // Screen-Space Floating 3D Building Labels
      const width = container.clientWidth;
      const height = container.clientHeight;
      const projVec = new THREE.Vector3();

      if (mode === 'firstperson') {
        CAMPUS_BLOCKS.forEach(b => {
          const el = labelDomsRef.current[b.id];
          if (el) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
          }
        });
      } else {
        CAMPUS_BLOCKS.forEach(b => {
          if (b.id === 'gate') return;
          const el = labelDomsRef.current[b.id];
          if (!el) return;
          projVec.set(b.x, b.h + b.beaconOffsetY + 3, b.z);
          projVec.project(camera);

          if (projVec.z >= 1.0 || projVec.x < -1.15 || projVec.x > 1.15 || projVec.y < -1.15 || projVec.y > 1.15) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
          } else {
            const sx = ((projVec.x + 1) / 2) * width;
            const sy = ((-projVec.y + 1) / 2) * height;
            el.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -100%)`;
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
          }
        });
      }
    };
    st.rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(st.rafId);
      if (inp.pointerLocked) document.exitPointerLock();
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('click', onCanvasClick);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onKeyEscape);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Beacons update
  useEffect(() => {
    const st = stateRef.current;
    if (!st.scene) return;
    st.beacons.forEach(b => st.scene.remove(b));
    st.beacons = [];
    clusters.forEach(cluster => {
      const block = CAMPUS_BLOCKS.find(b => b.id === cluster.blockId);
      if (!block) return;
      const beacon = new THREE.Mesh(
        new THREE.OctahedronGeometry(5.5, 0),
        new THREE.MeshLambertMaterial({
          color: new THREE.Color(cluster.heat.color),
          emissive: new THREE.Color(cluster.heat.color).multiplyScalar(0.5),
          transparent: true,
          opacity: 0.9
        })
      );
      beacon.position.set(block.x, block.h + block.beaconOffsetY, block.z);
      beacon.userData = { blockId: block.id };
      st.scene.add(beacon);
      st.beacons.push(beacon);
    });
  }, [clusters]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
      <div ref={mountRef} className="absolute inset-0" />

      {/* Screen-space Floating 3D Building Labels with Smart Decluttering */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
        {CAMPUS_BLOCKS.filter(b => b.id !== 'gate').map(block => {
          const cluster = clusters.find(c => c.blockId === block.id);
          const qCount = cluster?.totalQueries || 0;
          const heat = cluster?.heat;
          return (
            <div
              key={block.id}
              ref={el => { labelDomsRef.current[block.id] = el; }}
              onClick={() => onBuildingClick?.(block.id)}
              className="absolute top-0 left-0 transition-opacity duration-150 cursor-pointer select-none group pointer-events-auto"
              style={{ opacity: 0, willChange: 'transform' }}
            >
              {qCount > 0 ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200/90 group-hover:scale-105 group-hover:shadow-xl transition-all">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: block.accentColor }} />
                  <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">{block.shortName}</span>
                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap hidden sm:inline max-w-[120px] truncate">
                    {block.name.split(' ')[0]}
                  </span>
                  <span
                    className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold text-white shadow-sm flex items-center justify-center min-w-[16px]"
                    style={{ background: heat?.color || '#0ea5e9' }}
                  >
                    {qCount}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center px-1.5 py-0.5 rounded-full bg-white/85 backdrop-blur-md shadow-sm border border-slate-200/80 group-hover:px-2.5 group-hover:scale-105 group-hover:shadow-md transition-all">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: block.accentColor }} />
                  <span className="ml-1 text-[10px] font-semibold text-slate-600 whitespace-nowrap">{block.shortName}</span>
                </div>
              )}
              <div className="w-1.5 h-1.5 bg-white border-r border-b border-slate-300 mx-auto rotate-45 -mt-0.5" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
