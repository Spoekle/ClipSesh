# This is the configuration file for the discord bot, after filling in the variables, 
# rename this file to config.py

# Configuration variables:
# UPLOADBOT_USERNAME: The username of the bot account on the backend server
# UPLOADBOT_PASSWORD: The password of the bot account on the backend server
# BACKEND_URL: The URL of the backend server (fallback if not available in DB)
#
# Note: The following settings are now managed through the admin dashboard:
# - DISCORD_BOT_TOKEN: The Discord bot token
# - CLIP_CHANNEL_IDS: List of Discord channel IDs to monitor for clips
# - BACKEND_URL: The backend URL for API calls (can be overridden here)
#
# You can still provide DISCORD_BOT_TOKEN here as a fallback if the backend is unreachable.

UPLOADBOT_USERNAME=""
UPLOADBOT_PASSWORD=""
BACKEND_URL="http://backend:3000"  # Default for Docker environment

# Optional fallback Discord bot token (only used if token can't be fetched from backend)
DISCORD_BOT_TOKEN=""

