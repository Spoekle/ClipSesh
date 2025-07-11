const mongoose = require('mongoose');
const Clip = require('../models/clipModel');
const { getCurrentSeason } = require('../utils/seasonHelpers');

/**
 * Migration script to add season, year, and archived fields to all existing clips
 * that don't already have these fields populated.
 * 
 * Usage:
 *   node src/scripts/migrateClipSeasons.js
 * 
 * Options:
 *   --dry-run: Show what would be updated without making changes
 *   --force: Update all clips regardless of existing values
 */

async function migrateClipSeasons(options = {}) {
  const { dryRun = false, force = false } = options;
  
  try {
    console.log('=== Clip Season Migration ===');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log(`Force update: ${force ? 'YES' : 'NO'}`);
    console.log('Starting migration...\n');
    
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect("mongodb://localhost:27017/clipsDB", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
    }

    // Build query based on force option
    let query = {};
    if (!force) {
      query = {
        $or: [
          { season: { $exists: false } },
          { season: null },
          { season: '' },
          { year: { $exists: false } },
          { year: null },
          { archived: { $exists: false } }
        ]
      };
    }

    // Get total count first for progress tracking
    const totalClips = await Clip.countDocuments(query);
    console.log(`Found ${totalClips} clips to process`);

    if (totalClips === 0) {
      console.log('No clips need migration. All clips already have season/year/archived fields.');
      return { success: true, updated: 0, errors: 0 };
    }

    // Find clips to update (with pagination for large datasets)
    const clipsToUpdate = await Clip.find(query).sort({ createdAt: 1 }); // Sort by oldest first

    console.log(`Processing ${clipsToUpdate.length} clips...`);

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const statistics = {
      seasons: { Winter: 0, Spring: 0, Summer: 0, Fall: 0 },
      years: {}
    };

    // Process clips in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < clipsToUpdate.length; i += batchSize) {
      const batch = clipsToUpdate.slice(i, i + batchSize);
      const progress = Math.round(((i + batch.length) / clipsToUpdate.length) * 100);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(clipsToUpdate.length / batchSize)} (${progress}%)...`);
      
      for (const clip of batch) {
        try {
          // Use the clip's createdAt date to determine the season and year
          const clipDate = clip.createdAt || new Date();
          const { season, year } = getCurrentSeason(clipDate);
          
          // Prepare the update object
          const updateData = {};
          let needsUpdate = false;
          
          // Capitalize season name to match schema enum
          const capitalizedSeason = season.charAt(0).toUpperCase() + season.slice(1);
          
          // Check if season needs updating
          if (force || !clip.season || clip.season === '') {
            updateData.season = capitalizedSeason;
            needsUpdate = true;
          }
          
          // Check if year needs updating
          if (force || !clip.year) {
            updateData.year = year;
            needsUpdate = true;
          }
          
          // Check if archived needs updating
          if (force || clip.archived === undefined || clip.archived === null) {
            updateData.archived = false; // Default to false for existing clips
            needsUpdate = true;
          }
          
          if (!needsUpdate) {
            skippedCount++;
            continue;
          }
          
          // Log what would be updated in dry run mode
          if (dryRun) {
            console.log(`[DRY RUN] Would update clip ${clip._id}: season=${updateData.season || clip.season}, year=${updateData.year || clip.year}, archived=${updateData.archived !== undefined ? updateData.archived : clip.archived}`);
            updatedCount++;
          } else {
            // Perform the actual update
            await Clip.findByIdAndUpdate(clip._id, updateData, { new: true });
            updatedCount++;
            
            if (updatedCount <= 10 || updatedCount % 50 === 0) { // Log first 10 and then every 50th
              console.log(`Updated clip ${clip._id}: season=${updateData.season || clip.season}, year=${updateData.year || clip.year}, archived=${updateData.archived !== undefined ? updateData.archived : clip.archived}, created=${clipDate.toISOString().split('T')[0]}`);
            }
          }
          
          // Update statistics
          const finalSeason = updateData.season || clip.season;
          const finalYear = updateData.year || clip.year;
          
          if (finalSeason && statistics.seasons[finalSeason] !== undefined) {
            statistics.seasons[finalSeason]++;
          }
          
          if (finalYear) {
            statistics.years[finalYear] = (statistics.years[finalYear] || 0) + 1;
          }
          
        } catch (error) {
          console.error(`Error ${dryRun ? 'simulating update for' : 'updating'} clip ${clip._id}:`, error.message);
          errorCount++;
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < clipsToUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log(`Total clips processed: ${clipsToUpdate.length}`);
    console.log(`Successfully ${dryRun ? 'would be updated' : 'updated'}: ${updatedCount}`);
    console.log(`Skipped (no changes needed): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    console.log('\n=== Statistics ===');
    console.log('Clips by season:');
    Object.entries(statistics.seasons).forEach(([season, count]) => {
      if (count > 0) {
        console.log(`  ${season}: ${count}`);
      }
    });
    
    console.log('Clips by year:');
    Object.entries(statistics.years)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([year, count]) => {
        console.log(`  ${year}: ${count}`);
      });

    if (!dryRun) {
      console.log('\nMigration completed!');
      
      // Verify the migration by checking a few random clips
      console.log('\n=== Verification Sample ===');
      const verificationClips = await Clip.find({}).limit(5).sort({ updatedAt: -1 });
      verificationClips.forEach(clip => {
        console.log(`Clip ${clip._id}: season=${clip.season}, year=${clip.year}, archived=${clip.archived}, created=${clip.createdAt?.toISOString().split('T')[0] || 'unknown'}`);
      });
    }

    return { 
      success: errorCount === 0, 
      updated: updatedCount, 
      errors: errorCount, 
      skipped: skippedCount,
      statistics 
    };

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force')
  };
}

// Run the migration if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  
  const options = parseArgs();
  
  if (options.dryRun) {
    console.log('Running in DRY RUN mode - no changes will be made');
  }
  
  if (options.force) {
    console.log('Force mode enabled - all clips will be updated');
  }
  
  migrateClipSeasons(options)
    .then((result) => {
      console.log('\nMigration script completed successfully');
      console.log(`Final result: ${result.updated} updated, ${result.errors} errors, ${result.skipped} skipped`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateClipSeasons;
