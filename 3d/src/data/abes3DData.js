// ABES Engineering College, Ghaziabad - 3D Spatial Architectural Layout

export const CAMPUS_3D_BLOCKS = [
  {
    id: 'aryabhata',
    name: 'Aryabhata Block',
    code: 'AB-01',
    subtitle: 'Dept. of CSE, IT & Advanced AI Labs',
    category: 'academic',
    color: '#06b6d4',      // Neon Cyan
    accentColor: '#22d3ee',
    roofColor: '#0e7490',
    position: [35, 13, -30],   // [x, y/2, z] in Three.js world coordinates
    dimensions: [36, 26, 26],  // [width, height, depth]
    floors: 5,
    pillarHeight: 70,
    roomDirectory: [
      { floor: 0, rooms: ['Reception & Security', 'CSE Server Room', 'HOD CSE Cabin', 'Staff Faculty Lounge'] },
      { floor: 1, rooms: ['Lecture Hall 101', 'Lecture Hall 102', 'Data Structures Lab', 'C/C++ Systems Lab'] },
      { floor: 2, rooms: ['LH-201', 'LH-202', 'AI & Machine Learning Center of Excellence', 'Web Dev Lab'] },
      { floor: 3, rooms: ['LH-301', 'LH-302', 'Cloud Computing Lab', 'Cybersecurity Cyber Range'] },
      { floor: 4, rooms: ['Capstone Project Lab', 'Departmental Library', 'Auditorium Annex', 'Conference Hall'] }
    ],
    description: 'Flagship 5-storey academic tower housing CSE/IT departments and high-performance GPU AI clusters.'
  },
  {
    id: 'bhabha',
    name: 'Bhabha Block',
    code: 'BB-02',
    subtitle: 'Administrative HQ & Director Secretariat',
    category: 'academic',
    color: '#3b82f6',      // Royal Blue
    accentColor: '#60a5fa',
    roofColor: '#1d4ed8',
    position: [25, 10, 25],
    dimensions: [38, 20, 24],
    floors: 4,
    pillarHeight: 60,
    roomDirectory: [
      { floor: 0, rooms: ['Registrar Office', 'Admission Cell', 'Student Accounts & Fee Desk', 'Director Boardroom'] },
      { floor: 1, rooms: ['Dean Academics', 'University Exam Controller', 'Central Meeting Hall'] },
      { floor: 2, rooms: ['Physics Lab', 'Basic Electrical Lab', 'Faculty Lounge'] },
      { floor: 3, rooms: ['Training & Placement Cell', 'IQAC Audit Cell', 'Alumni Relations'] }
    ],
    description: 'Central administrative building featuring majestic neo-classical architectural facade and leadership suites.'
  },
  {
    id: 'raman',
    name: 'Raman Block',
    code: 'RB-03',
    subtitle: 'Dept. of ECE, EE & Robotics Center',
    category: 'academic',
    color: '#8b5cf6',      // Electric Violet
    accentColor: '#a78bfa',
    roofColor: '#6d28d9',
    position: [-30, 9.5, -45],
    dimensions: [34, 19, 22],
    floors: 4,
    pillarHeight: 55,
    roomDirectory: [
      { floor: 0, rooms: ['Mechanical Workshop', 'Foundry & Welding Bay', 'Heavy Machines Lab'] },
      { floor: 1, rooms: ['VLSI Design Lab', 'Embedded Systems & IoT Lab', 'HOD ECE Cabin'] },
      { floor: 2, rooms: ['Control Systems Lab', 'DSP & Signal Processing Lab', 'LH-210'] },
      { floor: 3, rooms: ['Robotics Testing Arena', 'Autonomous Drone Lab', 'Seminar Hall 2'] }
    ],
    description: 'Core Engineering block with integrated electronics prototyping and robotics manufacturing bays.'
  },
  {
    id: 'kalpana',
    name: 'Kalpana Chawla Block',
    code: 'KC-04',
    subtitle: 'Applied Sciences & First Year Campus',
    category: 'academic',
    color: '#ec4899',      // Hot Pink
    accentColor: '#f472b6',
    roofColor: '#be185d',
    position: [60, 8, 45],
    dimensions: [32, 16, 22],
    floors: 3,
    pillarHeight: 50,
    roomDirectory: [
      { floor: 0, rooms: ['1st Year Dean Office', 'Chemistry Laboratory', 'Physics Dark Room'] },
      { floor: 1, rooms: ['LH-01 to LH-06', 'Engineering Drawing Hall 1', 'Math Tutoring Room'] },
      { floor: 2, rooms: ['Language & Soft Skills Lab', 'Environmental Science Lab', 'Common Room'] }
    ],
    description: 'Dedicated complex for newly admitted B.Tech freshmen, orientation seminars, and fundamental sciences.'
  },
  {
    id: 'library_audi',
    name: 'Central Library & Audi',
    code: 'CL-05',
    subtitle: 'Dr. APJ Abdul Kalam Auditorium',
    category: 'facility',
    color: '#10b981',      // Emerald Green
    accentColor: '#34d399',
    roofColor: '#047857',
    position: [-35, 8.5, 15],
    dimensions: [36, 17, 30],
    floors: 2,
    pillarHeight: 55,
    roomDirectory: [
      { floor: 0, rooms: ['Grand Auditorium (1,200 seats)', 'VIP Green Rooms', 'Acoustic Control Booth'] },
      { floor: 1, rooms: ['Central Digital Library', 'Quiet Research Wing', 'E-Journals Computer Lounge'] }
    ],
    description: 'High-ceiling architectural marvel with curved acoustic roof housing the primary event auditorium and central library.'
  },
  {
    id: 'boys_hostel_1',
    name: 'Vivekanand & Dayanand Bhawan',
    code: 'BH-01',
    subtitle: 'Senior Boys Hostels & Dining Hall',
    category: 'hostel',
    color: '#f59e0b',      // Amber
    accentColor: '#fbbf24',
    roofColor: '#b45309',
    position: [-80, 9, 45],
    dimensions: [38, 18, 28],
    floors: 4,
    pillarHeight: 55,
    roomDirectory: [
      { floor: 0, rooms: ['Senior Mess Dining Hall', 'Warden Office', 'Table Tennis & Gym', 'Night Canteen'] },
      { floor: 1, rooms: ['Rooms 101-140', 'Study Room East', 'Common Washrooms'] },
      { floor: 2, rooms: ['Rooms 201-240', 'Common Room (TV/Foosball)', 'Common Washrooms'] },
      { floor: 3, rooms: ['Rooms 301-340', 'Solar Water Plant Access'] }
    ],
    description: 'Senior residential compound with in-house mess, indoor recreation facilities, and quadrangle courtyard.'
  },
  {
    id: 'boys_hostel_2',
    name: 'Chanakya & Aurobindo Bhawan',
    code: 'BH-02',
    subtitle: 'Junior Boys Hostels',
    category: 'hostel',
    color: '#f97316',      // Orange
    accentColor: '#fb923c',
    roofColor: '#c2410c',
    position: [-45, 8.5, 80],
    dimensions: [34, 17, 24],
    floors: 4,
    pillarHeight: 50,
    roomDirectory: [
      { floor: 0, rooms: ['Security Post & Anti-Ragging Cell', 'Junior Mess', 'Indoor Games Room'] },
      { floor: 1, rooms: ['Rooms 101-135', 'Water Cooler Station'] },
      { floor: 2, rooms: ['Rooms 201-235', 'Silence Reading Hall'] },
      { floor: 3, rooms: ['Rooms 301-335', 'Warden Night Inspection Desk'] }
    ],
    description: 'Monitored hostel block for first year boys with strict curfew security and proctor assistance.'
  },
  {
    id: 'girls_hostel',
    name: 'Gargi & Sarojini Bhawan',
    code: 'GH-01',
    subtitle: 'Girls Hostels Complex & Garden',
    category: 'hostel',
    color: '#d946ef',      // Fuchsia
    accentColor: '#e879f9',
    roofColor: '#a21caf',
    position: [-80, 9, -35],
    dimensions: [36, 18, 26],
    floors: 4,
    pillarHeight: 55,
    roomDirectory: [
      { floor: 0, rooms: ['Gated Security Entry', 'Girls Mess', 'Visitors Lounge', '24/7 First Aid Center'] },
      { floor: 1, rooms: ['Rooms 101-140', 'Fitness Gym & Yoga Room'] },
      { floor: 2, rooms: ['Rooms 201-240', 'Computer Lab & Study Lounge'] },
      { floor: 3, rooms: ['Rooms 301-340', 'Balcony Garden Terrace'] }
    ],
    description: 'Dedicated residential complex for female students with internal gardens, badminton court, and medical dispensary.'
  },
  {
    id: 'canteen_nescafe',
    name: 'Nescafe Hub & Food Court',
    code: 'FC-01',
    subtitle: 'Central Cafeteria & Student Deck',
    category: 'facility',
    color: '#eab308',      // Gold
    accentColor: '#facc15',
    roofColor: '#a16207',
    position: [0, 3.5, -5],
    dimensions: [22, 7, 18],
    floors: 1,
    pillarHeight: 40,
    roomDirectory: [
      { floor: 0, rooms: ['Nescafe Espresso Corner', 'Hot Meals Counter', 'Outdoor Canopy Seating Deck'] }
    ],
    description: 'Central open-air social epicenter of ABESEC, featuring outdoor dining tables and refreshments.'
  },
  {
    id: 'sports_complex',
    name: 'Cricket Stadium & Arena',
    code: 'SP-01',
    subtitle: 'Floodlit Stadium & Sports Pavilion',
    category: 'sports',
    color: '#14b8a6',      // Teal Green
    accentColor: '#2dd4bf',
    roofColor: '#0f766e',
    position: [85, 3, -50],
    dimensions: [55, 6, 45],
    floors: 1,
    pillarHeight: 40,
    roomDirectory: [
      { floor: 0, rooms: ['Pavilion Seating', 'Sports Officer Office', 'Athletic Equipment Locker', 'Changing Rooms'] }
    ],
    description: 'Full-size cricket ground with turf pitch, professional floodlight towers, and basketball courts.'
  },
  {
    id: 'main_gate',
    name: 'Main Gate 1 (NH-09)',
    code: 'MG-01',
    subtitle: 'Highway Checkpost & Security Arch',
    category: 'gate',
    color: '#94a3b8',      // Steel
    accentColor: '#cbd5e1',
    roofColor: '#475569',
    position: [100, 5, 65],
    dimensions: [28, 10, 8],
    floors: 1,
    pillarHeight: 35,
    roomDirectory: [
      { floor: 0, rooms: ['Main Security Checkpoint', 'Visitor Entry Pass Desk', 'Automated Barrier Boom'] }
    ],
    description: 'Primary access gate connecting the campus to Delhi-Meerut Expressway / NH-09.'
  }
];

export const INITIAL_3D_QUERIES = [
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
    upvotes: 24,
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
    upvotes: 11,
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
    upvotes: 17,
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
    upvotes: 32,
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
    upvotes: 5,
    status: 'Investigating'
  },
  {
    id: 'q-201',
    blockId: 'canteen_nescafe',
    title: 'Nescafe payment QR counter code scratched / unreadable',
    floor: 0,
    room: 'Nescafe Espresso Corner',
    category: 'Facility / Canteen',
    severity: 'Medium',
    description: 'UPI QR code printout is damaged, causing huge queues during 1:15 PM lunch break.',
    author: 'Shubham M. (ECE)',
    timeAgo: '18m ago',
    upvotes: 19,
    status: 'In Progress'
  },
  {
    id: 'q-202',
    blockId: 'canteen_nescafe',
    title: 'Ceiling fan regulator dead on north dining corner',
    floor: 0,
    room: 'Outdoor Canopy Seating Deck',
    category: 'Electricity / AC',
    severity: 'Low',
    description: 'Fan stuck at lowest speed, corner gets very warm in afternoon.',
    author: 'Divyansh T.',
    timeAgo: '1h ago',
    upvotes: 9,
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
    upvotes: 14,
    status: 'Investigating'
  },
  {
    id: 'q-302',
    blockId: 'library_audi',
    title: 'Audi Stage Mic #2 RF frequency interference during fest prep',
    floor: 0,
    room: 'Grand Auditorium',
    category: 'Facility / Canteen',
    severity: 'High',
    description: 'Wireless audio receiver popping loud static every few minutes.',
    author: 'Cultural Club Head',
    timeAgo: '50m ago',
    upvotes: 28,
    status: 'Pending'
  },
  {
    id: 'q-401',
    blockId: 'boys_hostel_1',
    title: 'Vivekanand Block C geyser not warming up',
    floor: 2,
    room: 'Common Washrooms',
    category: 'Electricity / AC',
    severity: 'High',
    description: 'Wing C bathrooms geyser MCB trip, students left with cold water.',
    author: 'Aniket J. (Hosteler)',
    timeAgo: '2h ago',
    upvotes: 35,
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
