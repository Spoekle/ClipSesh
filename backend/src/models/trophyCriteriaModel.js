const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     TrophyCriteria:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the trophy
 *           required: true
 *         description:
 *           type: string
 *           description: Description of what this trophy is for
 *           required: true
 *         criteriaType:
 *           type: string
 *           enum: ['most_ratings', 'most_denies', 'most_ratings_one_day', 'most_one_ratings', 'most_recent_ratings', 'custom']
 *           description: Type of criteria for awarding this trophy
 *           required: true
 *         customCriteria:
 *           type: object
 *           description: Custom criteria configuration for complex trophy rules
 *         isActive:
 *           type: boolean
 *           description: Whether this trophy criteria is active
 *           default: true
 *         season:
 *           type: string
 *           description: Season this trophy applies to (if season-specific)
 *         year:
 *           type: number
 *           description: Year this trophy applies to (if year-specific)
 *         awardLimit:
 *           type: number
 *           description: Maximum number of users who can receive this trophy
 *           default: 1
 *         minValue:
 *           type: number
 *           description: Minimum value required to be eligible for this trophy
 *           default: 1
 */

const trophyCriteriaSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  criteriaType: { 
    type: String, 
    enum: [
      'most_ratings',           // User with most total ratings
      'most_denies',            // User with most deny ratings  
      'most_ratings_one_day',   // User with most ratings in a single day
      'most_one_ratings',       // User with most 1-star ratings
      'most_recent_ratings',    // User with most ratings in final days of season
      'most_four_ratings',      // User with most 4-star ratings
      'most_active_days',       // User active on most days
      'best_average_rating',    // User with best average rating given
      'custom'                  // Custom criteria
    ], 
    required: true 
  },  customCriteria: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: undefined
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },  season: { 
    type: String,
    enum: ['Spring', 'Summer', 'Fall', 'Winter'],
    default: undefined
  },
  year: { 
    type: Number 
  },
  awardLimit: { 
    type: Number, 
    default: 1 
  },
  minValue: { 
    type: Number, 
    default: 1 
  },
  priority: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Index for efficient querying
trophyCriteriaSchema.index({ isActive: 1, season: 1, year: 1 });
trophyCriteriaSchema.index({ criteriaType: 1 });

const TrophyCriteria = mongoose.model('TrophyCriteria', trophyCriteriaSchema);

module.exports = TrophyCriteria;
