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

export const INITIAL_QUERIES = [
  {
    id: 'ACTS-2026-1042',
    ticketId: 'ACTS-2026-1042',
    blockId: 'aryabhata',
    campus_zone: 'Aryabhata Block',
    floor: 2,
    room: 'AI & ML Center (Lab 3)',
    title: 'Exposed live conduit near seminar hall',
    department: 'ELECTRICAL',
    category: 'ELECTRICAL',
    severity_score: 9,
    severity: 'High',
    computed_priority: 8.8,
    crowd_report_count: 8,
    description: 'Live wiring hanging from false ceiling. Sparks observed during load peak.',
    author: 'Aayush K. (CSE-3)',
    timeAgo: '15m ago',
    upvotes: 38,
    status: 'IN_PROGRESS'
  },
  {
    id: 'ACTS-2026-1089',
    ticketId: 'ACTS-2026-1089',
    blockId: 'aryabhata',
    campus_zone: 'Aryabhata Block',
    floor: 1,
    room: 'Data Structures Lab',
    title: 'Network switch power surge tripped breaker',
    department: 'ELECTRICAL',
    category: 'ELECTRICAL',
    severity_score: 8,
    severity: 'High',
    computed_priority: 7.9,
    crowd_report_count: 12,
    description: 'Switch stack offline, 30+ practical stations disconnected.',
    author: 'Neha S. (IT-2)',
    timeAgo: '28m ago',
    upvotes: 24,
    status: 'SUBMITTED'
  },
  {
    id: 'ACTS-2026-1102',
    ticketId: 'ACTS-2026-1102',
    blockId: 'bhabha',
    campus_zone: 'Bhabha Block',
    floor: 1,
    room: 'Central Library Reading Hall',
    title: 'HVAC chiller failure in 250-seat reading hall',
    department: 'CIVIL',
    category: 'CIVIL',
    severity_score: 7,
    severity: 'High',
    computed_priority: 7.5,
    crowd_report_count: 19,
    description: 'Hall temperature reaching 35°C. Exam prep students vacating premises.',
    author: 'Mehak P. (M.Tech)',
    timeAgo: '35m ago',
    upvotes: 52,
    status: 'IN_PROGRESS'
  },
  {
    id: 'ACTS-2026-1115',
    ticketId: 'ACTS-2026-1115',
    blockId: 'bhabha',
    campus_zone: 'Bhabha Block',
    floor: 0,
    room: 'Registrar Office Corridor',
    title: 'Water pipe joint leakage flooding corridor',
    department: 'PLUMBING',
    category: 'PLUMBING',
    severity_score: 6,
    severity: 'Medium',
    computed_priority: 6.2,
    crowd_report_count: 6,
    description: 'Slippery floor hazard outside registrar counter. Water pooling fast.',
    author: 'Staff Desk',
    timeAgo: '1h ago',
    upvotes: 18,
    status: 'SUBMITTED'
  },
  {
    id: 'ACTS-2026-1130',
    ticketId: 'ACTS-2026-1130',
    blockId: 'kalpana',
    campus_zone: 'Kalpana Chawla Block',
    floor: 4,
    room: 'Innovation & Incubation Hub',
    title: '3-phase surge suppression failure',
    department: 'ELECTRICAL',
    category: 'ELECTRICAL',
    severity_score: 9,
    severity: 'High',
    computed_priority: 8.9,
    crowd_report_count: 9,
    description: 'Workstations flickering on 4th floor. Transformer hum abnormally loud.',
    author: 'Mohit R. (ECE-4)',
    timeAgo: '45m ago',
    upvotes: 31,
    status: 'SUBMITTED'
  },
  {
    id: 'ACTS-2026-1142',
    ticketId: 'ACTS-2026-1142',
    blockId: 'boys_hostel_1',
    campus_zone: 'Dayanand Bhawan (DNB)',
    floor: 3,
    room: 'Rooftop Solar Array Wing',
    title: 'Solar water heater pipeline valve fractured',
    department: 'PLUMBING',
    category: 'PLUMBING',
    severity_score: 8,
    severity: 'High',
    computed_priority: 8.2,
    crowd_report_count: 22,
    description: 'Hot water valve leaking on rooftop. Pressure drop across upper floor bathrooms.',
    author: 'Aniket J. (Hosteler)',
    timeAgo: '1.2h ago',
    upvotes: 44,
    status: 'IN_PROGRESS'
  },
  {
    id: 'ACTS-2026-1155',
    ticketId: 'ACTS-2026-1155',
    blockId: 'boys_hostel_2',
    campus_zone: 'Vivekanand Bhawan (VKB)',
    floor: 1,
    room: 'Freshers Reading Hall',
    title: 'Wall moisture seep near distribution board',
    department: 'CIVIL',
    category: 'CIVIL',
    severity_score: 7,
    severity: 'High',
    computed_priority: 6.8,
    crowd_report_count: 5,
    description: 'Dampness spreading around main switchboard. Safety risk during rains.',
    author: 'Prashant S.',
    timeAgo: '3h ago',
    upvotes: 27,
    status: 'SUBMITTED'
  },
  {
    id: 'ACTS-2026-1168',
    ticketId: 'ACTS-2026-1168',
    blockId: 'girls_hostel',
    campus_zone: 'Vidushi Bhawan (Girls Hostel)',
    floor: 0,
    room: 'Main Entry Gate',
    title: 'Automated turnstile barrier motor jammed',
    department: 'SAFETY',
    category: 'SAFETY',
    severity_score: 6,
    severity: 'Medium',
    computed_priority: 6.0,
    crowd_report_count: 14,
    description: 'RFID reader functional but gate barrier stuck. Manual guard override in use.',
    author: 'Security Post',
    timeAgo: '50m ago',
    upvotes: 33,
    status: 'IN_PROGRESS'
  },
  {
    id: 'ACTS-2026-1180',
    ticketId: 'ACTS-2026-1180',
    blockId: 'cafes_block',
    campus_zone: 'Campus Cafes & Eateries Hub',
    floor: 0,
    room: 'Rear Disposal Lane',
    title: 'Solid waste container overflow — sanitation risk',
    department: 'SANITATION',
    category: 'SANITATION',
    severity_score: 6,
    severity: 'Medium',
    computed_priority: 5.7,
    crowd_report_count: 11,
    description: 'Commercial bins overfull during afternoon peak. Immediate clearance required.',
    author: 'Divyansh T.',
    timeAgo: '1h ago',
    upvotes: 19,
    status: 'SUBMITTED'
  },
  {
    id: 'ACTS-2026-1192',
    ticketId: 'ACTS-2026-1192',
    blockId: 'business_school',
    campus_zone: 'ABES Business School & Auditorium',
    floor: 0,
    room: 'Dr. Radhakrishnan Auditorium',
    title: 'Stage left emergency panic exit latch jammed',
    department: 'SAFETY',
    category: 'SAFETY',
    severity_score: 9,
    severity: 'High',
    computed_priority: 9.1,
    crowd_report_count: 7,
    description: '500-seat auditorium stage emergency door latch jammed shut. Severe safety code violation.',
    author: 'Cultural Club Head',
    timeAgo: '2h ago',
    upvotes: 42,
    status: 'SUBMITTED'
  },
  {
    id: 'ACTS-2026-1205',
    ticketId: 'ACTS-2026-1205',
    blockId: 'swimming_pool',
    campus_zone: 'Half-Olympic Swimming Pool',
    floor: 0,
    room: 'Pump House',
    title: 'Chlorine filtration pump pressure anomaly',
    department: 'PLUMBING',
    category: 'PLUMBING',
    severity_score: 6,
    severity: 'Medium',
    computed_priority: 6.1,
    crowd_report_count: 8,
    description: 'Pool water circulation pump showing pressure drop. Water circulation stopped.',
    author: 'Sports Coach',
    timeAgo: '40m ago',
    upvotes: 21,
    status: 'IN_PROGRESS'
  }
];

export const SIMULATION_POOL = [
  {
    blockId: 'aryabhata',
    campus_zone: 'Aryabhata Block',
    floor: 1,
    room: 'LH-102',
    title: 'Ceiling fan regulator short circuit',
    department: 'ELECTRICAL',
    category: 'ELECTRICAL',
    severity_score: 7,
    severity: 'High',
    description: 'Burnt smell in classroom. Needs electrician attention.'
  },
  {
    blockId: 'kalpana',
    campus_zone: 'Kalpana Chawla Block',
    floor: 2,
    room: 'Applied Chemistry Lab',
    title: 'Fume hood ventilation duct loose',
    department: 'SAFETY',
    category: 'SAFETY',
    severity_score: 8,
    severity: 'High',
    description: 'Chemical exhaust fume hood motor vibrating loudly.'
  },
  {
    blockId: 'business_school',
    campus_zone: 'ABES Business School & Auditorium',
    floor: 1,
    room: 'Case Study Hall 1',
    title: 'Ceiling projector HDMI conduit disconnected',
    department: 'GENERAL',
    category: 'GENERAL',
    severity_score: 5,
    severity: 'Low',
    description: 'Lecture display input failing intermittent signals.'
  },
  {
    blockId: 'ramanujan',
    campus_zone: 'Ramanujan Block',
    floor: 0,
    room: 'Connecting Corridor to Bhabha',
    title: 'Corridor emergency lighting battery depleted',
    department: 'ELECTRICAL',
    category: 'ELECTRICAL',
    severity_score: 6,
    severity: 'Medium',
    description: 'Pathway lights between Bhabha and Ramanujan off.'
  },
  {
    blockId: 'temple',
    campus_zone: 'Campus Temple',
    floor: 0,
    room: 'Pradakshina Path',
    title: 'Loose stone paver on temple pathway',
    department: 'CIVIL',
    category: 'CIVIL',
    severity_score: 4,
    severity: 'Low',
    description: 'Uneven tile near temple steps could cause tripping.'
  },
  {
    blockId: 'nescafe_corner',
    campus_zone: 'Nescafe Corner & Circular Plaza',
    floor: 0,
    room: 'Circular Brick Seating',
    title: 'Damaged railing weld on circular seating',
    department: 'CIVIL',
    category: 'CIVIL',
    severity_score: 5,
    severity: 'Low',
    description: 'Metal grill section loose on circular tree bench.'
  }
];
