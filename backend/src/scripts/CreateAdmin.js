const bcrypt = require('bcrypt');
const User = require('../models/userModel.js');
const crypto = require('crypto');
require('dotenv').config();

const adminUsername = process.env.ADMIN_USERNAME || 'admin';

adminPassword = crypto.randomBytes(15).toString('hex').match(/.{1,5}/g).join('-');
process.env.ADMIN_PASSWORD = adminPassword;


const createAdminUser = async () => {
    try {
        const existingAdmin = await User.findOne({ username: adminUsername });
        let hashedPassword;
        if (!existingAdmin) {
            hashedPassword = await bcrypt.hash(adminPassword, 10);
            const adminUser = new User({
                username: adminUsername,
                password: hashedPassword,
                role: 'admin',
                status: 'active',
                profilePicture: 'https://api.spoekle.com/profilePictures/profile_placeholder.png'
            });
            await adminUser.save();
        } else {
            hashedPassword = await bcrypt.hash(adminPassword, 10);
            existingAdmin.password = hashedPassword;
            existingAdmin.role = 'admin';
            existingAdmin.status = 'active';
            existingAdmin.profilePicture = 'https://api.spoekle.com/profilePictures/profile_placeholder.png';
            await existingAdmin.save();
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

createAdminUser();