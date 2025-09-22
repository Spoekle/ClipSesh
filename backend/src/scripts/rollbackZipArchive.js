const mongoose = require('mongoose');
const Clip = require('../models/clipModel');
const Zip = require('../models/zipModel');
const { PublicConfig } = require('../models/configModel');

/**
 * Rollback script to unarchive clips that were processed in a zip
 * This script can rollback clips by:
 * 1. Season and Year
 * 2. Date range (when they were archived)
 * 3. Specific Zip ID
 * 4. All archived clips (dangerous!)
 * 
 * Usage:
 *   node src/scripts/rollbackZipArchive.js --season=Fall --year=2025
 *   node src/scripts/rollbackZipArchive.js --zipId=64f7b8c9e123456789abcdef
 *   node src/scripts/rollbackZipArchive.js --dateFrom=2025-09-01 --dateTo=2025-09-21
 *   node src/scripts/rollbackZipArchive.js --all (BE CAREFUL!)
 * 
 * Options:
 *   --dry-run: Show what would be unarchived without making changes
 *   --force: Skip confirmation prompts
 */

// Function to update clip count in database
async function updateClipCount() {
  try {
    const count = await Clip.countDocuments({ archived: { $ne: true } });
    await PublicConfig.findOneAndUpdate(
      {}, 
      { clipAmount: count }, 
      { upsert: true, new: true }
    );
    console.log(`✅ Updated clipAmount in config: ${count} active clips`);
    return count;
  } catch (error) {
    console.error('❌ Error updating clip count:', error);
    return null;
  }
}

// Function to prompt for user confirmation
function askForConfirmation(message) {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function rollbackArchive(options = {}) {
  const { dryRun = false, force = false, season, year, zipId, dateFrom, dateTo, all = false } = options;
  
  try {
    console.log('🔄 Starting Zip Archive Rollback Script');
    console.log('=====================================');
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
    }
    
    // Build query based on options
    let query = { archived: true };
    let description = '';
    
    if (all) {
      description = 'ALL archived clips';
      if (!force) {
        console.log('⚠️  WARNING: You are about to rollback ALL archived clips!');
        console.log('   This will unarchive every single archived clip in the database.');
        const confirmed = await askForConfirmation('Are you absolutely sure you want to continue?');
        if (!confirmed) {
          console.log('❌ Operation cancelled by user');
          return { success: false, message: 'Cancelled by user' };
        }
      }
    } else if (season && year) {
      query.season = { $regex: new RegExp(`^${season}$`, 'i') }; // Case insensitive match
      query.year = parseInt(year);
      description = `clips from ${season} ${year}`;
    } else if (zipId) {
      // For zipId, we need to find the zip first to get season/year
      const zip = await Zip.findById(zipId);
      if (!zip) {
        throw new Error(`Zip with ID ${zipId} not found`);
      }
      query.season = { $regex: new RegExp(`^${zip.season}$`, 'i') };
      query.year = zip.year;
      description = `clips from zip: ${zip.name} (${zip.season} ${zip.year})`;
    } else if (dateFrom || dateTo) {
      query.archivedAt = {};
      if (dateFrom) {
        query.archivedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 23:59:59 to include the entire day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.archivedAt.$lte = endDate;
      }
      description = `clips archived between ${dateFrom || 'beginning'} and ${dateTo || 'now'}`;
    } else {
      throw new Error('You must specify one of: --season & --year, --zipId, --dateFrom/--dateTo, or --all');
    }
    
    console.log(`🎯 Target: Rolling back ${description}`);
    console.log(`📋 Query:`, JSON.stringify(query, null, 2));
    
    // Find clips to rollback
    console.log('\n🔍 Finding clips to rollback...');
    const clipsToRollback = await Clip.find(query).sort({ archivedAt: -1 });
    
    if (clipsToRollback.length === 0) {
      console.log('ℹ️  No clips found matching the criteria');
      return { success: true, rolledBack: 0, message: 'No clips found to rollback' };
    }
    
    console.log(`📊 Found ${clipsToRollback.length} clips to rollback`);
    
    // Group clips by season/year for summary
    const seasonSummary = {};
    clipsToRollback.forEach(clip => {
      const key = `${clip.season || 'Unknown'} ${clip.year || 'Unknown'}`;
      if (!seasonSummary[key]) {
        seasonSummary[key] = 0;
      }
      seasonSummary[key]++;
    });
    
    console.log('\n📈 Breakdown by season:');
    Object.entries(seasonSummary).forEach(([season, count]) => {
      console.log(`   ${season}: ${count} clips`);
    });
    
    // Show sample of clips that will be affected
    console.log('\n📋 Sample of clips to be rolled back:');
    clipsToRollback.slice(0, 5).forEach((clip, index) => {
      console.log(`   ${index + 1}. "${clip.title}" by ${clip.streamer} (archived: ${clip.archivedAt?.toISOString().split('T')[0]})`);
    });
    
    if (clipsToRollback.length > 5) {
      console.log(`   ... and ${clipsToRollback.length - 5} more clips`);
    }
    
    // Confirmation if not in force mode
    if (!force && !dryRun) {
      console.log('\n⚠️  This will:');
      console.log('   - Set archived: false for all these clips');
      console.log('   - Clear the archivedAt timestamp');
      console.log('   - Make these clips visible and searchable again');
      console.log('   - Update the public clip count');
      
      const confirmed = await askForConfirmation(`\nProceed with rolling back ${clipsToRollback.length} clips?`);
      if (!confirmed) {
        console.log('❌ Operation cancelled by user');
        return { success: false, message: 'Cancelled by user' };
      }
    }
    
    if (dryRun) {
      console.log('\n🔍 DRY RUN - Would rollback the above clips');
      return { 
        success: true, 
        rolledBack: clipsToRollback.length, 
        message: `Would rollback ${clipsToRollback.length} clips (dry run)`,
        dryRun: true 
      };
    }
    
    // Perform the rollback
    console.log('\n🔄 Performing rollback...');
    
    const clipIds = clipsToRollback.map(clip => clip._id);
    
    const rollbackResult = await Clip.updateMany(
      { _id: { $in: clipIds } },
      { 
        $set: { 
          archived: false
        },
        $unset: {
          archivedAt: ""
        }
      }
    );
    
    console.log(`✅ Rollback completed: ${rollbackResult.modifiedCount} clips unarchived`);
    
    // Update clip count
    console.log('\n📊 Updating clip count...');
    const newClipCount = await updateClipCount();
    
    // Final summary
    console.log('\n🎉 Rollback Summary:');
    console.log(`   • Clips rolled back: ${rollbackResult.modifiedCount}`);
    console.log(`   • New active clip count: ${newClipCount}`);
    console.log(`   • Operation completed successfully`);
    
    return { 
      success: true, 
      rolledBack: rollbackResult.modifiedCount,
      newClipCount,
      message: `Successfully rolled back ${rollbackResult.modifiedCount} clips`
    };
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    force: false,
    all: false
  };
  
  args.forEach(arg => {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg.startsWith('--season=')) {
      options.season = arg.split('=')[1];
    } else if (arg.startsWith('--year=')) {
      options.year = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--zipId=')) {
      options.zipId = arg.split('=')[1];
    } else if (arg.startsWith('--dateFrom=')) {
      options.dateFrom = arg.split('=')[1];
    } else if (arg.startsWith('--dateTo=')) {
      options.dateTo = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Zip Archive Rollback Script
============================

Usage:
  node src/scripts/rollbackZipArchive.js [options]

Rollback Methods:
  --season=SEASON --year=YEAR    Rollback clips from specific season/year
  --zipId=ZIP_ID                 Rollback clips from specific zip processing
  --dateFrom=YYYY-MM-DD          Rollback clips archived from this date
  --dateTo=YYYY-MM-DD            Rollback clips archived until this date
  --all                          Rollback ALL archived clips (dangerous!)

Options:
  --dry-run                      Show what would be changed without making changes
  --force                        Skip confirmation prompts
  --help, -h                     Show this help message

Examples:
  # Rollback Fall 2025 clips (dry run first)
  node src/scripts/rollbackZipArchive.js --season=Fall --year=2025 --dry-run
  node src/scripts/rollbackZipArchive.js --season=Fall --year=2025

  # Rollback specific zip by ID
  node src/scripts/rollbackZipArchive.js --zipId=64f7b8c9e123456789abcdef

  # Rollback clips archived in September 2025
  node src/scripts/rollbackZipArchive.js --dateFrom=2025-09-01 --dateTo=2025-09-30

  # Emergency rollback all (with confirmation)
  node src/scripts/rollbackZipArchive.js --all
      `);
      process.exit(0);
    }
  });
  
  return options;
}

// Run the script if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    console.error('❌ Error: MONGO_URI or MONGODB_URI environment variable is required');
    process.exit(1);
  }
  
  const options = parseArgs();
  
  // Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      return rollbackArchive(options);
    })
    .then((result) => {
      console.log('\n✅ Script completed successfully');
      if (result.dryRun) {
        console.log('ℹ️  This was a dry run - no actual changes were made');
        console.log('💡 Run without --dry-run to perform the actual rollback');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      console.error('Full error:', error);
      process.exit(1);
    });
}

module.exports = rollbackArchive;
