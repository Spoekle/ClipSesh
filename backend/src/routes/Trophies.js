const express = require('express');
const router = express.Router();
const TrophyCriteria = require('../models/trophyCriteriaModel');
const TrophyService = require('../services/trophyService');
const authorizeRoles = require('./middleware/AuthorizeRoles');

/**
 * @swagger
 * tags:
 *   name: trophies
 *   description: API for managing trophy criteria and assignments
 */

/**
 * @swagger
 * /api/trophies/criteria:
 *   get:
 *     tags:
 *       - trophies
 *     summary: Get all trophy criteria
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trophy criteria
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
router.get('/criteria', authorizeRoles(['admin']), async (req, res) => {
  try {
    const criteria = await TrophyCriteria.find().sort({ createdAt: -1 });
    res.json(criteria);
  } catch (error) {
    console.error('Error fetching trophy criteria:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/trophies/criteria:
 *   post:
 *     tags:
 *       - trophies
 *     summary: Create new trophy criteria
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrophyCriteria'
 *     responses:
 *       201:
 *         description: Trophy criteria created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
router.post('/criteria', authorizeRoles(['admin']), async (req, res) => {
  try {
    const criteriaData = req.body;
    
    // Validate required fields
    if (!criteriaData.name || !criteriaData.description || !criteriaData.criteriaType) {
      return res.status(400).json({ error: 'Name, description, and criteria type are required' });
    }    // Clean up data - remove empty strings for optional fields
    if (criteriaData.season === '') {
      delete criteriaData.season;
    }
    if (criteriaData.year === '') {
      delete criteriaData.year;
    }
    // Remove customCriteria if it's not a custom type or if it's empty
    if (criteriaData.criteriaType !== 'custom' || !criteriaData.customCriteria) {
      delete criteriaData.customCriteria;
    }

    const criteria = new TrophyCriteria(criteriaData);
    await criteria.save();
    
    res.status(201).json(criteria);
  } catch (error) {
    console.error('Error creating trophy criteria:', error);
    
    // Provide more detailed error messages for validation errors
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errorMessages,
        message: errorMessages.join(', ')
      });
    }
    
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

/**
 * @swagger
 * /api/trophies/criteria/{id}:
 *   put:
 *     tags:
 *       - trophies
 *     summary: Update trophy criteria
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trophy criteria ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrophyCriteria'
 *     responses:
 *       200:
 *         description: Trophy criteria updated successfully
 *       404:
 *         description: Trophy criteria not found
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
router.put('/criteria/:id', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
      // Clean up data - remove empty strings for optional fields
    if (updateData.season === '') {
      delete updateData.season;
    }
    if (updateData.year === '') {
      delete updateData.year;
    }
    // Remove customCriteria if it's not a custom type or if it's empty
    if (updateData.criteriaType !== 'custom' || !updateData.customCriteria) {
      delete updateData.customCriteria;
    }
    
    const criteria = await TrophyCriteria.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    
    if (!criteria) {
      return res.status(404).json({ error: 'Trophy criteria not found' });
    }
    
    res.json(criteria);
  } catch (error) {
    console.error('Error updating trophy criteria:', error);
    
    // Provide more detailed error messages for validation errors
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errorMessages,
        message: errorMessages.join(', ')
      });
    }
    
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

/**
 * @swagger
 * /api/trophies/criteria/{id}:
 *   delete:
 *     tags:
 *       - trophies
 *     summary: Delete trophy criteria
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trophy criteria ID
 *     responses:
 *       200:
 *         description: Trophy criteria deleted successfully
 *       404:
 *         description: Trophy criteria not found
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
router.delete('/criteria/:id', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const criteria = await TrophyCriteria.findByIdAndDelete(id);
    
    if (!criteria) {
      return res.status(404).json({ error: 'Trophy criteria not found' });
    }
    
    res.json({ success: true, message: 'Trophy criteria deleted successfully' });
  } catch (error) {
    console.error('Error deleting trophy criteria:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/trophies/assign/{season}/{year}:
 *   post:
 *     tags:
 *       - trophies
 *     summary: Manually trigger trophy assignment for a season
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: season
 *         required: true
 *         schema:
 *           type: string
 *         description: Season name
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year
 *     responses:
 *       200:
 *         description: Trophies assigned successfully
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
router.post('/assign/:season/:year', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { season, year } = req.params;
    
    console.log(`Manual trophy assignment requested for ${season} ${year}`);
    
    const trophyAssignments = await TrophyService.assignTrophiesForSeason(season, parseInt(year));
    
    res.json({
      success: true,
      message: `Assigned ${trophyAssignments.length} trophies for ${season} ${year}`,
      assignments: trophyAssignments
    });
  } catch (error) {
    console.error('Error manually assigning trophies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/trophies/assign:
 *   post:
 *     tags:
 *       - trophies
 *     summary: Manually assign trophies for a season/year
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               season:
 *                 type: string
 *               year:
 *                 type: number
 *     responses:
 *       200:
 *         description: Trophies assigned successfully
 *       400:
 *         description: Invalid request
 */
router.post('/assign', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { season, year } = req.body;
    
    if (!season || !year) {
      return res.status(400).json({ error: 'Season and year are required' });
    }
    
    const TrophyService = require('../services/trophyService');
    const result = await TrophyService.assignTrophiesForSeason(season, year);
    
    res.json(result);
  } catch (error) {
    console.error('Error assigning trophies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/trophies/criteria/types:
 *   get:
 *     tags:
 *       - trophies
 *     summary: Get available trophy criteria types
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available criteria types
 *       403:
 *         description: Forbidden
 */
router.get('/criteria/types', authorizeRoles(['admin']), (req, res) => {
  const criteriaTypes = [
    {
      value: 'most_ratings',
      label: 'Most Total Ratings',
      description: 'User who gave the most ratings overall'
    },
    {
      value: 'most_denies',
      label: 'Most Denies',
      description: 'User who gave the most deny ratings'
    },
    {
      value: 'most_ratings_one_day',
      label: 'Most Ratings in One Day',
      description: 'User who gave the most ratings in a single day'
    },
    {
      value: 'most_one_ratings',
      label: 'Most 1-Star Ratings',
      description: 'User who gave the most 1-star ratings'
    },
    {
      value: 'most_recent_ratings',
      label: 'Most Recent Ratings',
      description: 'User who gave the most ratings in final days of season'
    },
    {
      value: 'most_four_ratings',
      label: 'Most 4-Star Ratings',
      description: 'User who gave the most 4-star ratings'
    },
    {
      value: 'most_active_days',
      label: 'Most Active Days',
      description: 'User who was active on the most days'
    },
    {
      value: 'best_average_rating',
      label: 'Best Average Rating',
      description: 'User with the highest average rating given'
    },
    {
      value: 'custom',
      label: 'Custom Criteria',
      description: 'Custom criteria (implementation required)'
    }
  ];
  
  res.json(criteriaTypes);
});

/**
 * @swagger
 * /api/trophies/custom-templates:
 *   get:
 *     tags:
 *       - trophies
 *     summary: Get available custom criteria templates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of custom criteria templates
 *       403:
 *         description: Forbidden
 */
router.get('/custom-templates', authorizeRoles(['admin']), (req, res) => {
  const templates = [
    {
      id: 'rating_count_range',
      name: 'Rating Count in Range',
      description: 'Count ratings within specific rating values',
      fields: [
        {
          key: 'ratingRange',
          label: 'Rating Range',
          type: 'multiselect',
          options: [
            { value: '1', label: '1 Star' },
            { value: '2', label: '2 Stars' },
            { value: '3', label: '3 Stars' },
            { value: '4', label: '4 Stars' },
            { value: 'deny', label: 'Deny' }
          ],
          required: true,
          default: ['1', '2', '3', '4']
        },
        {
          key: 'operation',
          label: 'Operation',
          type: 'select',
          options: [
            { value: 'count', label: 'Count Total' },
            { value: 'average', label: 'Average Rating' }
          ],
          default: 'count'
        }
      ],
      example: {
        type: 'rating_count_range',
        ratingRange: ['3', '4'],
        operation: 'count'
      }
    },
    {
      id: 'rating_percentage',
      name: 'Rating Percentage',
      description: 'Based on percentage of specific rating type',
      fields: [
        {
          key: 'targetRating',
          label: 'Target Rating',
          type: 'select',
          options: [
            { value: '1', label: '1 Star' },
            { value: '2', label: '2 Stars' },
            { value: '3', label: '3 Stars' },
            { value: '4', label: '4 Stars' },
            { value: 'deny', label: 'Deny' }
          ],
          required: true
        },
        {
          key: 'minPercentage',
          label: 'Minimum Percentage',
          type: 'number',
          min: 0,
          max: 100,
          default: 50,
          suffix: '%'
        },
        {
          key: 'minTotalRatings',
          label: 'Minimum Total Ratings',
          type: 'number',
          min: 1,
          default: 10,
          description: 'Minimum number of total ratings to be eligible'
        }
      ],
      example: {
        type: 'rating_percentage',
        targetRating: '4',
        minPercentage: 80,
        minTotalRatings: 20
      }
    },
    {
      id: 'time_based',
      name: 'Time-Based Activity',
      description: 'Based on specific time patterns',
      fields: [
        {
          key: 'timePattern',
          label: 'Time Pattern',
          type: 'select',
          options: [
            { value: 'last_week', label: 'Last Week Only' },
            { value: 'weekend_only', label: 'Weekends Only' },
            { value: 'late_night', label: 'Late Night (10PM-6AM)' }
          ],
          required: true
        },
        {
          key: 'metric',
          label: 'Metric',
          type: 'select',
          options: [
            { value: 'count', label: 'Total Count' },
            { value: 'unique_days', label: 'Unique Days' }
          ],
          default: 'count'
        }
      ],
      example: {
        type: 'time_based',
        timePattern: 'weekend_only',
        metric: 'count'
      }
    },
    {
      id: 'streak_based',
      name: 'Streak-Based',
      description: 'Based on consecutive activity patterns',
      fields: [
        {
          key: 'streakType',
          label: 'Streak Type',
          type: 'select',
          options: [
            { value: 'consecutive_days', label: 'Consecutive Days' },
            { value: 'daily_minimum', label: 'Daily Minimum Met' }
          ],
          default: 'consecutive_days'
        },
        {
          key: 'minStreak',
          label: 'Minimum Streak Length',
          type: 'number',
          min: 1,
          default: 3
        }
      ],
      example: {
        type: 'streak_based',
        streakType: 'consecutive_days',
        minStreak: 5
      }
    },
    {
      id: 'combined_metrics',
      name: 'Combined Metrics',
      description: 'Combination of multiple metrics with weights',
      fields: [
        {
          key: 'weights',
          label: 'Metric Weights',
          type: 'object',
          fields: [
            {
              key: 'totalRatings',
              label: 'Total Ratings Weight',
              type: 'number',
              default: 1,
              step: 0.1
            },
            {
              key: 'averageRating',
              label: 'Average Rating Weight',
              type: 'number',
              default: 10,
              step: 0.1
            },
            {
              key: 'denies',
              label: 'Denies Weight (negative)',
              type: 'number',
              default: -5,
              step: 0.1
            }
          ]
        }
      ],
      example: {
        type: 'combined_metrics',
        weights: {
          totalRatings: 1,
          averageRating: 10,
          denies: -5
        }
      }
    },
    {
      id: 'advanced_query',
      name: 'Advanced Query',
      description: 'Custom MongoDB aggregation pipeline',
      fields: [
        {
          key: 'pipeline',
          label: 'Aggregation Pipeline',
          type: 'json',
          description: 'MongoDB aggregation pipeline as JSON array',
          placeholder: '[{"$match": {"season": "Spring"}}, {"$group": {"_id": "$userId", "value": {"$sum": 1}}}]'
        }
      ],
      example: {
        type: 'advanced_query',
        pipeline: [
          { $match: { season: 'Spring' } },
          { $unwind: '$ratings' },
          { $group: { _id: '$ratings.userId', value: { $sum: 1 } } }
        ]
      }
    }
  ];
  
  res.json(templates);
});

/**
 * @swagger
 * /api/trophies/validate-criteria:
 *   post:
 *     tags:
 *       - trophies
 *     summary: Validate custom criteria configuration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customCriteria:
 *                 type: object
 *               season:
 *                 type: string
 *               year:
 *                 type: number
 *     responses:
 *       200:
 *         description: Validation result with preview data
 *       400:
 *         description: Invalid criteria configuration
 */
router.post('/validate-criteria', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { customCriteria, season, year } = req.body;
    
    if (!customCriteria || !customCriteria.type) {
      return res.status(400).json({ 
        error: 'Custom criteria configuration is required',
        valid: false 
      });
    }
    
    // Create a temporary criterion for validation
    const tempCriterion = {
      customCriteria,
      awardLimit: 5, // Limit for preview
      minValue: 0
    };
    
    // Test the criteria with current data
    const TrophyService = require('../services/trophyService');
    const previewResults = await TrophyService.getCustomCriteriaWinners(
      tempCriterion, 
      season || 'Spring', 
      parseInt(year) || new Date().getFullYear()
    );
    
    res.json({
      valid: true,
      previewResults,
      message: `Criteria is valid. Found ${previewResults.length} potential winners.`,
      resultCount: previewResults.length
    });
    
  } catch (error) {
    console.error('Error validating criteria:', error);
    res.status(400).json({
      valid: false,
      error: error.message || 'Invalid criteria configuration',
      details: error.toString()
    });
  }
});

/**
 * @swagger
 * /api/trophies/preview-winners:
 *   post:
 *     tags:
 *       - trophies
 *     summary: Preview winners for specific trophy criteria
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               criteriaId:
 *                 type: string
 *               season:
 *                 type: string
 *               year:
 *                 type: number
 *     responses:
 *       200:
 *         description: Preview results
 *       404:
 *         description: Criteria not found
 */
router.post('/preview-winners', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { criteriaId, season, year } = req.body;
    
    if (!criteriaId) {
      return res.status(400).json({ error: 'Criteria ID is required' });
    }
    
    const criteria = await TrophyCriteria.findById(criteriaId);
    if (!criteria) {
      return res.status(404).json({ error: 'Trophy criteria not found' });
    }
    
    const TrophyService = require('../services/trophyService');
    const winners = await TrophyService.calculateTrophyWinners(
      criteria, 
      season || criteria.season || 'Spring', 
      year || criteria.year || new Date().getFullYear()
    );
    
    // Get user details for the winners
    const User = require('../models/userModel');
    const winnersWithDetails = await Promise.all(
      winners.map(async (winner) => {
        const user = await User.findById(winner.userId).select('username profilePicture discordUsername');
        return {
          ...winner,
          user: user ? {
            username: user.username,
            profilePicture: user.profilePicture,
            discordUsername: user.discordUsername
          } : null
        };
      })
    );
    
    res.json({
      criteriaName: criteria.name,
      criteriaType: criteria.criteriaType,
      winners: winnersWithDetails,
      totalWinners: winnersWithDetails.length,
      season: season || criteria.season,
      year: year || criteria.year
    });
  } catch (error) {
    console.error('Error previewing trophy winners:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/trophies/preview-all:
 *   post:
 *     tags:
 *       - trophies
 *     summary: Preview winners for all active trophy criteria
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               season:
 *                 type: string
 *               year:
 *                 type: number
 *     responses:
 *       200:
 *         description: Preview results for all criteria
 */
router.post('/preview-all', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { season, year } = req.body;
    
    if (!season || !year) {
      return res.status(400).json({ error: 'Season and year are required' });
    }
    
    // Get all active criteria for this season/year or general criteria
    const criteria = await TrophyCriteria.find({
      isActive: true,
      $or: [
        { season: season, year: year },
        { season: { $exists: false }, year: { $exists: false } }
      ]
    }).sort({ priority: -1 });
    
    const TrophyService = require('../services/trophyService');
    const User = require('../models/userModel');
    
    const allResults = [];
    
    for (const criterion of criteria) {
      try {
        const winners = await TrophyService.calculateTrophyWinners(criterion, season, year);
        
        // Get user details for the winners
        const winnersWithDetails = await Promise.all(
          winners.map(async (winner) => {
            const user = await User.findById(winner.userId).select('username profilePicture discordUsername');
            return {
              ...winner,
              user: user ? {
                username: user.username,
                profilePicture: user.profilePicture,
                discordUsername: user.discordUsername
              } : null
            };
          })
        );
        
        allResults.push({
          criteriaId: criterion._id,
          criteriaName: criterion.name,
          criteriaType: criterion.criteriaType,
          winners: winnersWithDetails,
          totalWinners: winnersWithDetails.length
        });
      } catch (error) {
        console.error(`Error calculating winners for ${criterion.name}:`, error);
        allResults.push({
          criteriaId: criterion._id,
          criteriaName: criterion.name,
          criteriaType: criterion.criteriaType,
          winners: [],
          totalWinners: 0,
          error: error.message
        });
      }
    }
    
    const totalTrophies = allResults.reduce((sum, result) => sum + result.totalWinners, 0);
    
    res.json({
      season,
      year,
      criteria: allResults,
      totalCriteria: criteria.length,
      totalTrophies
    });
  } catch (error) {
    console.error('Error previewing all trophy winners:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
