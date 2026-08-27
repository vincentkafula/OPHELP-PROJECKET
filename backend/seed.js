import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { pool } from './db.js'
import { insertEntity, uid, listEntity } from './store.js'

function dIso(daysAgo, hour = 8, min = 0) {
  const dt = new Date()
  dt.setDate(dt.getDate() - daysAgo)
  dt.setHours(hour, min, 0, 0)
  return dt.toISOString()
}

function dateStr(daysOffset = 0) {
  const dt = new Date()
  dt.setDate(dt.getDate() + daysOffset)
  return dt.toISOString().slice(0, 10)
}

async function alreadySeeded() {
  const users = await listEntity('users')
  return users.length > 0
}

async function seed() {
  if (await alreadySeeded()) {
    console.log('[seed] Data already present — skipping. Use `npm run migrate` + truncate manually to reseed.')
    await pool.end()
    return
  }

  console.log('[seed] Seeding OPHELP demo dataset ...')

  // ── System Users ────────────────────────────────────────────────────────
  const userDefs = [
    { name: 'Thabo Nkosi', email: 'admin@ophelp.org', password: 'Admin@123', role: 'admin', roleLabel: 'Teams Dashboard', avatar: 'TN', phone: '011 555 0001', department: 'Administration', createdAt: dIso(180), lastLogin: dIso(0) },
    { name: 'Sipho Dlamini', email: 'foreman@ophelp.org', password: 'Foreman@123', role: 'foreman', roleLabel: 'Site Foreman', avatar: 'SD', phone: '011 555 0002', department: 'Operations', createdAt: dIso(120), lastLogin: dIso(1) },
    { name: 'Zanele Mokoena', email: 'dayadmin@ophelp.org', password: 'DayAdmin@123', role: 'day_admin', roleLabel: 'Day Administrator', avatar: 'ZM', phone: '011 555 0003', department: 'Administration', createdAt: dIso(90), lastLogin: dIso(0) },
    { name: 'Lerato Sithole', email: 'opoffice@ophelp.org', password: 'OpOffice@123', role: 'operation_office', roleLabel: 'Operation Office', avatar: 'LS', phone: '011 555 0004', department: 'Operations', createdAt: dIso(90), lastLogin: dIso(2) },
    { name: 'Bongani Khumalo', email: 'opmanage@ophelp.org', password: 'OpManage@123', role: 'operation_management', roleLabel: 'Operation Management', avatar: 'BK', phone: '011 555 0005', department: 'Operations', createdAt: dIso(60), lastLogin: dIso(0) },
    { name: 'Nomsa Zulu', email: 'store@ophelp.org', password: 'Store@123', role: 'ophelp_store', roleLabel: 'OPHELP Store Manager', avatar: 'NZ', phone: '011 555 0006', department: 'Store', createdAt: dIso(60), lastLogin: dIso(0) },
    { name: 'Mandla Ntuli', email: 'projman@ophelp.org', password: 'ProjMan@123', role: 'project_manager', roleLabel: 'Project Manager', avatar: 'MN', phone: '011 555 0007', department: 'Projects', createdAt: dIso(45), lastLogin: dIso(1) },
    { name: 'Ayanda Buthelezi', email: 'headoffice@ophelp.org', password: 'HeadOffice@123', role: 'head_office', roleLabel: 'Head Office Executive', avatar: 'AB', phone: '011 555 0008', department: 'Executive', createdAt: dIso(30), lastLogin: dIso(0) },
    { name: 'Precious Mthembu', email: 'partner@ophelp.org', password: 'Partner@123', role: 'partner', roleLabel: 'Partner Shop Owner', avatar: 'PM', phone: '011 555 0009', department: 'Partner', createdAt: dIso(20), lastLogin: dIso(3) },
    { name: 'Themba Cele', email: 'team@ophelp.org', password: 'Team@123', role: 'team', roleLabel: 'Team Member', avatar: 'TC', phone: '011 555 0010', department: 'Team', createdAt: dIso(15), lastLogin: dIso(0) },
    { name: 'Nandi Mahlangu', email: 'foreman2@ophelp.org', password: 'Foreman@123', role: 'foreman', roleLabel: 'Site Foreman', avatar: 'NM', phone: '011 555 0011', department: 'Operations', createdAt: dIso(100), lastLogin: dIso(1) },
    { name: 'Solomon Mkhize', email: 'foreman3@ophelp.org', password: 'Foreman@123', role: 'foreman', roleLabel: 'Site Foreman', avatar: 'SM', phone: '011 555 0012', department: 'Operations', createdAt: dIso(100), lastLogin: dIso(2) },
  ]

  const seededUsers = []
  for (const u of userDefs) {
    const { password, ...rest } = u
    const passwordHash = await bcrypt.hash(password, 10)
    seededUsers.push(await insertEntity('users', { ...rest, id: uid(), email: rest.email.toLowerCase(), passwordHash, active: true }))
  }
  const [adminId, foremanId, , , , storeUserId, managerId, , partnerId, teamUserId, foreman2Id, foreman3Id] = seededUsers.map((u) => u.id)

  console.log('[seed] Users created. Login with, e.g. admin@ophelp.org / Admin@123')

  // ── Work Sites ───────────────────────────────────────────────────────────
  const siteDefs = [
    { name: 'Soweto Road Crew Alpha', address: '12 Vilakazi St', suburb: 'Orlando West', type: 'road_maintenance', foremanId, status: 'active', teamSize: 45, progressPct: 68, budget: 850000, spent: 578000, startDate: dateStr(-60), endDate: dateStr(30), description: 'Pothole repair and road marking on main routes.' },
    { name: 'Alexandra Parks Team', address: '3 Pan Africa Blvd', suburb: 'Alexandra', type: 'parks', foremanId: foreman2Id, status: 'active', teamSize: 30, progressPct: 55, budget: 620000, spent: 341000, startDate: dateStr(-45), endDate: dateStr(45), description: 'Maintenance and greening of public parks.' },
    { name: 'Diepsloot Sanitation Crew', address: '78 Extension 2', suburb: 'Diepsloot', type: 'cleaning', foremanId: foreman3Id, status: 'active', teamSize: 38, progressPct: 72, budget: 710000, spent: 511200, startDate: dateStr(-30), endDate: dateStr(60), description: 'Street cleaning and refuse collection support.' },
    { name: 'Meadowlands School Build', address: '5 Freedom Rd', suburb: 'Meadowlands', type: 'school', foremanId, status: 'active', teamSize: 20, progressPct: 40, budget: 1200000, spent: 480000, startDate: dateStr(-20), endDate: dateStr(100), description: 'Community school construction programme.' },
    { name: 'Tembisa General Admin', address: '1 Tembisa Plaza', suburb: 'Tembisa', type: 'admin', foremanId: foreman2Id, status: 'active', teamSize: 12, progressPct: 85, budget: 300000, spent: 255000, startDate: dateStr(-90), endDate: dateStr(10), description: 'Administrative support and community liaison.' },
    { name: 'Khayelitsha Road Crew', address: '20 Site B', suburb: 'Khayelitsha', type: 'road_maintenance', foremanId: foreman3Id, status: 'on_hold', teamSize: 28, progressPct: 30, budget: 540000, spent: 162000, startDate: dateStr(-15), endDate: dateStr(75), description: 'Road resurfacing — on hold pending materials.' },
  ]
  const seededSites = []
  for (const s of siteDefs) seededSites.push(await insertEntity('sites', { ...s, id: uid() }))
  const [site1, site2, site3, site4, site5] = seededSites.map((s) => s.id)

  // ── Teams ────────────────────────────────────────────────────────────────
  const team1 = await insertEntity('teams', { id: uid(), name: 'Team 20', siteId: site1, foremanId, memberIds: [], createdAt: dIso(60) })
  const team2 = await insertEntity('teams', { id: uid(), name: 'Team 13', siteId: site2, foremanId: foreman2Id, memberIds: [], createdAt: dIso(45) })
  const team3 = await insertEntity('teams', { id: uid(), name: 'Team Negotiator', siteId: site3, foremanId: foreman3Id, memberIds: [], createdAt: dIso(30) })
  const team4 = await insertEntity('teams', { id: uid(), name: 'Team Coaching', siteId: site4, foremanId, memberIds: [], createdAt: dIso(20) })
  const team5 = await insertEntity('teams', { id: uid(), name: 'Team 24', siteId: site5, foremanId: foreman2Id, memberIds: [], createdAt: dIso(10) })

  // ── Participants ─────────────────────────────────────────────────────────
  const participantNames = [
    ['Siphamandla', 'Ndlovu'], ['Nokwanda', 'Mthembu'], ['Lungelo', 'Shabalala'],
    ['Thandeka', 'Dube'], ['Mxolisi', 'Zwane'], ['Bongiwe', 'Mhlongo'],
    ['Sibusiso', 'Majola'], ['Nompumelelo', 'Gumede'], ['Vusumuzi', 'Ntanzi'],
    ['Khanyisile', 'Mkhize'], ['Siyanda', 'Khoza'], ['Phindile', 'Ngcobo'],
    ['Thulani', 'Maphumulo'], ['Buhle', 'Ngema'], ['Mthokozisi', 'Dlamini'],
    ['Zanele', 'Zuma'], ['Sandile', 'Mthethwa'], ['Nokuthula', 'Ntuli'],
    ['Sibonelo', 'Vilakazi'], ['Nokukhanya', 'Hadebe'], ['Sifiso', 'Mbatha'],
    ['Ntombizethu', 'Mchunu'], ['Lungisa', 'Ngubane'], ['Nonhlanhla', 'Mthiyane'],
    ['Msizi', 'Zwane'], ['Thenjiwe', 'Gcaba'], ['Muziwethu', 'Mthethwa'],
    ['Nokubonga', 'Radebe'], ['Sandisiwe', 'Bhengu'], ['Mfanafuthi', 'Ngcobo'],
    ['Thabisile', 'Zungu'], ['Nkosinathi', 'Shange'], ['Fikiswa', 'Khoza'],
    ['Mthobisi', 'Buthelezi'], ['Nobuhle', 'Dlamini'], ['Sibusisiwe', 'Mkhize'],
    ['Xolani', 'Shelembe'], ['Lungisiwe', 'Gumbi'], ['Thembekile', 'Nkosi'],
    ['Nomvula', 'Mthethwa'], ['Sifundo', 'Nzuza'], ['Thembinkosi', 'Mzila'],
    ['Nomalanga', 'Ntanzi'], ['Mthembeni', 'Khumalo'], ['Ntombifikile', 'Mchunu'],
    ['Bhekani', 'Mdlalose'], ['Lungekile', 'Mgenge'], ['Tholakele', 'Myeni'],
    ['Noxolo', 'Ngema'], ['Sibongiseni', 'Ngubane'],
  ]
  const suburbs = ['Soweto', 'Alexandra', 'Diepsloot', 'Tembisa', 'Khayelitsha', 'Meadowlands', 'Ivory Park', 'Thokoza']
  const teamIds = [team1.id, team2.id, team3.id, undefined, undefined]

  const seededParticipants = []
  for (let i = 0; i < participantNames.length; i++) {
    const [firstName, lastName] = participantNames[i]
    seededParticipants.push(await insertEntity('participants', {
      id: uid(),
      firstName, lastName,
      idNumber: `${7800000000000 + i * 1013}`,
      phone: `06${String(10000000 + i * 13379).slice(0, 8)}`,
      email: i % 3 === 0 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com` : undefined,
      address: `${10 + i * 7} ${['Freedom', 'Unity', 'Hope', 'Justice', 'Peace'][i % 5]} Street`,
      suburb: suburbs[i % suburbs.length],
      city: i % 5 < 3 ? 'Johannesburg' : 'Cape Town',
      emergencyContact: `${['Mama', 'Baba', 'Sister', 'Brother'][i % 4]} ${lastName}`,
      emergencyPhone: `07${String(10000000 + i * 7781).slice(0, 8)}`,
      skills: [['road repair', 'pothole', 'compaction'], ['gardening', 'landscaping'], ['cleaning', 'sanitation'], ['administration', 'data capture'], ['school building', 'plastering']][i % 5],
      teamId: teamIds[i % 5],
      status: i < 45 ? 'active' : (i === 47 ? 'graduated' : 'inactive'),
      registeredAt: dIso(180 - i * 3),
      registeredBy: adminId,
    }))
  }

  // ── Cards ────────────────────────────────────────────────────────────────
  const activeParticipants = seededParticipants.filter((p) => p.status === 'active').slice(0, 40)
  const seededCards = []
  for (let i = 0; i < activeParticipants.length; i++) {
    const p = activeParticipants[i]
    const balance = [120, 80, 40, 200, 160, 0, 320, 240, 80, 400][i % 10]
    const card = await insertEntity('cards', {
      id: uid(),
      cardNumber: `OPH-${String(1001 + i).padStart(4, '0')}`,
      participantId: p.id,
      balance,
      totalLoaded: balance + [240, 160, 320, 80, 400][i % 5],
      totalSpent: [240, 160, 320, 80, 400][i % 5],
      status: i === 3 ? 'suspended' : 'active',
      issuedAt: dIso(120 - i * 2),
      issuedBy: storeUserId,
      lastUsed: i % 4 !== 3 ? dIso(i % 5) : undefined,
    })
    seededCards.push(card)
    await insertEntity('participants', { ...p, cardId: card.id })
  }

  // ── Skills + assessments ─────────────────────────────────────────────────
  const skillDefs = [
    { name: 'Pothole Repair', category: 'technical', description: 'Identifying and patching potholes correctly' },
    { name: 'Road Marking', category: 'technical', description: 'Applying road signs and lane markings' },
    { name: 'Compaction Operation', category: 'technical', description: 'Operating vibrating plate compactor' },
    { name: 'Landscaping', category: 'technical', description: 'Planting, pruning, and maintaining green spaces' },
    { name: 'Safety Awareness', category: 'safety', description: 'PPE use, hazard identification, first aid basics' },
    { name: 'Tool Handling', category: 'safety', description: 'Correct use and storage of hand tools' },
    { name: 'Data Capture', category: 'administrative', description: 'Entering attendance and shift records accurately' },
    { name: 'Report Writing', category: 'administrative', description: 'Writing daily and weekly progress reports' },
    { name: 'Team Leadership', category: 'leadership', description: 'Guiding and motivating team members' },
    { name: 'Conflict Resolution', category: 'leadership', description: 'De-escalating workplace disputes' },
  ]
  const seededSkills = []
  for (const s of skillDefs) seededSkills.push(await insertEntity('skills', { ...s, id: uid() }))

  for (let pi = 0; pi < Math.min(15, seededParticipants.length); pi++) {
    for (let si = 0; si < Math.min(4, seededSkills.length); si++) {
      await insertEntity('skill_assessments', {
        id: uid(),
        participantId: seededParticipants[pi].id,
        skillId: seededSkills[si].id,
        level: 40 + ((pi + si) * 17) % 60,
        assessedBy: foremanId,
        assessedAt: dIso(30 - si * 5),
        notes: si === 0 ? 'Good progress shown' : undefined,
      })
    }
  }

  // ── Shifts ───────────────────────────────────────────────────────────────
  const shiftTasks = ['Pothole repair', 'Road marking', 'Debris clearing', 'Grass cutting', 'Refuse collection', 'Plastering', 'Data entry', 'Community liaison', 'Equipment maintenance', 'Safety inspection']
  const shiftStatuses = ['approved', 'approved', 'approved', 'completed', 'completed', 'rejected', 'absent']
  const allSiteIds = [site1, site2, site3, site4, site5]
  const allForemanIds = [foremanId, foreman2Id, foreman3Id, foremanId, foreman2Id]
  const seededShifts = []

  for (let d_ = 30; d_ >= 0; d_--) {
    const count = d_ === 0 ? 15 : 8 + (d_ % 3)
    for (let j = 0; j < count; j++) {
      const pIdx = (d_ * 7 + j * 3) % seededParticipants.length
      const siteIdx = j % allSiteIds.length
      const status = d_ === 0 ? (j < 10 ? 'completed' : 'in_progress') : shiftStatuses[(d_ + j) % shiftStatuses.length]
      const fId = allForemanIds[siteIdx]

      seededShifts.push(await insertEntity('shifts', {
        id: uid(),
        participantId: seededParticipants[pIdx].id,
        siteId: allSiteIds[siteIdx],
        teamId: [team1.id, team2.id, team3.id][siteIdx % 3],
        date: dateStr(-d_),
        startTime: '07:00',
        endTime: '11:00',
        task: shiftTasks[(d_ + j) % shiftTasks.length],
        foremanId: fId,
        status,
        hoursWorked: status !== 'absent' ? 4 : 0,
        approvedBy: status === 'approved' ? fId : undefined,
        approvedAt: status === 'approved' ? dIso(d_, 11) : undefined,
        rejectionReason: status === 'rejected' ? 'Participant did not meet PPE requirements' : undefined,
        notes: j === 0 ? 'Good work today' : undefined,
        createdAt: dIso(d_, 6, 30),
      }))
    }
  }

  // ── Payments ─────────────────────────────────────────────────────────────
  const approvedShifts = seededShifts.filter((s) => s.status === 'approved')
  for (let idx = 0; idx < approvedShifts.length; idx++) {
    const shift = approvedShifts[idx]
    const participant = seededParticipants.find((p) => p.id === shift.participantId)
    if (!participant?.cardId) continue
    const daysAgo = (idx % 20) + 1
    const processed = idx % 7 !== 0

    await insertEntity('payments', {
      id: uid(),
      participantId: shift.participantId,
      cardId: participant.cardId,
      shiftId: shift.id,
      amount: 80,
      status: processed ? 'processed' : 'pending',
      processedAt: processed ? dIso(Math.max(daysAgo - 1, 0), 14) : undefined,
      processedBy: processed ? storeUserId : undefined,
      createdAt: dIso(daysAgo, 12),
    })
  }

  // ── Transactions ─────────────────────────────────────────────────────────
  const transCategories = ['groceries', 'clothing', 'healthcare', 'atm', 'payment']
  const transDescs = ['Groceries at SPAR', 'Clothing at Mr Price', 'Pharmacy purchase', 'ATM withdrawal', 'Bill payment', 'Woolworths groceries', 'Clothing from Edgars', 'Capitec ATM']

  for (let ci = 0; ci < Math.min(30, seededCards.length); ci++) {
    const card = seededCards[ci]
    const txCount = 3 + (ci % 5)
    let runningBalance = card.balance
    for (let t = txCount - 1; t >= 0; t--) {
      const amount = [40, 60, 80, 120, 30, 50][t % 6]
      const daysAgo = t * 4 + (ci % 3)
      const balanceBefore = runningBalance + amount
      await insertEntity('transactions', {
        id: uid(),
        cardId: card.id,
        participantId: card.participantId,
        amount,
        type: 'debit',
        description: transDescs[(ci + t) % transDescs.length],
        category: transCategories[(ci + t) % transCategories.length],
        merchantId: t % 3 !== 2 ? `merchant_${(ci + t) % 5}` : undefined,
        atmId: t % 3 === 2 ? `atm_${t % 5}` : undefined,
        balanceBefore,
        balanceAfter: runningBalance,
        createdAt: dIso(daysAgo, 10 + (t % 8)),
      })
      runningBalance = balanceBefore
    }
  }

  // ── Partner Shops ────────────────────────────────────────────────────────
  const shopDefs = [
    { name: "Mama Precious's SPAR", address: '45 Main St', suburb: 'Soweto', ownerName: 'Precious Mthembu', ownerEmail: 'partner@ophelp.org', phone: '011 555 1001', category: 'grocery', acceptedSince: dIso(365), contractExpiry: dateStr(180), status: 'active', monthlyTransactionCount: 312, monthlyTransactionValue: 24960, userId: partnerId },
    { name: "Khumalo's Pharmacy", address: '12 Bree Rd', suburb: 'Alexandra', ownerName: 'Themba Khumalo', ownerEmail: 'khumalo.pharm@mail.com', phone: '011 555 1002', category: 'pharmacy', acceptedSince: dIso(300), contractExpiry: dateStr(120), status: 'active', monthlyTransactionCount: 145, monthlyTransactionValue: 8700 },
    { name: 'Style Zone Clothing', address: '7 Market St', suburb: 'Diepsloot', ownerName: 'Linda Dlamini', ownerEmail: 'stylezone@mail.com', phone: '011 555 1003', category: 'clothing', acceptedSince: dIso(200), contractExpiry: dateStr(90), status: 'active', monthlyTransactionCount: 89, monthlyTransactionValue: 17800 },
    { name: 'Tembisa Hardware', address: '33 Tembisa Ave', suburb: 'Tembisa', ownerName: 'Piet van der Merwe', ownerEmail: 'tembisahardware@mail.com', phone: '011 555 1004', category: 'hardware', acceptedSince: dIso(150), contractExpiry: dateStr(60), status: 'active', monthlyTransactionCount: 43, monthlyTransactionValue: 12900 },
    { name: 'Soweto General Store', address: '2 Freedom Square', suburb: 'Meadowlands', ownerName: 'Nomsa Sithole', ownerEmail: 'sowetostore@mail.com', phone: '011 555 1005', category: 'general', acceptedSince: dIso(100), contractExpiry: dateStr(30), status: 'active', monthlyTransactionCount: 220, monthlyTransactionValue: 17600 },
    { name: 'Alex Grocery Hub', address: '8 Pan Africa Dr', suburb: 'Alexandra', ownerName: 'James Mokgosi', ownerEmail: 'alexgroc@mail.com', phone: '011 555 1006', category: 'grocery', acceptedSince: dIso(50), contractExpiry: dateStr(240), status: 'active', monthlyTransactionCount: 180, monthlyTransactionValue: 14400 },
    { name: 'Ivory Park Superette', address: '56 Phase 1', suburb: 'Ivory Park', ownerName: 'Sarah Mahlangu', ownerEmail: 'ivorypark.shop@mail.com', phone: '011 555 1007', category: 'grocery', acceptedSince: dIso(30), contractExpiry: dateStr(300), status: 'pending', monthlyTransactionCount: 0, monthlyTransactionValue: 0 },
  ]
  for (const s of shopDefs) await insertEntity('partner_shops', { ...s, id: uid() })

  // ── ATM Locations ────────────────────────────────────────────────────────
  const atmDefs = [
    { name: 'Soweto Civic Centre ATM', address: '1 Freedom Square', suburb: 'Soweto', latitude: -26.2673, longitude: 27.8587, status: 'operational', lastChecked: dIso(0) },
    { name: 'Alexandra Community Hall ATM', address: '10 Pan Africa Blvd', suburb: 'Alexandra', latitude: -26.1028, longitude: 28.0955, status: 'operational', lastChecked: dIso(1) },
    { name: 'Diepsloot SASSA Point ATM', address: '5 Extension 1', suburb: 'Diepsloot', latitude: -25.9398, longitude: 28.0103, status: 'operational', lastChecked: dIso(0) },
    { name: 'Tembisa Plaza ATM', address: '1 Tembisa Plaza', suburb: 'Tembisa', latitude: -25.9944, longitude: 28.2265, status: 'maintenance', lastChecked: dIso(2) },
    { name: 'Meadowlands Post Office ATM', address: '2 Station Rd', suburb: 'Meadowlands', latitude: -26.2481, longitude: 27.9124, status: 'operational', lastChecked: dIso(0) },
    { name: 'Khayelitsha Mall ATM', address: '20 Ntlazane Rd', suburb: 'Khayelitsha', latitude: -34.0382, longitude: 18.6731, status: 'operational', lastChecked: dIso(1) },
    { name: 'Ivory Park Taxi Rank ATM', address: '78 Ivory Park Rd', suburb: 'Ivory Park', latitude: -26.0112, longitude: 28.2089, status: 'offline', lastChecked: dIso(3) },
  ]
  for (const a of atmDefs) await insertEntity('atm_locations', { ...a, id: uid() })

  // ── Projects ─────────────────────────────────────────────────────────────
  const projectDefs = [
    { name: 'Soweto Road Rehabilitation Phase 2', description: 'Full resurfacing of 12km of municipal roads in Soweto township.', siteId: site1, managerId, foremanId, deadline: dateStr(30), startDate: dateStr(-60), progressPct: 68, status: 'on_track', teamSize: 45, budget: 850000, spent: 578000, tags: ['roads', 'infrastructure', 'EPWP'],
      milestones: [
        { id: uid(), title: 'Site preparation complete', dueDate: dateStr(-40), completedAt: dIso(45), status: 'completed' },
        { id: uid(), title: 'Phase A resurfacing (4km)', dueDate: dateStr(-10), completedAt: dIso(12), status: 'completed' },
        { id: uid(), title: 'Phase B resurfacing (4km)', dueDate: dateStr(10), status: 'in_progress' },
        { id: uid(), title: 'Phase C and final inspection', dueDate: dateStr(28), status: 'pending' },
      ] },
    { name: 'Alexandra Greening Initiative', description: 'Planting 500 indigenous trees and establishing community vegetable gardens.', siteId: site2, managerId, foremanId: foreman2Id, deadline: dateStr(45), startDate: dateStr(-45), progressPct: 55, status: 'on_track', teamSize: 30, budget: 620000, spent: 341000, tags: ['parks', 'environment', 'community'],
      milestones: [
        { id: uid(), title: 'Site assessment and soil testing', dueDate: dateStr(-30), completedAt: dIso(32), status: 'completed' },
        { id: uid(), title: 'First 200 trees planted', dueDate: dateStr(-5), completedAt: dIso(6), status: 'completed' },
        { id: uid(), title: 'Community gardens established', dueDate: dateStr(20), status: 'in_progress' },
        { id: uid(), title: 'Remaining trees and maintenance plan', dueDate: dateStr(44), status: 'pending' },
      ] },
    { name: 'Diepsloot Sanitation Drive', description: 'Daily cleaning rosters, illegal dump clearance, and waterway protection.', siteId: site3, managerId, foremanId: foreman3Id, deadline: dateStr(60), startDate: dateStr(-30), progressPct: 72, status: 'at_risk', teamSize: 38, budget: 710000, spent: 511200, tags: ['sanitation', 'environment', 'health'],
      milestones: [
        { id: uid(), title: 'Rosters and routes defined', dueDate: dateStr(-20), completedAt: dIso(22), status: 'completed' },
        { id: uid(), title: 'Illegal dump site clearance', dueDate: dateStr(5), status: 'in_progress' },
        { id: uid(), title: 'Waterway protection barriers', dueDate: dateStr(30), status: 'pending' },
        { id: uid(), title: 'Community awareness campaign', dueDate: dateStr(55), status: 'pending' },
      ] },
    { name: 'Meadowlands Community School Build', description: 'Construction of 4-classroom community school for 200 learners.', siteId: site4, managerId, foremanId, deadline: dateStr(100), startDate: dateStr(-20), progressPct: 40, status: 'on_track', teamSize: 20, budget: 1200000, spent: 480000, tags: ['education', 'construction', 'community'],
      milestones: [
        { id: uid(), title: 'Foundation and concrete slab', dueDate: dateStr(-5), completedAt: dIso(6), status: 'completed' },
        { id: uid(), title: 'Brick walls to window height', dueDate: dateStr(20), status: 'in_progress' },
        { id: uid(), title: 'Roof structure and tiling', dueDate: dateStr(55), status: 'pending' },
        { id: uid(), title: 'Plastering, windows and doors', dueDate: dateStr(80), status: 'pending' },
        { id: uid(), title: 'Handover and snagging', dueDate: dateStr(98), status: 'pending' },
      ] },
    { name: 'OPHELP Digital Admin Upgrade', description: 'Rolling out new digital attendance and payment systems across all sites.', siteId: site5, managerId, foremanId: foreman2Id, deadline: dateStr(10), startDate: dateStr(-90), progressPct: 85, status: 'on_track', teamSize: 12, budget: 300000, spent: 255000, tags: ['admin', 'technology', 'OPHELP'],
      milestones: [
        { id: uid(), title: 'System requirements gathered', dueDate: dateStr(-70), completedAt: dIso(72), status: 'completed' },
        { id: uid(), title: 'Pilot rollout at 2 sites', dueDate: dateStr(-30), completedAt: dIso(32), status: 'completed' },
        { id: uid(), title: 'Full rollout across all 6 sites', dueDate: dateStr(-5), completedAt: dIso(6), status: 'completed' },
        { id: uid(), title: 'Training and handover', dueDate: dateStr(8), status: 'in_progress' },
      ] },
  ]
  for (const p of projectDefs) await insertEntity('projects', { ...p, id: uid() })

  // ── Equipment ────────────────────────────────────────────────────────────
  const equipDefs = [
    { name: 'Isuzu Truck (Site 1)', serialNumber: 'TRK-001-2021', category: 'vehicle', siteId: site1, condition: 'good', purchasedAt: dIso(730), purchaseValue: 380000, nextServiceDate: dateStr(30), status: 'in_use' },
    { name: 'Vibrating Plate Compactor', serialNumber: 'VPC-002-2022', category: 'machinery', siteId: site1, condition: 'good', purchasedAt: dIso(365), purchaseValue: 22000, nextServiceDate: dateStr(60), status: 'in_use' },
    { name: 'Pressure Washer', serialNumber: 'PW-003-2023', category: 'machinery', siteId: site3, condition: 'fair', purchasedAt: dIso(200), purchaseValue: 8500, status: 'in_use' },
    { name: 'Admin Laptop (Tembisa)', serialNumber: 'LPT-001-HP-2023', category: 'it', siteId: site5, condition: 'excellent', purchasedAt: dIso(180), purchaseValue: 14000, status: 'in_use' },
    { name: 'Safety Helmets (x20)', serialNumber: 'PPE-HELM-001', category: 'ppe', condition: 'good', purchasedAt: dIso(120), purchaseValue: 6000, status: 'available' },
    { name: 'High-Vis Vests (x50)', serialNumber: 'PPE-VEST-001', category: 'ppe', condition: 'fair', purchasedAt: dIso(100), purchaseValue: 3750, status: 'available' },
    { name: 'Wheelbarrows (x10)', serialNumber: 'TOOL-WB-001', category: 'tool', siteId: site1, condition: 'good', purchasedAt: dIso(200), purchaseValue: 7500, status: 'in_use' },
    { name: 'Concrete Mixer', serialNumber: 'MACH-CM-001', category: 'machinery', siteId: site4, condition: 'excellent', purchasedAt: dIso(30), purchaseValue: 32000, status: 'in_use' },
  ]
  for (const e of equipDefs) await insertEntity('equipment', { ...e, id: uid() })

  // ── Inventory ────────────────────────────────────────────────────────────
  const inventoryDefs = [
    { name: 'OPHELP Cards (Blank)', sku: 'CARD-001', category: 'card', quantity: 240, minQuantity: 50, unitCost: 15, supplier: 'CardTech SA', lastRestocked: dIso(7), location: 'Main Store' },
    { name: 'Safety Helmets', sku: 'PPE-HELM-02', category: 'ppe', quantity: 45, minQuantity: 20, unitCost: 280, supplier: 'SafetyFirst Pty', lastRestocked: dIso(14), location: 'Store Room A' },
    { name: 'High-Vis Vests', sku: 'PPE-VEST-02', category: 'ppe', quantity: 12, minQuantity: 30, unitCost: 75, supplier: 'SafetyFirst Pty', lastRestocked: dIso(30), location: 'Store Room A' },
    { name: 'Work Gloves (pairs)', sku: 'PPE-GLOVES-01', category: 'ppe', quantity: 130, minQuantity: 50, unitCost: 35, supplier: 'SafetyFirst Pty', lastRestocked: dIso(5), location: 'Store Room A' },
    { name: 'A4 Paper (reams)', sku: 'STAT-A4-01', category: 'stationery', quantity: 22, minQuantity: 10, unitCost: 65, supplier: 'PaperMart', lastRestocked: dIso(20), location: 'Admin Office' },
    { name: 'Work Uniforms (sets)', sku: 'UNIF-01', category: 'uniform', quantity: 68, minQuantity: 25, unitCost: 350, supplier: 'Clothing City', lastRestocked: dIso(10), location: 'Main Store' },
    { name: 'Cleaning Supplies (kit)', sku: 'CLEAN-KIT-01', category: 'cleaning', quantity: 38, minQuantity: 15, unitCost: 120, supplier: 'CleanPro', lastRestocked: dIso(3), location: 'Store Room B' },
    { name: 'Spades', sku: 'TOOL-SPADE-01', category: 'tools', quantity: 28, minQuantity: 10, unitCost: 180, supplier: 'Hardware Depot', lastRestocked: dIso(45), location: 'Equipment Bay' },
  ]
  for (const i of inventoryDefs) await insertEntity('inventory', { ...i, id: uid() })

  // ── Incidents ────────────────────────────────────────────────────────────
  const incidentDefs = [
    { siteId: site1, reportedBy: foremanId, participantId: seededParticipants[2].id, title: 'Slip and fall on wet surface', description: 'Participant slipped on wet tar during pothole repair. Minor knee injury treated on site.', severity: 'low', status: 'resolved', actionTaken: 'First aid applied. Wet surface marked. Participant returned to light duties.', resolvedBy: foremanId, resolvedAt: dIso(13), createdAt: dIso(14) },
    { siteId: site3, reportedBy: foreman3Id, title: 'Stray dog attack near dump site', description: 'Team member threatened by stray dogs while clearing an illegal dump site.', severity: 'medium', status: 'investigating', createdAt: dIso(5) },
    { siteId: site2, reportedBy: foreman2Id, title: 'Stolen equipment', description: 'Two wheelbarrows reported missing overnight. SAPS case opened.', severity: 'medium', status: 'open', createdAt: dIso(10) },
    { siteId: site4, reportedBy: foremanId, participantId: seededParticipants[8].id, title: 'Eye injury — concrete dust', description: 'Participant was not wearing safety goggles. Concrete dust caused eye irritation.', severity: 'high', status: 'resolved', actionTaken: 'Medical treatment provided. PPE policy reinforced. Formal warning issued.', resolvedBy: adminId, resolvedAt: dIso(2), createdAt: dIso(3) },
    { siteId: site1, reportedBy: foremanId, title: 'Near miss — vehicle', description: 'Truck reversed close to a work team without spotter. No injuries.', severity: 'high', status: 'resolved', actionTaken: 'Truck driver retrained. Spotter system implemented for all vehicle movements.', resolvedBy: foremanId, resolvedAt: dIso(8), createdAt: dIso(9) },
  ]
  for (const i of incidentDefs) await insertEntity('incidents', { ...i, id: uid() })

  // ── Notifications ────────────────────────────────────────────────────────
  const notifDefs = [
    { userId: foremanId, type: 'shift_scheduled', title: '15 shifts scheduled for today', message: '15 participants are scheduled for morning shifts at your sites.', read: false, createdAt: dIso(0, 6) },
    { userId: storeUserId, type: 'payment_pending', title: '12 payments awaiting processing', message: '12 approved shifts have pending payments ready to load onto OPHELP Cards.', read: false, createdAt: dIso(0, 7) },
    { userId: adminId, type: 'incident_reported', title: 'New incident: Stray dog attack', message: 'A medium-severity incident was reported at Diepsloot Sanitation Crew.', read: false, createdAt: dIso(5) },
    { userId: adminId, type: 'card_low_balance', title: '3 cards have zero balance', message: 'Three participants have OPHELP Cards with R0 balance — review payment status.', read: true, createdAt: dIso(2) },
    { userId: managerId, type: 'system', title: 'Project deadline in 10 days', message: 'Soweto Road Rehabilitation Phase 2 deadline is approaching.', read: false, createdAt: dIso(0) },
    { userId: teamUserId, type: 'shift_approved', title: 'Your shift has been approved', message: `Sipho Dlamini approved your shift on ${dateStr(-1)}. R80 will be loaded to your card.`, read: false, createdAt: dIso(1) },
  ]
  for (const n of notifDefs) await insertEntity('notifications', { ...n, id: uid() })

  // ── Messages ─────────────────────────────────────────────────────────────
  const messageDefs = [
    { fromUserId: foremanId, toUserId: adminId, subject: 'Request: additional PPE for Site 1', body: 'We are running low on high-visibility vests at the Soweto Road site. Please arrange a restock urgently.', read: false, createdAt: dIso(1, 9) },
    { fromUserId: adminId, toUserId: managerId, subject: 'Budget review reminder', body: 'Please submit your Q3 budget reconciliation by end of this week.', read: true, createdAt: dIso(2, 10) },
    { fromUserId: managerId, toUserId: adminId, subject: 'Re: Budget review reminder', body: 'Noted. I will have the reconciliation ready by Thursday.', read: true, createdAt: dIso(2, 11) },
    { fromUserId: foreman3Id, toUserId: foremanId, subject: 'Sharing best practice — compaction technique', body: 'Hi Sipho, I wanted to share the compaction technique we used in Diepsloot. Very effective on sandy ground.', read: false, createdAt: dIso(0, 8) },
  ]
  for (const m of messageDefs) await insertEntity('messages', { ...m, id: uid() })

  // ── Audit Logs ───────────────────────────────────────────────────────────
  await insertEntity('audit_logs', { id: uid(), userId: adminId, action: 'Database seeded', entity: 'system', entityId: 'seed', detail: 'Initial seed data loaded', createdAt: dIso(180) })
  await insertEntity('audit_logs', { id: uid(), userId: adminId, action: 'User created', entity: 'user', entityId: foreman2Id, detail: 'Created foreman account for Nandi Mahlangu', createdAt: dIso(100) })
  await insertEntity('audit_logs', { id: uid(), userId: storeUserId, action: 'Cards issued', entity: 'card', entityId: 'batch', detail: `${seededCards.length} OPHELP Cards issued to participants`, createdAt: dIso(120) })
  await insertEntity('audit_logs', { id: uid(), userId: foremanId, action: 'Batch shifts approved', entity: 'shift', entityId: 'batch', detail: `12 shifts approved for week ending ${dateStr(-7)}`, createdAt: dIso(7) })
  await insertEntity('audit_logs', { id: uid(), userId: storeUserId, action: 'Batch payments processed', entity: 'payment', entityId: 'batch', detail: 'R960 loaded across 12 OPHELP Cards', createdAt: dIso(6) })

  console.log('[seed] Done.')
  await pool.end()
}

seed().catch(async (err) => {
  console.error('[seed] Failed:', err)
  await pool.end()
  process.exit(1)
})
