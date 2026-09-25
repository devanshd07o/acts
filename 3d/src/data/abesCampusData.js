// ABES Engineering College, Ghaziabad - 3D Campus Spatial Blueprint & Geo Coordinates

export const CAMPUS_CENTER = [77.4458, 28.6338]; // [lng, lat] for MapLibre/GeoJSON format
export const CAMPUS_BOUNDS = [
  [77.4410, 28.6290], // Southwest
  [77.4505, 28.6385]  // Northeast
];

// Camera Presets
export const CAMERA_PRESETS = {
  isometric3D: {
    center: [77.4458, 28.6338],
    zoom: 17.6,
    pitch: 62,
    bearing: -25
  },
  topDown2D: {
    center: [77.4458, 28.6338],
    zoom: 17.2,
    pitch: 0,
    bearing: 0
  },
  aryabhataFocus: {
    center: [77.4462, 28.6341],
    zoom: 18.8,
    pitch: 65,
    bearing: -15
  },
  hostelQuad: {
    center: [77.4445, 28.6322],
    zoom: 18.5,
    pitch: 60,
    bearing: 45
  }
};

export const CAMPUS_BLOCKS = [
  {
    id: 'aryabhata',
    name: 'Aryabhata Block',
    code: 'AB-01',
    subtitle: 'Dept. of CSE, IT & AI/ML Labs',
    category: 'academic',
    color: '#06b6d4',      // Neon Cyan
    roofColor: '#0891b2',
    height: 24,            // 5 Floors (~24 meters extruded)
    floors: 5,
    center: [77.4462, 28.6341],
    polygon: [
      [77.4459, 28.6344],
      [77.4466, 28.6344],
      [77.4466, 28.6337],
      [77.4459, 28.6337],
      [77.4459, 28.6344]
    ],
    roomDirectory: [
      { floor: 0, rooms: ['Reception', 'Server Room', 'HOD CSE', 'Faculty Cubicles'] },
      { floor: 1, rooms: ['LH-101', 'LH-102', 'Data Structures Lab', 'C Programming Lab'] },
      { floor: 2, rooms: ['LH-201', 'LH-202', 'AI & Machine Learning Center of Excellence', 'Web Dev Lab'] },
      { floor: 3, rooms: ['LH-301', 'LH-302', 'Cloud Computing Lab', 'Cybersecurity Cyber Range'] },
      { floor: 4, rooms: ['Final Year Project Lab', 'Departmental Library', 'Seminar Hall 1', 'Conference Room'] }
    ],
    description: 'Premier academic building housing CSE/IT departments, advanced computing clusters, and research labs.'
  },
  {
    id: 'bhabha',
    name: 'Bhabha Block',
    code: 'BB-02',
    subtitle: 'Administrative Headquarters & Director Secretariat',
    category: 'academic',
    color: '#3b82f6',      // Royal Blue
    roofColor: '#2563eb',
    height: 19,            // 4 Floors
    floors: 4,
    center: [77.4459, 28.6334],
    polygon: [
      [77.4456, 28.6336],
      [77.4463, 28.6336],
      [77.4463, 28.6331],
      [77.4456, 28.6331],
      [77.4456, 28.6336]
    ],
    roomDirectory: [
      { floor: 0, rooms: ['Registrar Office', 'Admission Cell', 'Accounts & Fee Desk', 'Director Boardroom'] },
      { floor: 1, rooms: ['Dean Academics', 'Examination Controller', 'Main Meeting Hall'] },
      { floor: 2, rooms: ['Central Physics Lab', 'Basic Electrical Lab', 'Faculty Lounge'] },
      { floor: 3, rooms: ['Auditorium Annex', 'IQAC Cell', 'Training & Placement Cell'] }
    ],
    description: 'Central administrative powerhouse of ABESEC, housing university examination, finance, and leadership.'
  },
  {
    id: 'raman',
    name: 'Raman Block',
    code: 'RB-03',
    subtitle: 'Dept. of ECE, EE & Robotics Center',
    category: 'academic',
    color: '#8b5cf6',      // Electric Violet
    roofColor: '#7c3aed',
    height: 18,            // 4 Floors
    floors: 4,
    center: [77.4453, 28.6345],
    polygon: [
      [77.4450, 28.6348],
      [77.4457, 28.6348],
      [77.4457, 28.6342],
      [77.4450, 28.6342],
      [77.4450, 28.6348]
    ],
    roomDirectory: [
      { floor: 0, rooms: ['Mechanical Workshop', 'Carpentry & Foundry', 'Heavy Machinery Lab'] },
      { floor: 1, rooms: ['VLSI Design Lab', 'Embedded Systems Lab', 'HOD ECE'] },
      { floor: 2, rooms: ['Control Systems Lab', 'Signals & DSP Lab', 'LH-210'] },
      { floor: 3, rooms: ['Robotics Research Lab', 'Drone Testing Arena', 'Seminar Hall 2'] }
    ],
    description: 'Engineering excellence block dedicated to electronics, robotics, electrical systems, and workshops.'
  },
  {
    id: 'kalpana',
    name: 'Kalpana Chawla Block',
    code: 'KC-04',
    subtitle: 'Applied Sciences & First Year Campus',
    category: 'academic',
    color: '#ec4899',      // Hot Pink
    roofColor: '#db2777',
    height: 15,            // 3 Floors
    floors: 3,
    center: [77.4465, 28.6328],
    polygon: [
      [77.4462, 28.6331],
      [77.4469, 28.6331],
      [77.4469, 28.6325],
      [77.4462, 28.6325],
      [77.4462, 28.6331]
    ],
    roomDirectory: [
      { floor: 0, rooms: ['1st Year Dean Office', 'Chemistry Laboratory', 'Physics Dark Room'] },
      { floor: 1, rooms: ['LH-01 to LH-06', 'Engineering Drawing Hall 1', 'Math Tutoring Room'] },
      { floor: 2, rooms: ['Communication Skills Lab', 'Language Lab', '1st Year Faculty Common Room'] }
    ],
    description: 'Dedicated complex for newly admitted 1st year B.Tech students and fundamental applied sciences.'
  },
  {
    id: 'library_audi',
    name: 'Central Library & Audi',
    code: 'CL-05',
    subtitle: 'Dr. APJ Abdul Kalam Auditorium',
    category: 'facility',
    color: '#10b981',      // Emerald Green
    roofColor: '#059669',
    height: 15,            // Grand High-Ceiling
    floors: 2,
    center: [77.4451, 28.6336],
    polygon: [
      [77.4448, 28.6339],
      [77.4454, 28.6339],
      [77.4454, 28.6333],
      [77.4448, 28.6333],
      [77.4448, 28.6339]
    ],
    roomDirectory: [
      { floor: 0, rooms: ['Main Auditorium (1,200 seats)', 'Green Rooms', 'Stage Production Control'] },
      { floor: 1, rooms: ['Central Digital Library', 'Quiet Research Wing', 'E-Journals Computer Section'] }
    ],
    description: 'State-of-the-art multimedia auditorium hosting tech fests, convocation, and multi-tier library.'
  },
  {
    id: 'boys_hostel_1',
    name: 'Vivekanand & Dayanand Bhawan',
    code: 'BH-01',
    subtitle: 'Senior Boys Hostels & Dining Hall',
    category: 'hostel',
    color: '#f59e0b',      // Amber
    roofColor: '#d97706',
    height: 18,            // 4 Floors
    floors: 4,
    center: [77.4444, 28.6322],
    polygon: [
      [77.4440, 28.6326],
      [77.4448, 28.6326],
      [77.4448, 28.6318],
      [77.4440, 28.6318],
      [77.4440, 28.6326]
    ],
    roomDirectory: [
      { floor: 0, rooms: ['Hostel Mess 1', 'Warden Office', 'Table Tennis Room', 'Night Canteen'] },
      { floor: 1, rooms: ['Rooms 101-140', 'Study Lounge A', 'Common Bathrooms East'] },
      { floor: 2, rooms: ['Rooms 201-240', 'Common Room (TV/Board Games)', 'Common Bathrooms West'] },
      { floor: 3, rooms: ['Rooms 301-340', 'Rooftop Solar Water Control', 'Gym Annex'] }
    ],
    description: 'Senior male student dormitories with fully-catered dining hall and recreational zones.'
  },
  {
    id: 'boys_hostel_2',
    name: 'Chanakya & Aurobindo Bhawan',
    code: 'BH-02',
    subtitle: 'Junior Boys Hostels',
    category: 'hostel',
    color: '#f97316',      // Orange
    roofColor: '#ea580c',
    height: 17,            // 4 Floors
    floors: 4,
    center: [77.4452, 28.6316],
    polygon: [
      [77.4449, 28.6319],
      [77.4456, 28.6319],
      [77.4456, 28.6312],
      [77.4449, 28.6312],
      [77.4449, 28.6319]
    ],
    roomDirectory: [
      { floor: 0, rooms: ['Anti-Ragging Patrol Desk', 'Junior Mess', 'Indoor Badminton Hall'] },
      { floor: 1, rooms: ['Rooms 101-135', 'Water Cooler Bay 1'] },
      { floor: 2, rooms: ['Rooms 201-235', 'Reading Hall'] },
      { floor: 3, rooms: ['Rooms 301-335', 'Quiet Hours Zone'] }
    ],
    description: 'First year boys residence wing featuring 24/7 security surveillance and proctor supervision.'
  },
  {
    id: 'girls_hostel',
    name: 'Gargi & Sarojini Bhawan',
    code: 'GH-01',
    subtitle: 'Girls Hostels Complex',
    category: 'hostel',
    color: '#d946ef',      // Fuchsia
    roofColor: '#c026d3',
    height: 18,            // 4 Floors
    floors: 4,
    center: [77.4441, 28.6347],
    polygon: [
      [77.4437, 28.6350],
      [77.4445, 28.6350],
      [77.4445, 28.6343],
      [77.4437, 28.6343],
      [77.4437, 28.6350]
    ],
    roomDirectory: [
      { floor: 0, rooms: ['Security Reception', 'Girls Dining Mess', 'Visitors Room', 'In-house Pharmacy'] },
      { floor: 1, rooms: ['Rooms 101-140', 'Fitness Gym'] },
      { floor: 2, rooms: ['Rooms 201-240', 'Computer Study Room'] },
      { floor: 3, rooms: ['Rooms 301-340', 'Balcony Garden Terrace'] }
    ],
    description: 'Secure on-campus residential housing for female engineers equipped with dedicated amenities.'
  },
  {
    id: 'canteen_nescafe',
    name: 'Nescafe Hub & Food Court',
    code: 'FC-01',
    subtitle: 'Central Cafeteria & Outdoor Student Lounge',
    category: 'facility',
    color: '#eab308',      // Yellow
    roofColor: '#ca8a04',
    height: 8,             // 1-2 Floors Pavilion
    floors: 1,
    center: [77.4457, 28.6338],
    polygon: [
      [77.4455, 28.6340],
      [77.4459, 28.6340],
      [77.4459, 28.6336],
      [77.4455, 28.6336],
      [77.4455, 28.6340]
    ],
    roomDirectory: [
      { floor: 0, rooms: ['Nescafe Coffee Corner', 'Hot Meals Buffet Line', 'Juice Bar', 'Open Seating Deck'] }
    ],
    description: 'Vibrant outdoor and indoor gathering center for breaks, quick refreshments, and peer meetups.'
  },
  {
    id: 'sports_complex',
    name: 'Cricket Stadium & Arena',
    code: 'SP-01',
    subtitle: 'Floodlit Stadium & Sports Pavilion',
    category: 'sports',
    color: '#14b8a6',      // Teal Green
    roofColor: '#0d9488',
    height: 6,             // Pavilion Stands
    floors: 1,
    center: [77.4475, 28.6321],
    polygon: [
      [77.4470, 28.6328],
      [77.4482, 28.6328],
      [77.4482, 28.6314],
      [77.4470, 28.6314],
      [77.4470, 28.6328]
    ],
    roomDirectory: [
      { floor: 0, rooms: ['Cricket Pavilion', 'Sports Officer Cabin', 'Equipment Locker', 'Gymnasium'] }
    ],
    description: 'Full-size cricket ground, outdoor basketball courts, tennis courts, and athletic tracks.'
  }
];

// Helper to convert blocks to standard GeoJSON FeatureCollection for MapLibre 3D Extrusion Layer
export function getCampusGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: CAMPUS_BLOCKS.map((block) => ({
      type: 'Feature',
      id: block.id,
      properties: {
        id: block.id,
        name: block.name,
        code: block.code,
        subtitle: block.subtitle,
        height: block.height,
        base_height: 0,
        color: block.color,
        roofColor: block.roofColor,
        category: block.category,
        floors: block.floors
      },
      geometry: {
        type: 'Polygon',
        coordinates: [block.polygon]
      }
    }))
  };
}

export const INITIAL_QUERIES = [
  {
    id: 'q-101',
    blockId: 'aryabhata',
    title: 'Aryabhata Lab 4 High Latency / Packet Drops on 5G WiFi',
    floor: 3,
    room: 'Cloud Computing Lab',
    category: 'Network & WiFi',
    severity: 'High',
    description: 'During practical coding sessions, the 5GHz gateway drops connection every 8-10 mins.',
    author: 'Aayush K. (CSE-3rd Yr)',
    timeAgo: '12m ago',
    upvotes: 18,
    lat: 28.6341,
    lng: 77.4462,
    status: 'In Progress'
  },
  {
    id: 'q-102',
    blockId: 'aryabhata',
    title: 'Projector HDMI port burned out in LH-302',
    floor: 3,
    room: 'LH-302',
    category: 'Hardware / Infra',
    severity: 'Medium',
    description: 'Faculty unable to project slide presentations; needs replacement HDMI transceiver.',
    author: 'Neha S. (IT-2nd Yr)',
    timeAgo: '28m ago',
    upvotes: 7,
    lat: 28.63418,
    lng: 77.44625,
    status: 'Pending'
  },
  {
    id: 'q-103',
    blockId: 'aryabhata',
    title: 'Water cooler chiller malfunction on 2nd Floor corridor',
    floor: 2,
    room: 'Corridor near AI Lab',
    category: 'Cleanliness & Water',
    severity: 'Medium',
    description: 'Water running at room temperature since morning; high rush during lunch.',
    author: 'Rohan V. (CSE-4th Yr)',
    timeAgo: '45m ago',
    upvotes: 14,
    lat: 28.63405,
    lng: 77.44615,
    status: 'Pending'
  },
  {
    id: 'q-104',
    blockId: 'aryabhata',
    title: 'AC unit #2 tripping 3-phase MCB in AI Research Lab',
    floor: 2,
    room: 'AI & Machine Learning CoE',
    category: 'Electricity / AC',
    severity: 'High',
    description: 'Sudden electrical trip shuts down active GPU training workstations.',
    author: 'Tanya G. (CSE-AI)',
    timeAgo: '1h ago',
    upvotes: 21,
    lat: 28.63412,
    lng: 77.4463,
    status: 'Pending'
  },
  {
    id: 'q-105',
    blockId: 'aryabhata',
    title: 'Door biometric lock failing on 4th floor Seminar Hall',
    floor: 4,
    room: 'Seminar Hall 1',
    category: 'Hardware / Infra',
    severity: 'Low',
    description: 'Fingerprint scanner rejecting enrolled cards, needs firmware restart.',
    author: 'Lab Assistant',
    timeAgo: '2h ago',
    upvotes: 4,
    lat: 28.63408,
    lng: 77.44622,
    status: 'Investigating'
  },
  {
    id: 'q-201',
    blockId: 'canteen_nescafe',
    title: 'Nescafe payment QR counter code scratched / unreadable',
    floor: 0,
    room: 'Nescafe Coffee Corner',
    category: 'Facility / Canteen',
    severity: 'Medium',
    description: 'UPI QR code printout is damaged, causing huge queues during 1:15 PM lunch break.',
    author: 'Shubham M. (ECE)',
    timeAgo: '18m ago',
    upvotes: 16,
    lat: 28.6338,
    lng: 77.4457,
    status: 'In Progress'
  },
  {
    id: 'q-202',
    blockId: 'canteen_nescafe',
    title: 'Ceiling fan regulator dead on north dining corner',
    floor: 0,
    room: 'Open Seating Deck',
    category: 'Electricity / AC',
    severity: 'Low',
    description: 'Fan stuck at lowest speed, corner gets very warm in afternoon.',
    author: 'Divyansh T.',
    timeAgo: '1h ago',
    upvotes: 8,
    lat: 28.63384,
    lng: 77.44574,
    status: 'Pending'
  },
  {
    id: 'q-301',
    blockId: 'library_audi',
    title: 'Noise disturbance in designated Quiet Research Wing',
    floor: 1,
    room: 'Quiet Research Wing',
    category: 'Discipline / Noise',
    severity: 'Medium',
    description: 'Loud phone calls happening in the silent research section without guard notice.',
    author: 'Priya R. (M.Tech)',
    timeAgo: '35m ago',
    upvotes: 11,
    lat: 28.6336,
    lng: 77.4451,
    status: 'Investigating'
  },
  {
    id: 'q-302',
    blockId: 'library_audi',
    title: 'Audi Stage Mic #2 RF frequency interference during fest prep',
    floor: 0,
    room: 'Main Auditorium',
    category: 'Facility / Canteen',
    severity: 'High',
    description: 'Wireless audio receiver popping loud static every few minutes.',
    author: 'Cultural Club Head',
    timeAgo: '50m ago',
    upvotes: 24,
    lat: 28.63365,
    lng: 77.44514,
    status: 'Pending'
  },
  {
    id: 'q-401',
    blockId: 'boys_hostel_1',
    title: 'Vivekanand Block C geyser not warming up',
    floor: 2,
    room: 'Common Bathrooms West',
    category: 'Electricity / AC',
    severity: 'High',
    description: 'Wing C bathrooms geyser MCB trip, students left with cold water.',
    author: 'Aniket J. (Hosteler)',
    timeAgo: '2h ago',
    upvotes: 29,
    lat: 28.6322,
    lng: 77.4444,
    status: 'In Progress'
  }
];

export const CATEGORIES = [
  'All',
  'Network & WiFi',
  'Electricity / AC',
  'Cleanliness & Water',
  'Hardware / Infra',
  'Facility / Canteen',
  'Discipline / Noise',
  'Other'
];
