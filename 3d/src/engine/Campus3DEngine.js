import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { CAMPUS_BLOCKS, getHeatTier } from '../data/campusData';

// ─── Constants ────────────────────────────────────────────────────────────────
const CAMPUS_SCALE = 1;          // 1 world unit = 1 campus unit
const FPS_MOVE_SPEED = 0.35;     // First-person move speed
const ORBIT_DAMPING   = 0.85;    // Orbit inertia

// ─── Build one campus building with windows + roof details ────────────────────
function buildBuilding(block) {
  const group = new THREE.Group();
  group.userData = { blockId: block.id, blockData: block };

  const { w, d, h } = block;

  // ── MAIN STRUCTURE ──
  const bodyGeo = new THREE.BoxGeometry(w, h, d);
  const bodyMat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(block.wallColor),
    emissive: new THREE.Color(block.wallColor).multiplyScalar(0.04)
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  body.userData = { blockId: block.id, part: 'body' };
  group.add(body);

  // ── ROOF SLAB ──
  const roofH = 2.5;
  const roofGeo = new THREE.BoxGeometry(w + 1.5, roofH, d + 1.5);
  const roofMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(block.roofColor) });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = h + roofH / 2;
  roof.castShadow = true;
  group.add(roof);

  // ── ROOF PARAPET + WATER TANK (accent detail) ──
  if (block.floors >= 4) {
    const tankGeo = new THREE.BoxGeometry(8, 6, 8);
    const tankMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(block.accentColor).multiplyScalar(0.7) });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(w * 0.2, h + roofH + 3, d * 0.2);
    group.add(tank);
  }

  // ── ACCENT STRIPE (horizontal band — floor separator) ──
  const stripeH = 1.8;
  for (let f = 1; f < block.floors; f++) {
    const floorY = (h / block.floors) * f;
    const stripeGeo = new THREE.BoxGeometry(w + 0.2, stripeH, d + 0.2);
    const stripeMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(block.accentColor).lerp(new THREE.Color('#ffffff'), 0.5)
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = floorY + stripeH / 2;
    group.add(stripe);
  }

  // ── WINDOWS (front face, Z+ face) ──
  const windowCols = Math.max(2, Math.floor(w / 14));
  const windowRows = block.floors;
  const winW = 7, winH = 6;
  const colGap = w / (windowCols + 1);
  const rowGap = h / (windowRows + 1);

  for (let r = 0; r < windowRows; r++) {
    for (let c = 0; c < windowCols; c++) {
      const winGeo = new THREE.BoxGeometry(winW, winH, 0.5);
      const winMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(block.windowColor),
        transparent: true, opacity: 0.85,
        emissive: new THREE.Color(block.windowColor).multiplyScalar(0.1)
      });
      const win = new THREE.Mesh(winGeo, winMat);
      const wx = -w / 2 + colGap * (c + 1);
      const wy = rowGap * (r + 1);
      win.position.set(wx, wy, d / 2 + 0.2);
      group.add(win);

      // Frame
      const frmGeo = new THREE.EdgesGeometry(winGeo);
      const frmMat = new THREE.LineBasicMaterial({ color: new THREE.Color(block.frameColor), linewidth: 1 });
      const frm = new THREE.LineSegments(frmGeo, frmMat);
      frm.position.copy(win.position);
      group.add(frm);
    }
  }

  // ── BUILDING ENTRANCE PORCH ──
  const porchGeo = new THREE.BoxGeometry(w * 0.35, 5, 6);
  const porchMat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(block.accentColor).lerp(new THREE.Color('#ffffff'), 0.6)
  });
  const porch = new THREE.Mesh(porchGeo, porchMat);
  porch.position.set(0, 2.5, d / 2 + 3);
  group.add(porch);

  // ── PILLAR ACCENTS AT ENTRANCE ──
  [-1, 1].forEach(side => {
    const pilGeo = new THREE.CylinderGeometry(1.2, 1.2, 8, 6);
    const pilMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(block.frameColor).lerp(new THREE.Color('#ffffff'), 0.7)
    });
    const pil = new THREE.Mesh(pilGeo, pilMat);
    pil.position.set(side * (w * 0.18), 4, d / 2 + 6);
    group.add(pil);
  });

  group.position.set(block.x * CAMPUS_SCALE, 0, block.z * CAMPUS_SCALE);
  return group;
}

// ─── Low-poly human figure ────────────────────────────────────────────────────
function buildHumanFigure() {
  const group = new THREE.Group();
  const skin  = new THREE.MeshLambertMaterial({ color: '#f4a261' });
  const shirt = new THREE.MeshLambertMaterial({ color: '#0ea5e9' });
  const pants = new THREE.MeshLambertMaterial({ color: '#1e3a5f' });
  const shoe  = new THREE.MeshLambertMaterial({ color: '#1a1a2e' });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(2, 6, 5), skin);
  head.position.y = 14;
  group.add(head);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 2), shirt);
  torso.position.y = 9;
  group.add(torso);

  // Legs
  [[-1, 0], [1, 0]].forEach(([x]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5, 1.6), pants);
    leg.position.set(x * 1.1, 4, 0);
    group.add(leg);
  });

  // Arms
  [[-1, 0], [1, 0]].forEach(([x]) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5, 1.2), shirt);
    arm.position.set(x * 3.1, 9, 0);
    group.add(arm);
  });

  // Shoes
  [[-1, 0], [1, 0]].forEach(([x]) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 2.8), shoe);
    s.position.set(x * 1.1, 1.2, 0.3);
    group.add(s);
  });

  group.userData.isHuman = true;
  return group;
}

// ─── Build trees (low-poly) ───────────────────────────────────────────────────
function buildTree(x, z, scale = 1) {
  const g = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(1 * scale, 1.4 * scale, 7 * scale, 5);
  const trunkMat = new THREE.MeshLambertMaterial({ color: '#7c4a1e' });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 3.5 * scale;
  g.add(trunk);

  // 3 stacked cones
  [[0, 14, 9], [0, 10, 7], [0, 7, 5.5]].forEach(([dy, h, r], i) => {
    const cGeo = new THREE.ConeGeometry(r * scale, h * scale, 6);
    const cMat = new THREE.MeshLambertMaterial({
      color: i === 0 ? '#15803d' : i === 1 ? '#16a34a' : '#22c55e'
    });
    const cone = new THREE.Mesh(cGeo, cMat);
    cone.position.y = (7 + dy + h / 2) * scale;
    cone.castShadow = true;
    g.add(cone);
  });

  g.position.set(x, 0, z);
  return g;
}

// ─── Campus3DScene Component ──────────────────────────────────────────────────
export default function Campus3DScene({
  clusters,
  onBuildingClick,
  cameraMode,         // 'orbit' | 'firstperson' | 'top'
  selectedFilter
}) {
  const mountRef    = useRef(null);
  const sceneRef    = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef   = useRef(null);
  const animFrameRef = useRef(null);
  const labelStateRef = useRef({ labels: [], rafPending: false });
  const inputRef    = useRef({
    // Orbit
    isDragging: false, lastX: 0, lastY: 0,
    velX: 0, velY: 0,
    // FPS
    keys: {}, pointerLocked: false,
    // Touch
    lastTouchDist: 0, lastTouchX: 0, lastTouchY: 0
  });
  const humanRef    = useRef(null);
  const buildingsRef = useRef([]);
  const beaconsRef   = useRef([]);
  const orbitRef    = useRef({ theta: Math.PI * 0.22, phi: 0.72, radius: 420, targetTheta: Math.PI * 0.22, targetPhi: 0.72, targetRadius: 420 });
  const fpsRef      = useRef({ x: 40, z: 60, yaw: -Math.PI * 0.6, pitch: 0 });
  const labelCallbackRef = useRef(null);

  // ── Init Three.js scene ──────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor('#bfdbfe');   // Sky blue (day)
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Camera (perspective)
    const cam = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.5, 2000);
    cameraRef.current = cam;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#dbeafe', 0.0008);
    sceneRef.current = scene;

    // ── LIGHTING (day) ──
    const ambientLight = new THREE.AmbientLight('#e0f2fe', 0.9);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight('#fff7ed', 2.2);
    sun.position.set(200, 350, 100);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 50;
    sun.shadow.camera.far = 1200;
    sun.shadow.camera.left = -400;
    sun.shadow.camera.right = 400;
    sun.shadow.camera.top = 400;
    sun.shadow.camera.bottom = -400;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    const fillLight = new THREE.HemisphereLight('#bfdbfe', '#d1fae5', 0.5);
    scene.add(fillLight);

    const bounceLight = new THREE.DirectionalLight('#fde68a', 0.4);
    bounceLight.position.set(-100, 50, -100);
    scene.add(bounceLight);

    // ── GROUND (campus green area) ──
    const groundGeo = new THREE.PlaneGeometry(800, 700, 30, 30);
    const groundMat = new THREE.MeshLambertMaterial({ color: '#86efac' });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = -0.1;
    scene.add(ground);

    // Concrete paths — main axis
    const pathMat = new THREE.MeshLambertMaterial({ color: '#e2e8f0' });
    [
      [0, 0, 0, 700, 10],       // East-West main path
      [0, 0, 800, 0, 10]        // North-South
    ].forEach(([cx, cz, pw, ph]) => {
      const path = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), pathMat);
      path.rotation.x = -Math.PI / 2;
      path.position.set(cx, 0.05, cz);
      scene.add(path);
    });

    // Cross paths
    const crossPaths = [
      [-60, 0, 15, 140],
      [40, 0, 15, 200],
      [130, 0, 15, 120]
    ];
    crossPaths.forEach(([cx, cz, pw, pd]) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), pathMat);
      p.rotation.x = -Math.PI / 2;
      p.position.set(cx, 0.05, cz);
      scene.add(p);
    });

    // ── BUILDINGS ──
    buildingsRef.current = [];
    CAMPUS_BLOCKS.forEach(block => {
      const bGroup = buildBuilding(block);
      scene.add(bGroup);
      buildingsRef.current.push(bGroup);
    });

    // ── TREES (sprinkle around campus) ──
    const treePositions = [
      [-10, -50, 1.2], [-30, -60, 1], [-50, -50, 1.1],
      [-30, 0, 1.3],   [-10, 10, 1],  [30, -60, 1.2],
      [30, -45, 1],    [70, -55, 1.1], [100, -55, 1],
      [115, 80, 1.2],  [125, 60, 1],   [-50, 55, 1.2],
      [-60, 15, 1],    [-100, 55, 1.1], [-100, -5, 1.2],
      [10, 45, 1],     [180, 50, 1.3], [185, -30, 1],
      [20, -8, 0.8],   [45, -8, 0.8],  [70, -8, 0.8]
    ];
    treePositions.forEach(([x, z, scale]) => scene.add(buildTree(x, z, scale)));

    // ── HUMAN FIGURE ──
    const human = buildHumanFigure();
    human.position.set(40, 0, -8);
    human.scale.setScalar(0.8);
    scene.add(human);
    humanRef.current = human;

    // ── BEACON SPHERES (heat indicators) — updated per render ──
    beaconsRef.current = [];   // Filled in updateBeacons()

    // ── RESIZE HANDLER ──
    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── INPUT: orbit drag + FPS pointer-lock mouse look ──
    const inp = inputRef.current;

    // cameraMode ref — avoids stale closure inside animate()
    const cameraModeRef = { current: cameraMode };
    // We store it on inp so animate() can read it
    inp.cameraModeRef = cameraModeRef;

    const MOUSE_SENSITIVITY = 0.0022;

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (inp.cameraModeRef.current === 'firstperson') {
        // Request pointer lock for FPS look
        renderer.domElement.requestPointerLock();
        return;
      }
      inp.isDragging = true;
      inp.lastX = e.clientX;
      inp.lastY = e.clientY;
      inp.velX = 0; inp.velY = 0;
    };

    const onMouseMove = (e) => {
      if (inp.cameraModeRef.current === 'firstperson' && inp.pointerLocked) {
        // Raw mouse delta — no clientX/Y needed with pointer lock
        const dx = e.movementX || 0;
        const dy = e.movementY || 0;
        const fps = fpsRef.current;
        fps.yaw   -= dx * MOUSE_SENSITIVITY;
        fps.pitch -= dy * MOUSE_SENSITIVITY;
        // Pitch clamped so camera never flips
        fps.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, fps.pitch));
        return;
      }
      if (!inp.isDragging) return;
      const dx = e.clientX - inp.lastX;
      const dy = e.clientY - inp.lastY;
      inp.lastX = e.clientX;
      inp.lastY = e.clientY;
      inp.velX = dx * 0.004;
      inp.velY = dy * 0.003;
      const orb = orbitRef.current;
      orb.targetTheta -= dx * 0.006;
      orb.targetPhi = Math.max(0.12, Math.min(1.45, orb.targetPhi + dy * 0.005));
    };
    const onMouseUp = () => { inp.isDragging = false; };
    const onWheel = (e) => {
      if (inp.cameraModeRef.current === 'firstperson') return;
      const orb = orbitRef.current;
      orb.targetRadius = Math.max(60, Math.min(800, orb.targetRadius + e.deltaY * 0.4));
      e.preventDefault();
    };

    // Pointer lock change/error
    const onPointerLockChange = () => {
      inp.pointerLocked = document.pointerLockElement === renderer.domElement;
    };
    const onPointerLockError = () => { inp.pointerLocked = false; };
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);

    // Click detection for building selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onCanvasClick = (e) => {
      if (inp.cameraModeRef.current === 'firstperson') return; // no building pick in FPS
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cam);
      const meshes = [];
      buildingsRef.current.forEach(bg => bg.traverse(c => { if (c.isMesh) meshes.push(c); }));
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length) {
        let obj = hits[0].object;
        while (obj && !obj.userData?.blockId) obj = obj.parent;
        if (obj?.userData?.blockId) {
          onBuildingClick?.(obj.userData.blockId);
          const block = CAMPUS_BLOCKS.find(b => b.id === obj.userData.blockId);
          if (block) {
            const dx = block.x - 0, dz = block.z - 0;
            const angle = Math.atan2(dx, dz);
            orbitRef.current.targetTheta = angle + Math.PI * 0.4;
            orbitRef.current.targetRadius = 280;
          }
        }
      }
    };

    // Touch support
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        inp.isDragging = true;
        inp.lastTouchX = e.touches[0].clientX;
        inp.lastTouchY = e.touches[0].clientY;
        inp.velX = 0; inp.velY = 0;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        inp.lastTouchDist = Math.sqrt(dx*dx + dy*dy);
      }
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && inp.isDragging) {
        const dx = e.touches[0].clientX - inp.lastTouchX;
        const dy = e.touches[0].clientY - inp.lastTouchY;
        inp.lastTouchX = e.touches[0].clientX;
        inp.lastTouchY = e.touches[0].clientY;
        inp.velX = dx * 0.004;
        inp.velY = dy * 0.003;
        const orb = orbitRef.current;
        orb.targetTheta -= dx * 0.008;
        orb.targetPhi = Math.max(0.12, Math.min(1.45, orb.targetPhi + dy * 0.006));
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const delta = inp.lastTouchDist - dist;
        orbitRef.current.targetRadius = Math.max(60, Math.min(800, orbitRef.current.targetRadius + delta * 0.8));
        inp.lastTouchDist = dist;
      }
    };
    const onTouchEnd = () => { inp.isDragging = false; };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('click', onCanvasClick);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    // FPS keyboard
    const onKeyDown = (e) => {
      inp.keys[e.code] = true;
      // Esc releases pointer lock
      if (e.code === 'Escape' && inp.pointerLocked) {
        document.exitPointerLock();
      }
    };
    const onKeyUp   = (e) => { inp.keys[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // ── Animate human walk cycle ──
    let humanT = 0;

    // ── Main render loop ──
    let lastTime = performance.now();
    const animate = (now) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;

      const orb = orbitRef.current;
      const fps = fpsRef.current;
      const mode = inp.cameraModeRef ? inp.cameraModeRef.current : cameraMode;

      // ── Camera update ──
      if (mode === 'firstperson') {
        // ── Pointer-lock mouse look ─────────────────────────────────────
        // Pitch clamped to ±60° so camera NEVER flips upside down
        const PITCH_MIN = -Math.PI / 3;   // -60°
        const PITCH_MAX =  Math.PI / 3;   //  60°

        // ── Keyboard movement ──────────────────────────────────────────
        const sp = (inp.keys['ShiftLeft'] || inp.keys['ShiftRight'] ? 1.8 : 1.0) * FPS_MOVE_SPEED * dt;
        const sinY = Math.sin(fps.yaw);
        const cosY = Math.cos(fps.yaw);

        let nx = fps.x;
        let nz = fps.z;

        if (inp.keys['KeyW'] || inp.keys['ArrowUp'])    { nx += sinY * sp; nz += cosY * sp; }
        if (inp.keys['KeyS'] || inp.keys['ArrowDown'])  { nx -= sinY * sp; nz -= cosY * sp; }
        if (inp.keys['KeyA'] || inp.keys['ArrowLeft'])  { nx -= cosY * sp; nz += sinY * sp; }
        if (inp.keys['KeyD'] || inp.keys['ArrowRight']) { nx += cosY * sp; nz -= sinY * sp; }

        // ── Campus boundary clamp (stay on campus ground) ─────────────
        const BOUND_X = 340, BOUND_Z = 300;
        fps.x = Math.max(-BOUND_X, Math.min(BOUND_X, nx));
        fps.z = Math.max(-BOUND_Z, Math.min(BOUND_Z, nz));

        // ── Building collision (simple AABB cylinder test) ─────────────
        const PLAYER_R = 10;
        for (const bGroup of buildingsRef.current) {
          const bd = bGroup.userData.blockData;
          if (!bd) continue;
          const bx = bd.x, bz = bd.z;
          const hw = bd.w / 2 + PLAYER_R, hd = bd.d / 2 + PLAYER_R;
          if (fps.x > bx - hw && fps.x < bx + hw &&
              fps.z > bz - hd && fps.z < bz + hd) {
            // push out on nearest axis
            const ox = fps.x - bx, oz = fps.z - bz;
            const px = hw - Math.abs(ox), pz = hd - Math.abs(oz);
            if (px < pz) fps.x += Math.sign(ox) * px;
            else         fps.z += Math.sign(oz) * pz;
          }
        }

        // ── Apply camera ───────────────────────────────────────────────
        fps.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, fps.pitch));
        cam.position.set(fps.x, 20, fps.z);
        cam.rotation.order = 'YXZ';
        cam.rotation.y = fps.yaw;
        cam.rotation.x = fps.pitch;
      } else if (mode === 'top') {
        // Top-down view
        const lerpF = 0.06 * dt;
        orb.theta = orb.theta + (0 - orb.theta) * lerpF;
        orb.phi   = orb.phi   + (0.18 - orb.phi) * lerpF;
        orb.radius= orb.radius+ (650 - orb.radius)* lerpF;
        const tgt = new THREE.Vector3(0, 0, 30);
        cam.position.set(
          tgt.x + orb.radius * Math.sin(orb.phi) * Math.sin(orb.theta),
          tgt.y + orb.radius * Math.cos(orb.phi),
          tgt.z + orb.radius * Math.sin(orb.phi) * Math.cos(orb.theta)
        );
        cam.lookAt(tgt);
      } else {
        // Orbit mode — smooth lerp with inertia
        const lerpF = 0.1 * dt;
        orb.theta  += (orb.targetTheta  - orb.theta)  * lerpF;
        orb.phi    += (orb.targetPhi    - orb.phi)    * lerpF;
        orb.radius += (orb.targetRadius - orb.radius) * lerpF;

        // Apply inertia after mouse release
        if (!inp.isDragging) {
          orb.targetTheta += inp.velX * ORBIT_DAMPING;
          orb.targetPhi = Math.max(0.12, Math.min(1.45, orb.targetPhi + inp.velY * ORBIT_DAMPING));
          inp.velX *= ORBIT_DAMPING;
          inp.velY *= ORBIT_DAMPING;
        }

        const tgt = new THREE.Vector3(0, 8, 30);
        cam.position.set(
          tgt.x + orb.radius * Math.sin(orb.phi) * Math.sin(orb.theta),
          tgt.y + orb.radius * Math.cos(orb.phi),
          tgt.z + orb.radius * Math.sin(orb.phi) * Math.cos(orb.theta)
        );
        cam.lookAt(tgt);
      }

      // ── Animate human figure ──
      humanT += 0.05 * dt;
      if (humanRef.current) {
        const human = humanRef.current;
        // Bobbing walk
        human.position.y = Math.sin(humanT * 2) * 0.8;
        // Slow stroll along path
        human.position.x = 40 + Math.sin(humanT * 0.18) * 30;
        human.position.z = -8 + Math.cos(humanT * 0.14) * 15;
        // Face direction of travel
        const dx = Math.cos(humanT * 0.18) * 30 * 0.18;
        const dz = -Math.sin(humanT * 0.14) * 15 * 0.14;
        if (Math.abs(dx) + Math.abs(dz) > 0.01) {
          human.rotation.y = Math.atan2(dx, dz);
        }
      }

      // ── Beacon pulse (already CSS animated but we spin them slowly) ──
      beaconsRef.current.forEach((b, i) => {
        b.rotation.y = humanT * 0.4 + i * 0.5;
      });

      // ── Trigger label update (throttled to rAF) ──
      if (labelCallbackRef.current) {
        labelCallbackRef.current(cam, renderer);
      }

      renderer.render(scene, cam);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
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
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('pointerlockerror', onPointerLockError);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync cameraMode prop → ref so animate() always reads current value ────────
  useEffect(() => {
    if (inputRef.current.cameraModeRef) {
      inputRef.current.cameraModeRef.current = cameraMode;
    }
    // When leaving FPS mode, release pointer lock
    if (cameraMode !== 'firstperson' && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [cameraMode]);

  // ── Update beacons when clusters change ──────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;
    // Remove old beacons
    beaconsRef.current.forEach(b => sceneRef.current.remove(b));
    beaconsRef.current = [];

    clusters.forEach(cluster => {
      const block = CAMPUS_BLOCKS.find(b => b.id === cluster.blockId);
      if (!block) return;
      const heat = cluster.heat;
      const beaconGeo = new THREE.OctahedronGeometry(5, 0);
      const beaconMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(heat.color),
        emissive: new THREE.Color(heat.color).multiplyScalar(0.6),
        transparent: true, opacity: 0.9
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(
        block.x * CAMPUS_SCALE,
        block.h + block.beaconOffsetY,
        block.z * CAMPUS_SCALE
      );
      beacon.userData = { blockId: block.id, isBeacon: true };
      sceneRef.current.add(beacon);
      beaconsRef.current.push(beacon);
    });
  }, [clusters]);

  // ── Register label update callback ───────────────────────────────────────────
  const registerLabelCallback = useCallback((cb) => {
    labelCallbackRef.current = cb;
  }, []);

  // Expose project3D helper for labels
  return { mountRef, registerLabelCallback, cameraRef, rendererRef, sceneRef };
}
