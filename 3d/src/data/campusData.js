/**
 * ABES Engineering College — Verified Campus 3D Layout Data
 * Aligned with user-verified on-ground specifications:
 *
 * FRONT ROW (Facing Gate 1 / South NH-09):
 * - Left: Bhabha Block (3 Floors, Admin & Central Library)
 * - Right: Aryabhata Block (3 Floors, CSE & IT)
 * - Center: Arched Colonnade + Circular Glass Stair Tower + Paved Sitting Quadrangle
 *
 * ENTRANCE & FRONT AMENITIES:
 * - South Gate: Main Gate 1 (3-Dome Arched Security Entrance on NH-09)
 * - Center: Circular Grilling & Nescafe Corner (Round brick seating with railing & tree)
 * - Right of Gate: Campus Mandir (Temple Sanctum)
 * - Left of Gate: Cafes Hub (2-Floor Building with Tea Man's, Starbean, eateries)
 *
 * CENTRAL ACADEMIC ROW (Behind Front Row):
 * - Left: Ramanujan Block (3 Floors, connected to Bhabha Block via enclosed bridge)
 * - Center: Kalpana Chawla Block (6 Floors, TALLEST building on campus, 1st Year & CRC)
 * - Right: ABES Business School & Auditorium (4 Floors, houses Dr. Radhakrishnan Auditorium)
 *
 * SPORTS & ATHLETICS (Ahead of Academic Core):
 * - Center: Large Floodlit Cricket Stadium (Full-size pitch, boundary, floodlights, pavilion)
 *
 * REAR CAMPUS (Behind Cricket Ground):
 * - Swimming Pool (Half-Olympic pool, ahead of hostels)
 * - West of Pool: Vidushi Bhawan (Girls Hostel Complex, gated quadrangle)
 * - East/North of Ground: Dayanand Bhawan (Boys 2nd Yr, Solar Roof) & Vivekanand Bhawan (Boys 1st Yr)
 * - Rear: Elevated ABES Water Tank
 */

export const CAMPUS_BLOCKS = [

  // ──────────────────────────────────────────────────────────────────────────
  // ENTRANCE & FRONT PLAZA AMENITIES
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'cafes_block',
    name: 'Campus Cafes & Eateries Hub',
    shortName: 'CF',
    code: 'CF-01',
    subtitle: "Tea Man's, Starbean & Food Outlets — 2 Floors",
    category: 'facility',
    floors: 2,
    x: -70, z: 12,
    w: 36, d: 24, h: 22,
    wallColor:   '#fef3c7',   // Warm cream cafe facade
    accentColor: '#d97706',   // Amber accent
    roofColor:   '#fde68a',
    windowColor: '#fcd34d',
    frameColor:  '#92400e',
    beaconOffsetY: 12,
    floors_data: [
      { f: 0, rooms: ["Tea Man's Cafe", 'Starbean Espresso Bar', 'Indian Juices & Shakes', 'Outdoor Seating Deck'] },
      { f: 1, rooms: ['Snack Lounge', 'Student Discussion Gallery', 'Terrace View Seating'] }
    ],
    description: 'Two-storey cafe complex on the left of main entrance. Casual dining, espresso bar, juice corner, and shaded outdoor deck.'
  },

  {
    id: 'nescafe_corner',
    name: 'Nescafe Corner & Circular Plaza',
    shortName: 'NC',
    code: 'NC-00',
    subtitle: 'Round Grilling Seating & Amaltas Tree Kiosk',
    category: 'facility',
    floors: 1,
    x: 0, z: 12,
    w: 24, d: 24, h: 10,
    wallColor:   '#b91c1c',   // Classic Nescafe Red
    accentColor: '#ef4444',
    roofColor:   '#fef2f2',
    windowColor: '#fca5a5',
    frameColor:  '#7f1d1d',
    beaconOffsetY: 8,
    floors_data: [
      { f: 0, rooms: ['Nescafe Brew Kiosk', 'Circular Brick Tree Bench', 'Round Metal Grilling', 'Open Plaza'] }
    ],
    description: 'Iconic round grilling seating plaza surrounding shady Amaltas tree with Nescafe coffee kiosk right in the center walk.'
  },

  {
    id: 'temple',
    name: 'Campus Temple (Mandir)',
    shortName: 'TM',
    code: 'TM-01',
    subtitle: 'Prayer & Meditation Sanctum',
    category: 'facility',
    floors: 1,
    x: 70, z: 12,
    w: 20, d: 20, h: 18,
    wallColor:   '#ffffff',   // White marble
    accentColor: '#f59e0b',   // Golden saffron
    roofColor:   '#fef08a',
    windowColor: '#fde047',
    frameColor:  '#b45309',
    beaconOffsetY: 10,
    floors_data: [
      { f: 0, rooms: ['Sanctum Sanctorum', 'Marble Pradakshina Path', 'Meditation Lawn', 'Brass Bell Portico'] }
    ],
    description: 'Campus temple on the right upon entering Main Gate. Serene white marble shrine with stepped plinth and brass spire.'
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FRONT ROW — Highway facing, 3 Floors, arched colonnade, wide spacing
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'bhabha',
    name: 'Bhabha Block',
    shortName: 'BB',
    code: 'BB-02',
    subtitle: 'Admin & Central Library — 3 Floors',
    category: 'academic',
    floors: 3,
    x: -70, z: -55,
    w: 54, d: 34, h: 36,
    wallColor:   '#f8fafc',   // Off-white cream
    accentColor: '#475569',   // Slate
    roofColor:   '#e2e8f0',
    windowColor: '#93c5fd',   // Sky-tinted glass
    frameColor:  '#334155',
    beaconOffsetY: 14,
    floors_data: [
      { f: 0, rooms: ['Director Office', 'Registrar Desk', 'Accounts Wing', 'Arched Colonnade Promenade'] },
      { f: 1, rooms: ['Central Library Reading Hall (250 Seats)', 'Stack Section', 'Digital Reference Hub'] },
      { f: 2, rooms: ['Dean Academics', 'Examination Cell', 'Faculty Lounge', 'Conference Room A'] }
    ],
    description: 'Front-left academic wing facing NH-09. Arched colonnade on ground floor. Houses administration and 112,000+ volume Central Library. Connected to Ramanujan Block behind.'
  },

  {
    id: 'stair_tower',
    name: 'Circular Staircase Tower & Courtyard',
    shortName: 'ST',
    code: 'ST-00',
    subtitle: 'Glass Stairwell Connector & Sitting Area',
    category: 'academic',
    floors: 3,
    x: 0, z: -55,
    w: 18, d: 18, h: 36,
    wallColor:   '#f1f5f9',
    accentColor: '#0ea5e9',
    roofColor:   '#cbd5e1',
    windowColor: '#38bdf8',   // Glass facade
    frameColor:  '#0369a1',
    beaconOffsetY: 12,
    floors_data: [
      { f: 0, rooms: ['Central Covered Colonnade', 'Courtyard Sitting Area', 'Garden Benches'] },
      { f: 1, rooms: ['1st Floor Connecting Walkway'] },
      { f: 2, rooms: ['2nd Floor Panoramic Landing'] }
    ],
    description: 'Iconic circular glass staircase tower connecting Bhabha and Aryabhata blocks with central paved seating quadrangle.'
  },

  {
    id: 'aryabhata',
    name: 'Aryabhata Block',
    shortName: 'AB',
    code: 'AB-01',
    subtitle: 'CSE & IT Department — 3 Floors',
    category: 'academic',
    floors: 3,
    x: 70, z: -55,
    w: 54, d: 34, h: 36,
    wallColor:   '#f8fafc',   // Off-white cream
    accentColor: '#3b82f6',   // Blue accent
    roofColor:   '#e2e8f0',
    windowColor: '#93c5fd',
    frameColor:  '#1d4ed8',
    beaconOffsetY: 14,
    floors_data: [
      { f: 0, rooms: ['CSE Reception', 'HOD Computer Science', 'Server Room', 'Arched Colonnade'] },
      { f: 1, rooms: ['LH-101', 'LH-102', 'Data Structures Lab', 'Programming Lab 1 & 2'] },
      { f: 2, rooms: ['AI & ML Center', 'Cyber Range Lab', 'Cloud Computing Hub', 'Seminar Hall 1'] }
    ],
    description: 'Front-right academic wing facing NH-09. Arched colonnade on ground floor. Hub of Computer Science & Engineering and Information Technology.'
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CENTRAL ACADEMIC ROW (Behind front blocks)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'ramanujan',
    name: 'Ramanujan Block',
    shortName: 'RMJ',
    code: 'RMJ-03',
    subtitle: 'ECE, EE & Mechanical Labs — 3 Floors',
    category: 'academic',
    floors: 3,
    x: -70, z: -135,
    w: 52, d: 34, h: 36,
    wallColor:   '#f1f5f9',
    accentColor: '#64748b',
    roofColor:   '#e2e8f0',
    windowColor: '#94a3b8',
    frameColor:  '#334155',
    beaconOffsetY: 14,
    floors_data: [
      { f: 0, rooms: ['Heavy Machining Lab', 'Workshop Bay', 'Connecting Bridge to Bhabha Block'] },
      { f: 1, rooms: ['Digital Signal Processing Lab', 'Analog Electronics Lab', 'LH-201'] },
      { f: 2, rooms: ['Power Systems Lab', 'Robotics Arena', 'Faculty Cabins'] }
    ],
    description: 'Academic block situated directly behind Bhabha on the left, connected via covered corridor bridge. Houses engineering labs and workshops.'
  },

  {
    id: 'kalpana',
    name: 'Kalpana Chawla Block',
    shortName: 'KC',
    code: 'KC-06',
    subtitle: '1st Year & Placement CRC — 6 Floors (Tallest)',
    category: 'academic',
    floors: 6,
    x: 0, z: -135,
    w: 56, d: 38, h: 72,    // Tallest building (6 floors)
    wallColor:   '#e2e8f0',   // Contemporary grey-white
    accentColor: '#6366f1',   // Indigo accent
    roofColor:   '#94a3b8',
    windowColor: '#818cf8',   // Blue/violet glass grid
    frameColor:  '#312e81',
    beaconOffsetY: 22,
    floors_data: [
      { f: 0, rooms: ['1st Year Dean', 'Central Atrium', 'Physics Dark Room', 'Drawing Hall 1'] },
      { f: 1, rooms: ['Corporate Resource Centre (CRC)', 'Placement Interview Rooms', 'Language Lab'] },
      { f: 2, rooms: ['LH-301 to LH-306', 'Applied Mathematics Dept', 'Chemistry Lab'] },
      { f: 3, rooms: ['LH-401 to LH-406', 'Applied Sciences Faculty Offices'] },
      { f: 4, rooms: ['Innovation & Incubation Center', 'Student Startup Hub'] },
      { f: 5, rooms: ['Executive Conference Hall', 'Rooftop Antenna & Weather Station'] }
    ],
    description: 'The landmark tallest 6-floor academic building in the center of campus. Accommodates 1st-year humanities, Applied Sciences, and corporate placement headquarters.'
  },

  {
    id: 'business_school',
    name: 'ABES Business School & Auditorium',
    shortName: 'BS',
    code: 'BS-04',
    subtitle: 'Dr. Radhakrishnan Audi & MBA — 4 Floors',
    category: 'academic',
    floors: 4,
    x: 70, z: -135,
    w: 54, d: 38, h: 50,    // 4 floors with higher ceilings for auditorium
    wallColor:   '#f8fafc',
    accentColor: '#8b5cf6',   // Purple accent
    roofColor:   '#ddd6fe',
    windowColor: '#a78bfa',
    frameColor:  '#5b21b6',
    beaconOffsetY: 16,
    floors_data: [
      { f: 0, rooms: ['Dr. S. Radhakrishnan Auditorium (500 Seats)', 'Stage Control', 'VIP Green Room'] },
      { f: 1, rooms: ['Management Department HOD', 'Case Study Room 1', 'Seminar Hall 2'] },
      { f: 2, rooms: ['MBA Classrooms M-201 to M-206', 'Finance Simulation Lab'] },
      { f: 3, rooms: ['MCA Advanced Labs', 'Faculty Cabins', 'Terrace Garden'] }
    ],
    description: 'Situated on the right of Kalpana Chawla Block. 4 floors, housing the prestigious 500-seat Dr. Sarvepalli Radhakrishnan Auditorium, MBA, and MCA departments.'
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SPORTS & FITNESS ARENA (Center campus, ahead of academic blocks)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'sports',
    name: 'ABES Floodlit Cricket Stadium',
    shortName: 'CS',
    code: 'CS-01',
    subtitle: 'Championship Turf Ground & Floodlights',
    category: 'sports',
    floors: 1,
    x: 0, z: -275,
    w: 150, d: 110, h: 8,
    wallColor:   '#dcfce7',
    accentColor: '#16a34a',
    roofColor:   '#86efac',
    windowColor: '#4ade80',
    frameColor:  '#15803d',
    beaconOffsetY: 10,
    floors_data: [
      { f: 0, rooms: ['Turf Cricket Pitch', 'Boundary Ring', 'Commentary Tower', 'Stepped Spectator Pavilions', '4 Floodlight Towers'] }
    ],
    description: 'Massive full-size floodlit cricket stadium situated ahead of the academic blocks. Official venue for ABES Premier League (APL) with night match capabilities.'
  },

  // ──────────────────────────────────────────────────────────────────────────
  // REAR HOSTELS & AQUATICS (North campus behind the Cricket Ground)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'swimming_pool',
    name: 'Half-Olympic Swimming Pool',
    shortName: 'PL',
    code: 'PL-01',
    subtitle: 'Aquatics Complex & Sun Deck',
    category: 'sports',
    floors: 1,
    x: -25, z: -375,
    w: 46, d: 26, h: 6,
    wallColor:   '#e0f2fe',
    accentColor: '#0284c7',
    roofColor:   '#bae6fd',
    windowColor: '#38bdf8',
    frameColor:  '#0369a1',
    beaconOffsetY: 8,
    floors_data: [
      { f: 0, rooms: ['Half-Olympic Pool (6 Lanes)', 'Paved Tiled Deck', 'Changing Rooms', 'Filtration Plant'] }
    ],
    description: 'Clean aquatics complex positioned right in front of the hostels and behind the cricket ground with competition lane dividers.'
  },

  {
    id: 'girls_hostel',
    name: 'Vidushi Bhawan (Girls Hostel)',
    shortName: 'VB',
    code: 'GH-01',
    subtitle: 'Gated Girls Residential Complex — 4 Floors',
    category: 'hostel',
    floors: 4,
    x: -95, z: -390,
    w: 56, d: 42, h: 48,
    wallColor:   '#fdf2f8',
    accentColor: '#db2777',   // Pink accent
    roofColor:   '#fbcfe8',
    windowColor: '#f472b6',
    frameColor:  '#9d174d',
    beaconOffsetY: 16,
    floors_data: [
      { f: 0, rooms: ['Secure Guard Post', 'Dining Mess', 'Visitors Lounge', 'Medical Dispensary'] },
      { f: 1, rooms: ['Rooms VB-101 to VB-145', 'Indoor Badminton & Yoga Hall'] },
      { f: 2, rooms: ['Rooms VB-201 to VB-245', 'Computer Study Hub'] },
      { f: 3, rooms: ['Rooms VB-301 to VB-345', 'Private Garden Courtyard'] }
    ],
    description: 'Secure, gated girls residential complex positioned to the side of the swimming pool and rear of the sports ground.'
  },

  {
    id: 'boys_hostel_1',
    name: 'Dayanand Bhawan (DNB)',
    shortName: 'DNB',
    code: 'BH-01',
    subtitle: 'Boys 2nd Year (Solar Roof) — 4 Floors',
    category: 'hostel',
    floors: 4,
    x: 40, z: -405,
    w: 56, d: 40, h: 48,
    wallColor:   '#f5f7fa',
    accentColor: '#ea580c',   // Orange accent
    roofColor:   '#fed7aa',
    windowColor: '#fb923c',
    frameColor:  '#9a3412',
    beaconOffsetY: 16,
    floors_data: [
      { f: 0, rooms: ['DNB Mess Hall', 'Warden Office', 'Table Tennis & Billiards Room'] },
      { f: 1, rooms: ['Rooms DNB-101 to 145', 'Common Study Hall'] },
      { f: 2, rooms: ['Rooms DNB-201 to 245', 'Hostel Gym'] },
      { f: 3, rooms: ['Rooms DNB-301 to 345', 'Rooftop Solar Array Wing'] }
    ],
    description: 'Senior boys hostel located at the North rear behind the sports ground. Features extensive rooftop solar photovoltaic panels and dedicated mess.'
  },

  {
    id: 'boys_hostel_2',
    name: 'Vivekanand Bhawan (VKB)',
    shortName: 'VKB',
    code: 'BH-02',
    subtitle: '1st Year Boys Hostel — 4 Floors',
    category: 'hostel',
    floors: 4,
    x: 110, z: -405,
    w: 54, d: 40, h: 48,
    wallColor:   '#f5f7fa',
    accentColor: '#059669',   // Emerald accent
    roofColor:   '#a7f3d0',
    windowColor: '#34d399',
    frameColor:  '#065f46',
    beaconOffsetY: 16,
    floors_data: [
      { f: 0, rooms: ['Anti-Ragging Security Desk', 'Freshers Mess', 'Laundry Center'] },
      { f: 1, rooms: ['Rooms VKB-101 to 140', 'Reading Hall'] },
      { f: 2, rooms: ['Rooms VKB-201 to 240', 'Recreation Room'] },
      { f: 3, rooms: ['Rooms VKB-301 to 340', 'Quiet Study Area'] }
    ],
    description: 'Dedicated 1st-year boys hostel located in the rear residential sector. Strict 24/7 security and high-discipline compound.'
  },

  // ──────────────────────────────────────────────────────────────────────────
  // MAIN GATE — South side, NH-09
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'gate',
    name: 'Main Gate 1 — NH-09',
    shortName: 'MG',
    code: 'MG-00',
    subtitle: 'Primary 3-Dome Arched Entrance',
    category: 'gate',
    floors: 1,
    x: 0, z: 38,
    w: 48, d: 10, h: 24,
    wallColor:   '#f8fafc',
    accentColor: '#1e40af',
    roofColor:   '#e2e8f0',
    windowColor: '#cbd5e1',
    frameColor:  '#1e3a8a',
    beaconOffsetY: 8,
    floors_data: [
      { f: 0, rooms: ['Security Checkpost', 'Visitor Pass Counter', 'RFID Boom Barrier', 'CCTV Control'] }
    ],
    description: 'Grand 3-dome arched security gate on NH-09 highway. Direct access into central Amaltas lawns and academic plaza.'
  }
];

export const HEAT_TIERS = {
  low:      { label: '1–2 Issues', color: '#0ea5e9', bg: '#e0f2fe', tier: 'low'      },
  medium:   { label: '3–4 Issues', color: '#f59e0b', bg: '#fef3c7', tier: 'medium'   },
  critical: { label: '5+ Issues',  color: '#ef4444', bg: '#fee2e2', tier: 'critical' }
};

export function getHeatTier(count) {
  if (count >= 5) return HEAT_TIERS.critical;
  if (count >= 3) return HEAT_TIERS.medium;
  return HEAT_TIERS.low;
}

export function clusterQueries(queries) {
  const map = {};
  queries.forEach(q => {
    const id = q.blockId;
    if (!map[id]) {
      const block = CAMPUS_BLOCKS.find(b => b.id === id);
      map[id] = { id: `c-${id}`, blockId: id, name: block?.name || id,
                  queries: [], totalQueries: 0, categories: [], totalUpvotes: 0,
                  heat: getHeatTier(0) };
    }
    map[id].queries.push(q);
    map[id].totalQueries++;
    map[id].heat = getHeatTier(map[id].totalQueries);
    if (!map[id].categories.includes(q.category)) map[id].categories.push(q.category);
    map[id].totalUpvotes += (q.upvotes || 0);
  });
  return Object.values(map);
}

export const CATEGORIES = [
  'All',
  'ELECTRICAL',
  'PLUMBING',
  'CIVIL',
  'SANITATION',
  'SAFETY',
  'GENERAL'
];

export const CATEGORY_LABELS = {
  'All': 'All Departments',
  'ELECTRICAL': 'Electrical & Lighting',
  'PLUMBING': 'Plumbing & Water',
  'CIVIL': 'Civil & Roads',
  'SANITATION': 'Sanitation & Waste',
  'SAFETY': 'Public Safety',
  'GENERAL': 'General Administration'
};

export const INITIAL_QUERIES = [];

export const SIMULATION_POOL = [];

