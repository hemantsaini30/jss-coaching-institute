require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');
const Class    = require('./models/Class');
const { generatePassword } = require('./utils/passwordHelper');

const TEACHER_NAMES = [
  'Abhay Verma', 'Ravi Kumar', 'Sunita Sharma', 'Manish Gupta',
  'Priya Singh', 'Anil Yadav', 'Kavita Mehta', 'Deepak Joshi',
  'Neha Patel', 'Rohit Tiwari',
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Class.deleteMany({});
  console.log('Cleared existing data');

  // ─── Admin ───
  const adminPass = generatePassword('ADMIN_01');
  await User.create({
    userID: 'ADMIN_01',
    passwordHash: await bcrypt.hash(adminPass, 10),
    role: 'admin',
    name: 'Admin',
  });
  console.log(`Admin created — ID: ADMIN_01 | Pass: ${adminPass}`);

  // ─── Teachers ───
  const teachers = [];
  for (let i = 1; i <= 10; i++) {
    const id   = `T_0${i}`;
    const pass = generatePassword(id);
    const teacher = await User.create({
      userID: id,
      passwordHash: await bcrypt.hash(pass, 10),
      role: 'teacher',
      name: TEACHER_NAMES[i - 1],
      assignedClasses: [],
    });
    teachers.push(teacher);
    console.log(`Teacher created — ID: ${id} | Pass: ${pass} | Name: ${TEACHER_NAMES[i - 1]}`);
  }

  // ─── Classes ───
  const classes = [
    { classID: 'C_01', className: 'Class 10 - Math',    subject: 'Mathematics', teacherIDs: ['T_01'] },
    { classID: 'C_02', className: 'Class 10 - Science', subject: 'Science',     teacherIDs: ['T_02'] },
    { classID: 'C_03', className: 'Class 9 - Math',     subject: 'Mathematics', teacherIDs: ['T_01'] },
  ];
  await Class.insertMany(classes);
  console.log('Classes created: C_01, C_02, C_03');

  // Update teacher assigned classes
  await User.updateOne({ userID: 'T_01' }, { assignedClasses: ['C_01', 'C_03'] });
  await User.updateOne({ userID: 'T_02' }, { assignedClasses: ['C_02'] });

  // ─── Students ───
  const studentClassMap = {};
  for (let i = 1; i <= 20; i++) studentClassMap[`S_${String(i).padStart(2,'0')}`] = 'C_01';
  for (let i = 21; i <= 40; i++) studentClassMap[`S_${String(i).padStart(2,'0')}`] = 'C_02';
  for (let i = 41; i <= 50; i++) studentClassMap[`S_${String(i).padStart(2,'0')}`] = 'C_03';

  let studentCount = 0;
  for (const [id, classID] of Object.entries(studentClassMap)) {
    const pass = generatePassword(id);
    await User.create({
      userID: id,
      passwordHash: await bcrypt.hash(pass, 10),
      role: 'student',
      name: `Student ${parseInt(id.replace(/\D/g,''))}`,
      classID,
    });
    studentCount++;
  }
  console.log(`${studentCount} students created`);

  // Print sample credentials
  console.log('\n═══ SAMPLE CREDENTIALS ═══');
  console.log('ADMIN_01 →', generatePassword('ADMIN_01'));
  console.log('T_01     →', generatePassword('T_01'));
  console.log('T_02     →', generatePassword('T_02'));
  console.log('S_01     →', generatePassword('S_01'));
  console.log('S_21     →', generatePassword('S_21'));
  console.log('S_41     →', generatePassword('S_41'));
  console.log('═══════════════════════════\n');

  await mongoose.disconnect();
  console.log('Seeding complete!');
}

seed().catch(console.error);