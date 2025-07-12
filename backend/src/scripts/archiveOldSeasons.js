const mongoose = require('mongoose');
const Clip = require('../models/clipModel');
const { PublicConfig } = require('../models/configModel');
const { getCurrentSeason } = require('../utils/seasonHelpers');

/**
 * Archive script to set archived = true for all clips not from the current season
 * 
 * Usage:
 *   node src/scripts/archiveOldSeasons.js
 * 
 * Options:
 *   --dry-run: Show what would be archived without making changes
 *   --force: Archive clips even if they're already archived
 */

async function archiveOldSeasons(options = {}) {
  const { dryRun = false, force = false } = options;
  
  try {
    console.log('=== Archive Old Seasons Script ===');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log(`Force update: ${force ? 'YES' : 'NO'}`);
    console.log('Starting archive process...\n');
    
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect("mongodb://localhost:27017/clipsDB", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
    }

    // Get current season
    const currentSeason = getCurrentSeason();
    console.log(`Current season: ${currentSeason.season.charAt(0).toUpperCase() + currentSeason.season.slice(1)} ${currentSeason.year}`);
    
    // Build query to find clips NOT from current season
    let query = {
      $or: [
        // Clips from different seasons
        { season: { $ne: currentSeason.season.charAt(0).toUpperCase() + currentSeason.season.slice(1) } },
        // Clips from different years
        { year: { $ne: currentSeason.year } },
        // Clips without season/year data (legacy clips)
        { season: { $exists: false } },
        { season: null },
        { season: '' },
        { year: { $exists: false } },
        { year: null }
      ]
    };

    // If not forcing, exclude already archived clips
    if (!force) {
      query = {
        $and: [
          query,
          { 
            $or: [
              { archived: { $exists: false } },
              { archived: { $ne: true } }
            ]
          }
        ]
      };
    }

    console.log('Query for clips to archive:', JSON.stringify(query, null, 2));

    // Get total count first for progress tracking
    const totalClips = await Clip.countDocuments(query);
    console.log(`Found ${totalClips} clips to archive`);

    if (totalClips === 0) {
      console.log('No clips need archiving. All clips are either from current season or already archived.');
      return { success: true, archived: 0, errors: 0 };
    }

    // Find clips to archive (with pagination for large datasets)
    const clipsToArchive = await Clip.find(query).sort({ createdAt: 1 }); // Sort by oldest first

    console.log(`Processing ${clipsToArchive.length} clips...`);

    let archivedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const statistics = {
      seasons: { Winter: 0, Spring: 0, Summer: 0, Fall: 0, Unknown: 0 },
      years: {}
    };

    // Process clips in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < clipsToArchive.length; i += batchSize) {
      const batch = clipsToArchive.slice(i, i + batchSize);
      const progress = Math.round(((i + batch.length) / clipsToArchive.length) * 100);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(clipsToArchive.length / batchSize)} (${progress}%)...`);
      
      for (const clip of batch) {
        try {
          // Prepare the update object
          const updateData = {
            archived: true,
            archivedAt: new Date()
          };

          // If clip doesn't have season/year data, add it based on createdAt
          if (!clip.season || !clip.year) {
            const clipDate = clip.createdAt || new Date();
            const { season, year } = getCurrentSeason(clipDate);
            updateData.season = season.charAt(0).toUpperCase() + season.slice(1);
            updateData.year = year;
          }

          // Check if already archived (and not forcing)
          if (!force && clip.archived === true) {
            skippedCount++;
            continue;
          }
          
          // Log what would be updated in dry run mode
          if (dryRun) {
            console.log(`[DRY RUN] Would archive clip ${clip._id}: season=${updateData.season || clip.season}, year=${updateData.year || clip.year}, title="${clip.title}", streamer=${clip.streamer}`);
            archivedCount++;
          } else {
            // Perform the actual update
            await Clip.findByIdAndUpdate(clip._id, updateData, { new: true });
            archivedCount++;
            
            if (archivedCount <= 10 || archivedCount % 50 === 0) { // Log first 10 and then every 50th
              console.log(`Archived clip ${clip._id}: season=${updateData.season || clip.season}, year=${updateData.year || clip.year}, title="${clip.title}", created=${(clip.createdAt || new Date()).toISOString().split('T')[0]}`);
            }
          }
          
          // Update statistics
          const finalSeason = updateData.season || clip.season || 'Unknown';
          const finalYear = updateData.year || clip.year;
          
          if (statistics.seasons[finalSeason] !== undefined) {
            statistics.seasons[finalSeason]++;
          } else {
            statistics.seasons.Unknown++;
          }
          
          if (finalYear) {
            statistics.years[finalYear] = (statistics.years[finalYear] || 0) + 1;
          }
          
        } catch (error) {
          console.error(`Error ${dryRun ? 'simulating archive for' : 'archiving'} clip ${clip._id}:`, error.message);
          errorCount++;
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < clipsToArchive.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log('\n=== Archive Summary ===');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log(`Total clips processed: ${clipsToArchive.length}`);
    console.log(`Successfully ${dryRun ? 'would be archived' : 'archived'}: ${archivedCount}`);
    console.log(`Skipped (already archived): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    console.log('\n=== Statistics ===');
    console.log('Clips archived by season:');
    Object.entries(statistics.seasons).forEach(([season, count]) => {
      if (count > 0) {
        console.log(`  ${season}: ${count}`);
      }
    });
    
    console.log('Clips archived by year:');
    Object.entries(statistics.years)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([year, count]) => {
        console.log(`  ${year}: ${count}`);
      });

    if (!dryRun && archivedCount > 0) {
      console.log('\nUpdating clip count in configuration...');
      
      // Update clip count in config (only count non-archived clips)
      try {
        const activeClips = await Clip.countDocuments({ archived: { $ne: true } });
        await PublicConfig.findOneAndUpdate(
          {}, 
          { clipAmount: activeClips }, 
          { upsert: true, new: true }
        );
        console.log(`Updated clipAmount in config to: ${activeClips} active clips`);
      } catch (countError) {
        console.error('Error updating clip count:', countError);
      }
      
      console.log('\nArchiving completed!');
      
      // Verify the archiving by checking current season clips
      console.log('\n=== Verification ===');
      const remainingActiveClips = await Clip.find({ 
        archived: { $ne: true },
        season: currentSeason.season.charAt(0).toUpperCase() + currentSeason.season.slice(1),
        year: currentSeason.year
      }).limit(5);
      
      console.log(`Remaining active clips from current season (${currentSeason.season.charAt(0).toUpperCase() + currentSeason.season.slice(1)} ${currentSeason.year}):`);
      remainingActiveClips.forEach(clip => {
        console.log(`  Clip ${clip._id}: "${clip.title}" by ${clip.streamer}, created=${clip.createdAt?.toISOString().split('T')[0] || 'unknown'}`);
      });
      
      const totalActive = await Clip.countDocuments({ archived: { $ne: true } });
      const totalArchived = await Clip.countDocuments({ archived: true });
      console.log(`\nFinal counts: ${totalActive} active clips, ${totalArchived} archived clips`);
    }

    return { 
      success: errorCount === 0, 
      archived: archivedCount, 
      errors: errorCount, 
      skipped: skippedCount,
      statistics 
    };

  } catch (error) {
    console.error('Archive script failed:', error);
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

// Run the archiving if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  
  const options = parseArgs();
  
  if (options.dryRun) {
    console.log('Running in DRY RUN mode - no changes will be made');
  }
  
  if (options.force) {
    console.log('Force mode enabled - all old season clips will be archived');
  }
  
  archiveOldSeasons(options)
    .then((result) => {
      console.log('\nArchive script completed successfully');
      console.log(`Final result: ${result.archived} archived, ${result.errors} errors, ${result.skipped} skipped`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Archive script failed:', error);
      process.exit(1);
    });
}

module.exports = archiveOldSeasons;
