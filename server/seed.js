require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Class = require('./models/Class');
const { generatePassword } = require('./utils/passwordHelper');

const TEACHER_NAMES = [
    'Abhay Verma', 'Priya Sharma', 'Rahul Gupta', 'Sunita Singh', 'Vikram Yadav',
    'Meena Patel', 'Anjali Mishra', 'Suresh Kumar', 'Neha Joshi', 'Deepak Tiwari'
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await Promise.all([User.deleteMany(), Class.deleteMany()]);
    console.log('Cleared existing data');

    // Hash passwords
    async function hashPwd(userID) {
        const plain = generatePassword(userID);
        return bcrypt.hash(plain, 10);
    }

    // Admin
    const admin = await User.create({
        userID: 'ADMIN_01',
        passwordHash: await hashPwd('ADMIN_01'),
        role: 'admin',
        name: 'Admin'
    });
    console.log(`Admin: ADMIN_01 / ${generatePassword('ADMIN_01')}`);

    // Teachers
    const teachers = [];
    for (let i = 1; i <= 10; i++) {
        const userID = `T_${String(i).padStart(2, '0')}`;
        const teacher = await User.create({
            userID,
            passwordHash: await hashPwd(userID),
            role: 'teacher',
            name: TEACHER_NAMES[i - 1],
            assignedClasses: []
        });
        teachers.push(teacher);
        console.log(`Teacher: ${userID} / ${generatePassword(userID)} — ${TEACHER_NAMES[i - 1]}`);
    }

    // Classes
    const cls1 = await Class.create({ classID: 'CLS_01', className: 'Class 10 - Math', subject: 'Mathematics', teacherIDs: ['T_01'] });
    const cls2 = await Class.create({ classID: 'CLS_02', className: 'Class 10 - Science', subject: 'Science', teacherIDs: ['T_02'] });
    const cls3 = await Class.create({ classID: 'CLS_03', className: 'Class 9 - Math', subject: 'Mathematics', teacherIDs: ['T_01'] });
    console.log('Classes created');

    // Update teachers with assigned classes
    await User.updateOne({ userID: 'T_01' }, { assignedClasses: ['CLS_01', 'CLS_03'] });
    await User.updateOne({ userID: 'T_02' }, { assignedClasses: ['CLS_02'] });

    // Students
    const classAssignments = [
        ...Array.from({ length: 20 }, (_, i) => ({ num: i + 1, classID: 'CLS_01' })),
        ...Array.from({ length: 20 }, (_, i) => ({ num: i + 21, classID: 'CLS_02' })),
        ...Array.from({ length: 10 }, (_, i) => ({ num: i + 41, classID: 'CLS_03' }))
    ];

    const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Shreya', 'Aarohi', 'Saanvi', 'Myra', 'Pooja', 'Kavya', 'Riya', 'Priya', 'Rohan', 'Kunal', 'Manish', 'Nikhil', 'Rahul', 'Deepak', 'Amit', 'Vikas', 'Rajesh', 'Suraj', 'Prashant', 'Mukesh', 'Naresh', 'Sanjay', 'Ramesh', 'Ravi', 'Santosh', 'Dinesh', 'Mahesh', 'Rakesh', 'Tanvi', 'Nisha', 'Swati', 'Sunita', 'Rekha', 'Seema', 'Kiran', 'Meena', 'Geeta', 'Shweta'];

    for (const { num, classID } of classAssignments) {
        const userID = `S_${String(num).padStart(2, '0')}`;
        await User.create({
            userID,
            passwordHash: await hashPwd(userID),
            role: 'student',
            name: FIRST_NAMES[num - 1] || `Student ${num}`,
            classID
        });
    }
    console.log('50 Students created');

    console.log('\n=== SEED COMPLETE ===');
    console.log('Admin:    ADMIN_01 /', generatePassword('ADMIN_01'));
    console.log('Teachers: T_01 to T_10 (see passwords above)');
    console.log('Students: S_01 to S_50');
    console.log('Formula:  JSS + ((serial*7+123)%900+100)');
    console.log('Example:  S_01 →', generatePassword('S_01'));

    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });