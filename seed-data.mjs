import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('//')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/')[3]?.split('?')[0] || 'adcms',
});

console.log('🌱 بدء إضافة البيانات التجريبية...');

try {
  // Add sample aircraft
  const aircraft = [
    { registration: 'SU-ABC', model: 'Boeing 737-800', location: 'Cairo', status: 'SERVICEABLE' },
    { registration: 'SU-XYZ', model: 'Airbus A320', location: 'Alexandria', status: 'SERVICEABLE' },
    { registration: 'SU-DEF', model: 'Boeing 777-300', location: 'Giza', status: 'DEFERRED' },
    { registration: 'SU-GHI', model: 'Airbus A330', location: 'Cairo', status: 'SERVICEABLE' },
  ];

  for (const ac of aircraft) {
    await connection.execute(
      'INSERT INTO aircraft (registration, model, location, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=?',
      [ac.registration, ac.model, ac.location, ac.status, ac.status]
    );
  }
  console.log('✅ تم إضافة الطائرات');

  // Get aircraft IDs
  const [aircraftRows] = await connection.execute('SELECT id, registration FROM aircraft');

  // Add sample defects
  const defects = [
    { aircraftId: aircraftRows[0].id, source: 'Pilot Report', description: 'Engine vibration during takeoff', status: 'OPEN' },
    { aircraftId: aircraftRows[0].id, source: 'Maintenance', description: 'Hydraulic pressure low', status: 'OPEN' },
    { aircraftId: aircraftRows[1].id, source: 'Cabin Crew', description: 'Air conditioning not working in cabin', status: 'DEFERRED' },
    { aircraftId: aircraftRows[2].id, source: 'Pilot Report', description: 'Landing gear warning light', status: 'OPEN' },
    { aircraftId: aircraftRows[3].id, source: 'Maintenance', description: 'Avionics system malfunction', status: 'CLOSED' },
  ];

  for (const defect of defects) {
    await connection.execute(
      'INSERT INTO defects (aircraftId, source, description, status) VALUES (?, ?, ?, ?)',
      [defect.aircraftId, defect.source, defect.description, defect.status]
    );
  }
  console.log('✅ تم إضافة الأعطال');

  // Get defect IDs
  const [defectRows] = await connection.execute('SELECT id FROM defects LIMIT 3');

  // Add sample MEL items
  const melItems = [
    { defectId: defectRows[0].id, category: 'A', reference: 'MEL-001', expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { defectId: defectRows[1].id, category: 'B', reference: 'MEL-002', expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { defectId: defectRows[2].id, category: 'C', reference: 'MEL-003', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  ];

  for (const mel of melItems) {
    await connection.execute(
      'INSERT INTO melItems (defectId, category, reference, expiryDate) VALUES (?, ?, ?, ?)',
      [mel.defectId, mel.category, mel.reference, mel.expiryDate]
    );
  }
  console.log('✅ تم إضافة عناصر الصيانة المؤجلة');

  // Add sample spare parts
  const spareParts = [
    { partCode: 'HYD-001', description: 'Hydraulic Pump Assembly', quantity: 5, location: 'Warehouse A', minStock: 2 },
    { partCode: 'ENG-002', description: 'Engine Oil Filter', quantity: 15, location: 'Warehouse B', minStock: 5 },
    { partCode: 'AVN-003', description: 'Avionics Control Unit', quantity: 1, location: 'Warehouse A', minStock: 1 },
    { partCode: 'LDG-004', description: 'Landing Gear Actuator', quantity: 2, location: 'Warehouse C', minStock: 2 },
    { partCode: 'CAB-005', description: 'Cabin Air Filter', quantity: 20, location: 'Warehouse B', minStock: 5 },
  ];

  for (const part of spareParts) {
    await connection.execute(
      'INSERT INTO spareParts (partCode, description, quantity, location, minStock) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity=?',
      [part.partCode, part.description, part.quantity, part.location, part.minStock, part.quantity]
    );
  }
  console.log('✅ تم إضافة قطع الغيار');

  // Add sample action logs
  const actionLogs = [
    { defectId: defectRows[0].id, actionTaken: 'Inspected engine mounts', nextAction: 'Replace engine mounts if damaged', engineerId: 1 },
    { defectId: defectRows[1].id, actionTaken: 'Checked hydraulic system', nextAction: 'Refill hydraulic fluid', engineerId: 1 },
    { defectId: defectRows[2].id, actionTaken: 'Inspected AC unit', nextAction: 'Schedule AC repair', engineerId: 2 },
  ];

  for (const log of actionLogs) {
    await connection.execute(
      'INSERT INTO actionLogs (defectId, actionTaken, nextAction, engineerId) VALUES (?, ?, ?, ?)',
      [log.defectId, log.actionTaken, log.nextAction, log.engineerId]
    );
  }
  console.log('✅ تم إضافة سجلات الإجراءات');

  console.log('🎉 تم إضافة جميع البيانات التجريبية بنجاح!');
} catch (error) {
  console.error('❌ خطأ:', error.message);
} finally {
  await connection.end();
}
