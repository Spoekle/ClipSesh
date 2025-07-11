const TrophyCriteria = require('../models/trophyCriteriaModel');
const Rating = require('../models/ratingModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

/**
 * Trophy Service - Handles automatic trophy assignment based on criteria
 */
class TrophyService {
  
  /**
   * Calculate and assign trophies for a specific season and year
   */
  static async assignTrophiesForSeason(season, year) {
    console.log(`Starting trophy assignment for ${season} ${year}`);
    
    try {
      // Get all active trophy criteria (season/year will be applied during trophy assignment)
      const criteria = await TrophyCriteria.find({
        isActive: true
      }).sort({ priority: -1 });

      console.log(`Found ${criteria.length} active trophy criteria`);

      const trophyAssignments = [];

      for (const criterion of criteria) {
        console.log(`Processing criterion: ${criterion.name} (${criterion.criteriaType})`);
        
        const winners = await this.calculateTrophyWinners(criterion, season, year);
        
        for (const winner of winners) {
          console.log(`Assigning trophy "${criterion.name}" to user ${winner.userId}`);
          
          // Add trophy to user with the current processing season/year
          await this.assignTrophyToUser(winner.userId, {
            trophyName: criterion.name,
            description: criterion.description,
            dateEarned: new Date().toISOString(),
            season: season,
            year: year,
            value: winner.value
          });

          trophyAssignments.push({
            userId: winner.userId,
            username: winner.username,
            trophyName: criterion.name,
            value: winner.value
          });
        }
      }

      console.log(`Trophy assignment completed. Assigned ${trophyAssignments.length} trophies`);
      return trophyAssignments;

    } catch (error) {
      console.error('Error assigning trophies:', error);
      throw error;
    }
  }

  /**
   * Calculate trophy winners based on criteria
   */
  static async calculateTrophyWinners(criterion, season, year) {
    const { criteriaType, awardLimit, minValue } = criterion;

    try {
      let winners = [];

      switch (criteriaType) {
        case 'most_ratings':
          winners = await this.getMostRatingsWinners(season, year, awardLimit, minValue);
          break;
        
        case 'most_denies':
          winners = await this.getMostDeniesWinners(season, year, awardLimit, minValue);
          break;
        
        case 'most_ratings_one_day':
          winners = await this.getMostRatingsOneDayWinners(season, year, awardLimit, minValue);
          break;
        
        case 'most_one_ratings':
          winners = await this.getMostOneRatingsWinners(season, year, awardLimit, minValue);
          break;
        
        case 'most_recent_ratings':
          winners = await this.getMostRecentRatingsWinners(season, year, awardLimit, minValue);
          break;
        
        case 'most_four_ratings':
          winners = await this.getMostFourRatingsWinners(season, year, awardLimit, minValue);
          break;
        
        case 'most_active_days':
          winners = await this.getMostActiveDaysWinners(season, year, awardLimit, minValue);
          break;
        
        case 'best_average_rating':
          winners = await this.getBestAverageRatingWinners(season, year, awardLimit, minValue);
          break;
        
        case 'custom':
          winners = await this.getCustomCriteriaWinners(criterion, season, year);
          break;
        
        default:
          console.warn(`Unknown criteria type: ${criteriaType}`);
      }

      return winners;
    } catch (error) {
      console.error(`Error calculating winners for ${criteriaType}:`, error);
      return [];
    }
  }

  /**
   * Get users with most total ratings
   */
  static async getMostRatingsWinners(season, year, limit, minValue) {
    const seasonDateRange = this.getSeasonDateRange(season, year);
    
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: seasonDateRange.start,
            $lte: seasonDateRange.end
          }
        }
      },
      {
        $project: {
          allRatings: {
            $concatArrays: [
              '$ratings.1', '$ratings.2', '$ratings.3', '$ratings.4', '$ratings.deny'
            ]
          }
        }
      },
      { $unwind: '$allRatings' },
      {
        $group: {
          _id: '$allRatings.userId',
          totalRatings: { $sum: 1 },
          username: { $first: '$allRatings.username' }
        }
      },
      {
        $match: {
          totalRatings: { $gte: minValue }
        }
      },
      { $sort: { totalRatings: -1 } },
      { $limit: limit }
    ];

    const results = await Rating.aggregate(pipeline);
    return results.map(r => ({
      userId: r._id,
      username: r.username,
      value: r.totalRatings
    }));
  }

  /**
   * Get users with most deny ratings
   */
  static async getMostDeniesWinners(season, year, limit, minValue) {
    const seasonDateRange = this.getSeasonDateRange(season, year);
    
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: seasonDateRange.start,
            $lte: seasonDateRange.end
          }
        }
      },
      { $unwind: '$ratings.deny' },
      {
        $group: {
          _id: '$ratings.deny.userId',
          totalDenies: { $sum: 1 },
          username: { $first: '$ratings.deny.username' }
        }
      },
      {
        $match: {
          totalDenies: { $gte: minValue }
        }
      },
      { $sort: { totalDenies: -1 } },
      { $limit: limit }
    ];

    const results = await Rating.aggregate(pipeline);
    return results.map(r => ({
      userId: r._id,
      username: r.username,
      value: r.totalDenies
    }));
  }

  /**
   * Get users with most ratings in a single day
   */
  static async getMostRatingsOneDayWinners(season, year, limit, minValue) {
    const seasonDateRange = this.getSeasonDateRange(season, year);
    
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: seasonDateRange.start,
            $lte: seasonDateRange.end
          }
        }
      },
      {
        $project: {
          allRatings: {
            $concatArrays: [
              '$ratings.1', '$ratings.2', '$ratings.3', '$ratings.4', '$ratings.deny'
            ]
          }
        }
      },
      { $unwind: '$allRatings' },
      {
        $group: {
          _id: {
            userId: '$allRatings.userId',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$allRatings.timestamp'
              }
            }
          },
          dailyRatings: { $sum: 1 },
          username: { $first: '$allRatings.username' }
        }
      },
      {
        $group: {
          _id: '$_id.userId',
          maxDailyRatings: { $max: '$dailyRatings' },
          username: { $first: '$username' }
        }
      },
      {
        $match: {
          maxDailyRatings: { $gte: minValue }
        }
      },
      { $sort: { maxDailyRatings: -1 } },
      { $limit: limit }
    ];

    const results = await Rating.aggregate(pipeline);
    return results.map(r => ({
      userId: r._id,
      username: r.username,
      value: r.maxDailyRatings
    }));
  }

  /**
   * Get users with most 1-star ratings
   */
  static async getMostOneRatingsWinners(season, year, limit, minValue) {
    const seasonDateRange = this.getSeasonDateRange(season, year);
    
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: seasonDateRange.start,
            $lte: seasonDateRange.end
          }
        }
      },
      { $unwind: '$ratings.1' },
      {
        $group: {
          _id: '$ratings.1.userId',
          totalOneRatings: { $sum: 1 },
          username: { $first: '$ratings.1.username' }
        }
      },
      {
        $match: {
          totalOneRatings: { $gte: minValue }
        }
      },
      { $sort: { totalOneRatings: -1 } },
      { $limit: limit }
    ];

    const results = await Rating.aggregate(pipeline);
    return results.map(r => ({
      userId: r._id,
      username: r.username,
      value: r.totalOneRatings
    }));
  }

  /**
   * Get users with most 4-star ratings
   */
  static async getMostFourRatingsWinners(season, year, limit, minValue) {
    const seasonDateRange = this.getSeasonDateRange(season, year);
    
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: seasonDateRange.start,
            $lte: seasonDateRange.end
          }
        }
      },
      { $unwind: '$ratings.4' },
      {
        $group: {
          _id: '$ratings.4.userId',
          totalFourRatings: { $sum: 1 },
          username: { $first: '$ratings.4.username' }
        }
      },
      {
        $match: {
          totalFourRatings: { $gte: minValue }
        }
      },
      { $sort: { totalFourRatings: -1 } },
      { $limit: limit }
    ];

    const results = await Rating.aggregate(pipeline);
    return results.map(r => ({
      userId: r._id,
      username: r.username,
      value: r.totalFourRatings
    }));
  }

  /**
   * Get users with most ratings in the final days of the season
   */
  static async getMostRecentRatingsWinners(season, year, limit, minValue) {
    const seasonDateRange = this.getSeasonDateRange(season, year);
    const finalDays = 7; // Last 7 days of season
    const finalPeriodStart = new Date(seasonDateRange.end.getTime() - (finalDays * 24 * 60 * 60 * 1000));
    
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: finalPeriodStart,
            $lte: seasonDateRange.end
          }
        }
      },
      {
        $project: {
          allRatings: {
            $concatArrays: [
              '$ratings.1', '$ratings.2', '$ratings.3', '$ratings.4', '$ratings.deny'
            ]
          }
        }
      },
      { $unwind: '$allRatings' },
      {
        $match: {
          'allRatings.timestamp': {
            $gte: finalPeriodStart,
            $lte: seasonDateRange.end
          }
        }
      },
      {
        $group: {
          _id: '$allRatings.userId',
          recentRatings: { $sum: 1 },
          username: { $first: '$allRatings.username' }
        }
      },
      {
        $match: {
          recentRatings: { $gte: minValue }
        }
      },
      { $sort: { recentRatings: -1 } },
      { $limit: limit }
    ];

    const results = await Rating.aggregate(pipeline);
    return results.map(r => ({
      userId: r._id,
      username: r.username,
      value: r.recentRatings
    }));
  }

  /**
   * Get users active on most days
   */
  static async getMostActiveDaysWinners(season, year, limit, minValue) {
    const seasonDateRange = this.getSeasonDateRange(season, year);
    
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: seasonDateRange.start,
            $lte: seasonDateRange.end
          }
        }
      },
      {
        $project: {
          allRatings: {
            $concatArrays: [
              '$ratings.1', '$ratings.2', '$ratings.3', '$ratings.4', '$ratings.deny'
            ]
          }
        }
      },
      { $unwind: '$allRatings' },
      {
        $group: {
          _id: {
            userId: '$allRatings.userId',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$allRatings.timestamp'
              }
            }
          },
          username: { $first: '$allRatings.username' }
        }
      },
      {
        $group: {
          _id: '$_id.userId',
          activeDays: { $sum: 1 },
          username: { $first: '$username' }
        }
      },
      {
        $match: {
          activeDays: { $gte: minValue }
        }
      },
      { $sort: { activeDays: -1 } },
      { $limit: limit }
    ];

    const results = await Rating.aggregate(pipeline);
    return results.map(r => ({
      userId: r._id,
      username: r.username,
      value: r.activeDays
    }));
  }

  /**
   * Get users with best average rating given
   */
  static async getBestAverageRatingWinners(season, year, limit, minValue) {
    const seasonDateRange = this.getSeasonDateRange(season, year);
    
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: seasonDateRange.start,
            $lte: seasonDateRange.end
          }
        }
      },
      {
        $project: {
          allRatings: {
            $concatArrays: [
              { $map: { input: '$ratings.1', as: 'r', in: { userId: '$$r.userId', username: '$$r.username', value: 1 } } },
              { $map: { input: '$ratings.2', as: 'r', in: { userId: '$$r.userId', username: '$$r.username', value: 2 } } },
              { $map: { input: '$ratings.3', as: 'r', in: { userId: '$$r.userId', username: '$$r.username', value: 3 } } },
              { $map: { input: '$ratings.4', as: 'r', in: { userId: '$$r.userId', username: '$$r.username', value: 4 } } }
            ]
          }
        }
      },
      { $unwind: '$allRatings' },
      {
        $group: {
          _id: '$allRatings.userId',
          avgRating: { $avg: '$allRatings.value' },
          totalRatings: { $sum: 1 },
          username: { $first: '$allRatings.username' }
        }
      },
      {
        $match: {
          totalRatings: { $gte: minValue }
        }
      },
      { $sort: { avgRating: -1 } },
      { $limit: limit }
    ];

    const results = await Rating.aggregate(pipeline);
    return results.map(r => ({
      userId: r._id,
      username: r.username,
      value: Math.round(r.avgRating * 100) / 100 // Round to 2 decimal places
    }));
  }

  /**
   * Handle custom criteria (placeholder for now)
   */  static async getCustomCriteriaWinners(criterion, season, year) {
    try {
      const { customCriteria, awardLimit, minValue } = criterion;
      
      if (!customCriteria || !customCriteria.type) {
        console.warn('Custom criteria missing type configuration');
        return [];
      }

      let aggregationPipeline = [];
      
      // Base filtering for the season/year
      const seasonFilter = {
        season: season,
        year: year
      };

      switch (customCriteria.type) {
        case 'rating_count_range':
          // Count ratings within a specific range (e.g., ratings between 2-4)
          aggregationPipeline = await this.buildRatingCountRangePipeline(customCriteria, seasonFilter);
          break;
          
        case 'rating_percentage':
          // Based on percentage of ratings of a certain type (e.g., >80% ratings are 4-star)
          aggregationPipeline = await this.buildRatingPercentagePipeline(customCriteria, seasonFilter);
          break;
          
        case 'time_based':
          // Based on specific time periods or patterns
          aggregationPipeline = await this.buildTimeBasedPipeline(customCriteria, seasonFilter);
          break;
          
        case 'streak_based':
          // Based on consecutive days or patterns
          aggregationPipeline = await this.buildStreakBasedPipeline(customCriteria, seasonFilter);
          break;
          
        case 'combined_metrics':
          // Combination of multiple metrics with weights
          aggregationPipeline = await this.buildCombinedMetricsPipeline(customCriteria, seasonFilter);
          break;
          
        case 'advanced_query':
          // Custom MongoDB aggregation query
          aggregationPipeline = customCriteria.pipeline || [];
          break;
          
        default:
          console.warn(`Unknown custom criteria type: ${customCriteria.type}`);
          return [];
      }

      if (aggregationPipeline.length === 0) {
        return [];
      }

      // Add minimum value filter if specified
      if (minValue > 0) {
        aggregationPipeline.push({
          $match: { value: { $gte: minValue } }
        });
      }

      // Sort by value descending and limit results
      aggregationPipeline.push(
        { $sort: { value: -1 } },
        { $limit: awardLimit || 1 }
      );

      const results = await Rating.aggregate(aggregationPipeline);
      
      return results.map(result => ({
        userId: result._id,
        value: result.value,
        details: result.details || {}
      }));

    } catch (error) {
      console.error('Error in getCustomCriteriaWinners:', error);
      return [];
    }
  }

  // Helper methods for building custom aggregation pipelines
  static async buildRatingCountRangePipeline(criteria, seasonFilter) {
    const { ratingRange, operation = 'count' } = criteria;
    
    return [
      {
        $match: seasonFilter
      },
      {
        $unwind: {
          path: '$ratings',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'ratings.rating': { 
            $in: ratingRange || ['1', '2', '3', '4'] 
          }
        }
      },
      {
        $group: {
          _id: '$ratings.userId',
          value: operation === 'count' ? { $sum: 1 } : { $avg: { $toDouble: '$ratings.rating' } },
          totalRatings: { $sum: 1 }
        }
      }
    ];
  }

  static async buildRatingPercentagePipeline(criteria, seasonFilter) {
    const { targetRating, minPercentage, minTotalRatings = 10 } = criteria;
    
    return [
      {
        $match: seasonFilter
      },
      {
        $unwind: {
          path: '$ratings',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$ratings.userId',
          totalRatings: { $sum: 1 },
          targetRatings: {
            $sum: {
              $cond: [
                { $eq: ['$ratings.rating', targetRating] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $match: {
          totalRatings: { $gte: minTotalRatings }
        }
      },
      {
        $addFields: {
          percentage: {
            $multiply: [
              { $divide: ['$targetRatings', '$totalRatings'] },
              100
            ]
          }
        }
      },
      {
        $match: {
          percentage: { $gte: minPercentage || 50 }
        }
      },
      {
        $addFields: {
          value: '$percentage'
        }
      }
    ];
  }

  static async buildTimeBasedPipeline(criteria, seasonFilter) {
    const { timePattern, metric = 'count' } = criteria;
    
    let dateMatch = {};
    const now = new Date();
    
    switch (timePattern) {
      case 'last_week':
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateMatch = { createdAt: { $gte: lastWeek } };
        break;
      case 'weekend_only':
        dateMatch = {
          $expr: {
            $in: [{ $dayOfWeek: '$createdAt' }, [1, 7]] // Sunday = 1, Saturday = 7
          }
        };
        break;
      case 'late_night':
        dateMatch = {
          $expr: {
            $or: [
              { $gte: [{ $hour: '$createdAt' }, 22] },
              { $lt: [{ $hour: '$createdAt' }, 6] }
            ]
          }
        };
        break;
    }
    
    return [
      {
        $match: { ...seasonFilter, ...dateMatch }
      },
      {
        $unwind: {
          path: '$ratings',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$ratings.userId',
          value: { $sum: 1 },
          details: {
            $push: {
              date: '$createdAt',
              rating: '$ratings.rating'
            }
          }
        }
      }
    ];
  }

  static async buildStreakBasedPipeline(criteria, seasonFilter) {
    const { streakType = 'consecutive_days', minStreak = 3 } = criteria;
    
    // This is a simplified version - streak calculation would need more complex logic
    return [
      {
        $match: seasonFilter
      },
      {
        $unwind: {
          path: '$ratings',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            userId: '$ratings.userId',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            }
          },
          dailyCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.userId',
          activeDays: { $sum: 1 },
          value: { $sum: 1 } // Simplified - actual streak calculation would be more complex
        }
      },
      {
        $match: {
          activeDays: { $gte: minStreak }
        }
      }
    ];
  }

  static async buildCombinedMetricsPipeline(criteria, seasonFilter) {
    const { metrics, weights } = criteria;
    
    // This would combine multiple metrics with different weights
    // Simplified implementation - would need more complex aggregation
    return [
      {
        $match: seasonFilter
      },
      {
        $unwind: {
          path: '$ratings',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$ratings.userId',
          totalRatings: { $sum: 1 },
          averageRating: { $avg: { $toDouble: '$ratings.rating' } },
          denies: {
            $sum: {
              $cond: [{ $eq: ['$ratings.rating', 'deny'] }, 1, 0]
            }
          }
        }
      },
      {
        $addFields: {
          value: {
            $add: [
              { $multiply: ['$totalRatings', weights?.totalRatings || 1] },
              { $multiply: ['$averageRating', weights?.averageRating || 10] },
              { $multiply: ['$denies', weights?.denies || -5] }
            ]
          }
        }
      }
    ];
  }

  /**
   * Assign trophy to a user
   */
  static async assignTrophyToUser(userId, trophyData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.warn(`User ${userId} not found when assigning trophy`);
        return;
      }

      // Check if user already has this trophy for this season/year
      const existingTrophy = user.profile?.trophies?.find(t => 
        t.trophyName === trophyData.trophyName && 
        t.season === trophyData.season && 
        t.year === trophyData.year
      );

      if (existingTrophy) {
        console.log(`User ${userId} already has trophy ${trophyData.trophyName} for ${trophyData.season} ${trophyData.year}`);
        return;
      }

      // Initialize profile and trophies if they don't exist
      if (!user.profile) {
        user.profile = {};
      }
      if (!user.profile.trophies) {
        user.profile.trophies = [];
      }

      // Add the trophy
      user.profile.trophies.push(trophyData);
      await user.save();

      console.log(`Successfully assigned trophy ${trophyData.trophyName} to user ${userId}`);
    } catch (error) {
      console.error(`Error assigning trophy to user ${userId}:`, error);
    }
  }

  /**
   * Get date range for a season
   */
  static getSeasonDateRange(season, year) {
    const seasons = {
      'Spring': { start: [2, 21], end: [5, 20] },  // March 21 - June 20
      'Summer': { start: [5, 21], end: [8, 20] },  // June 21 - September 20
      'Fall': { start: [8, 21], end: [11, 20] },   // September 21 - December 20
      'Winter': { start: [11, 21], end: [2, 20] }  // December 21 - March 20 (next year for winter)
    };

    const seasonData = seasons[season];
    if (!seasonData) {
      throw new Error(`Invalid season: ${season}`);
    }

    let startYear = year;
    let endYear = year;

    // Handle winter season spanning two years
    if (season === 'Winter') {
      endYear = year + 1;
    }

    const start = new Date(startYear, seasonData.start[0], seasonData.start[1]);
    const end = new Date(endYear, seasonData.end[0], seasonData.end[1], 23, 59, 59);

    return { start, end };
  }
}

module.exports = TrophyService;
