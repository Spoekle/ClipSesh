const mongoose = require('mongoose');
const User = require('../../models/userModel');
require('dotenv').config();

async function migrateJoinDate() {
    try {
        await mongoose.connect(process.env.DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to database');

        // Find users without joinDate and set it to their createdAt timestamp
        const usersWithoutJoinDate = await User.find({ 
            joinDate: { $exists: false } 
        });

        console.log(`Found ${usersWithoutJoinDate.length} users without joinDate`);

        for (const user of usersWithoutJoinDate) {
            // Use createdAt from the ObjectId if available, otherwise use current date
            const joinDate = user._id.getTimestamp() || new Date();
            
            await User.findByIdAndUpdate(user._id, {
                joinDate: joinDate
            });
            
            console.log(`Updated user ${user.username} with joinDate: ${joinDate}`);
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    migrateJoinDate();
}

module.exports = migrateJoinDate;
