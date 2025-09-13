// FILE: seed.js (Corrected and Secure)

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <-- IMPORT BCRYPT
const Company = require('./models/company.model');
const User = require('./models/user.model');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding...');

        // Clear existing data
        await Company.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing Companies and Users.');

        // Create a Company
        const mainCompany = await Company.create({
            name: 'Innovate Corp',
            address: '123 Tech Park, Pimpri-Chinchwad, India'
        });
        console.log(`Created company: ${mainCompany.name}`);

        // Create Users with plain text passwords
        let users = [
            {
                name: 'Admin User',
                email: 'admin@innovate.corp',
                password_hash: 'Admin@123',
                role: 'admin',
                company: mainCompany._id
            },
            {
                name: 'John Host',
                email: 'john.host@innovate.corp',
                password_hash: 'Host@123',
                role: 'host',
                company: mainCompany._id
            },
            {
                name: 'Sam Security',
                email: 'sam.security@innovate.corp',
                password_hash: 'Security@123',
                role: 'security',
                company: mainCompany._id
            }
        ];

        // --- MANUALLY HASH PASSWORDS ---
        const salt = await bcrypt.genSalt(10);
        for (let i = 0; i < users.length; i++) {
            users[i].password_hash = await bcrypt.hash(users[i].password_hash, salt);
        }
        // -----------------------------

        // Now, insert the users with hashed passwords
        await User.insertMany(users);
        console.log('Seeded 3 users (Admin, Host, Security) with hashed passwords.');

        console.log('--- SEEDING COMPLETE ---');
        console.log('NOTE: Passwords in the database are now hashed.');
        console.log('You can still use the original plain-text passwords to log in:');
        console.log('Admin Login: admin@innovate.corp / Admin@123');
        console.log('Host Login: john.host@innovate.corp / Host@123');
        console.log('Security Login: sam.security@innovate.corp / Security@123');
        
        process.exit();

    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

seedData();