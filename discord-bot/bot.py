import os
import re
import asyncio
import logging
import logging.handlers
import requests
import aiohttp
import time
import discord
import yt_dlp
import subprocess
import shutil
from datetime import datetime
from discord.ext import commands, tasks
from config import UPLOADBOT_USERNAME, UPLOADBOT_PASSWORD, BACKEND_URL as CONFIG_BACKEND_URL, DISCORD_BOT_TOKEN as CONFIG_BOT_TOKEN, CLIP_CHANNEL_ID as CONFIG_CHANNEL_IDS

BACKEND_URL = CONFIG_BACKEND_URL
BACKEND_TOKEN = None
BOT_CONFIG = {}
CLIP_CHANNEL_IDS = CONFIG_CHANNEL_IDS if isinstance(CONFIG_CHANNEL_IDS, list) else [CONFIG_CHANNEL_IDS] if CONFIG_CHANNEL_IDS else []
DISCORD_BOT_TOKEN = CONFIG_BOT_TOKEN

# Blacklist storage
BLACKLISTED_SUBMITTER_IDS = []
BLACKLISTED_STREAMERS = []

# Semaphore to limit concurrent clip processing (will be initialized in main)
CLIP_PROCESSING_SEMAPHORE = None

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Configure logging with daily rotation and better formatting
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Create formatters
detailed_formatter = logging.Formatter(
    '%(asctime)s | %(levelname)-8s | %(funcName)-20s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_formatter = logging.Formatter(
    '%(asctime)s | %(levelname)-5s | %(message)s',
    datefmt='%H:%M:%S'
)

# File handler with daily rotation
file_handler = logging.handlers.TimedRotatingFileHandler(
    'logs/bot.log',
    when='midnight',
    interval=1,
    backupCount=30,  # Keep 30 days of logs
    encoding='utf-8'
)
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(detailed_formatter)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(console_formatter)

# Add handlers to logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Reduce Discord library logging noise
logging.getLogger('discord').setLevel(logging.WARNING)
logging.getLogger('discord.gateway').setLevel(logging.WARNING)
logging.getLogger('discord.client').setLevel(logging.WARNING)

def get_backend_token():
    global BACKEND_URL
    if not BACKEND_URL:
        BACKEND_URL = CONFIG_BACKEND_URL
    
    try:
        logging.info(f"🔐 Authenticating with backend at {BACKEND_URL}")
        response = requests.post(
            f'{BACKEND_URL}/api/users/login', 
            json={
                'username': UPLOADBOT_USERNAME,
                'password': UPLOADBOT_PASSWORD
            },
            timeout=10
        )
        
        if response.status_code == 400:
            logging.error(f"❌ Authentication failed - Invalid credentials (400): {response.text}")
            raise ValueError(f"Authentication failed with 400 error: {response.text}")
        elif response.status_code == 502:
            logging.error("❌ Backend server unavailable (502 Bad Gateway)")
            raise ConnectionError("Backend API is currently unavailable (502)")
        
        response.raise_for_status()
        
        data = response.json()
        if 'token' not in data:
            logging.error(f"❌ No token in response: {data}")
            raise ValueError("Backend API did not return a token")
            
        logging.info("✅ Successfully authenticated with backend")
        return data['token']
        
    except requests.exceptions.RequestException as e:
        logging.error(f"🌐 Network error while getting token: {str(e)}")
        raise
    except (ValueError, KeyError) as e:
        logging.error(f"📊 Data error while getting token: {str(e)}")
        raise
    except Exception as e:
        logging.error(f"💥 Unexpected error while getting token: {str(e)}")
        raise

async def process_clip(filename, streamer, title, link, submitter, discord_submitter_id):
    """Process a clip asynchronously with compression and upload"""
    # Ensure semaphore is initialized
    if CLIP_PROCESSING_SEMAPHORE is None:
        logging.warning("Semaphore not initialized, processing without limit")
        await _process_clip_internal(filename, streamer, title, link, submitter, discord_submitter_id)
    else:
        async with CLIP_PROCESSING_SEMAPHORE:
            await _process_clip_internal(filename, streamer, title, link, submitter, discord_submitter_id)

async def _process_clip_internal(filename, streamer, title, link, submitter, discord_submitter_id):
    """Internal clip processing function"""
    try:
        logging.info(f'🎬 Processing clip: {os.path.basename(filename)}')
        temp_filename = f"{filename}.temp.mp4"
        
        # Compress video asynchronously
        ffmpeg_cmd = [
            'ffmpeg', '-i', filename,
            '-vcodec', 'libx264',
            '-crf', '23',
            '-y',
            temp_filename
        ]
        
        logging.debug(f'🔧 Starting FFmpeg compression for {os.path.basename(filename)}')
        # Run FFmpeg asynchronously to avoid blocking the event loop
        process = await asyncio.create_subprocess_exec(
            *ffmpeg_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise subprocess.SubprocessError(f"FFmpeg failed with return code {process.returncode}: {stderr.decode()}")
            
        logging.info(f'✅ Video compression completed for {os.path.basename(filename)}')

        shutil.move(temp_filename, filename)
        logging.debug(f'📁 Replaced original file with compressed version: {os.path.basename(filename)}')

        # Upload clip asynchronously
        response = await upload_clip_async(filename, streamer, title, link, submitter, discord_submitter_id)
        
        if response and response.status == 200:
            logging.info(f'🚀 Clip uploaded successfully: {os.path.basename(filename)} - Removing local file')
            if os.path.exists(filename):
                os.remove(filename)
            return True
        elif response and response.status == 401:
            logging.warning("🔑 Token expired during upload, attempting to refresh...")
            try:
                refresh_token()
            except Exception as e:
                logging.error(f"❌ Failed to refresh token after 401: {e}")
            finally:
                if os.path.exists(filename):
                    os.remove(filename)
            return False
        elif response:
            error_msg = f"Server error ({response.status})"
            try:
                response_data = await response.json()
                if 'error' in response_data:
                    error_msg += f": {response_data['error']}"
            except:
                pass
            logging.error(f'❌ Upload failed: {error_msg} - Removing file: {os.path.basename(filename)}')
            if os.path.exists(filename):
                os.remove(filename)
            return False
        else:
            # Upload failed or was saved for later
            logging.warning(f'⚠️ Upload failed for {os.path.basename(filename)} - File removed')
            if os.path.exists(filename):
                os.remove(filename)
            return False

    except (subprocess.SubprocessError, asyncio.TimeoutError) as e:
        logging.error(f'💥 Processing error for {os.path.basename(filename) if "filename" in locals() else "unknown file"}: {str(e)}')
        if 'temp_filename' in locals() and os.path.exists(temp_filename):
            os.remove(temp_filename)
        if os.path.exists(filename):
            os.remove(filename)
        return False
    except Exception as e:
        logging.error(f'💥 Unexpected error during clip processing for {os.path.basename(filename) if "filename" in locals() else "unknown file"}: {str(e)}')
        if os.path.exists(filename):
            os.remove(filename)
        return False

def refresh_token():
    global BACKEND_TOKEN
    BACKEND_TOKEN = get_backend_token()
    logging.debug(f'Refreshed backend token: {BACKEND_TOKEN}')

async def upload_clip_async(filename, streamer, title, link, submitter, discord_submitter_id):
    """Upload clip asynchronously to avoid blocking the event loop"""
    global BACKEND_TOKEN, BACKEND_URL
    
    if not BACKEND_TOKEN:
        try:
            BACKEND_TOKEN = get_backend_token()
        except Exception as e:
            logging.error(f"Failed to refresh token before upload: {e}")
            save_path = f"downloads/pending/{int(time.time())}_{os.path.basename(filename)}"
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            shutil.move(filename, save_path)
            logging.info(f"Saved clip for later upload: {save_path}")
            return None

    max_upload_retries = 3
    for attempt in range(1, max_upload_retries + 1):
        try:
            async with aiohttp.ClientSession() as session:
                with open(filename, 'rb') as file_handle:
                    data = aiohttp.FormData()
                    data.add_field('clip', file_handle, filename=os.path.basename(filename))
                    data.add_field('streamer', streamer)
                    data.add_field('title', title)
                    data.add_field('link', link)
                    data.add_field('submitter', submitter)
                    data.add_field('discordSubmitterId', str(discord_submitter_id))
                    
                    headers = {'Authorization': f'Bearer {BACKEND_TOKEN}'}
                    
                    async with session.post(f'{BACKEND_URL}/api/clips', data=data, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as response:
                        response_text = await response.text()
                        logging.debug(f'Response from server: {response_text}')
                        return response
                    
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            if attempt == max_upload_retries:
                logging.error(f"Failed to upload after {max_upload_retries} attempts: {e}")
                save_path = f"downloads/pending/{int(time.time())}_{os.path.basename(filename)}"
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                shutil.move(filename, save_path)
                logging.info(f"Saved clip for later upload: {save_path}")
                return None
            else:
                logging.warning(f"Upload attempt {attempt} failed: {e}, retrying...")
                await asyncio.sleep(2 * attempt)
        except Exception as e:
            logging.error(f"Unexpected error during upload: {e}")
            if os.path.exists(filename):
                os.remove(filename)
            return None
    
    return None

def fetch_channel_ids():
    global BACKEND_URL, CLIP_CHANNEL_IDS, BACKEND_TOKEN, BLACKLISTED_SUBMITTER_IDS, BLACKLISTED_STREAMERS
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(1, max_retries + 1):
        try:
            if not BACKEND_TOKEN:
                refresh_token()
            
            headers = {'Authorization': f'Bearer {BACKEND_TOKEN}'}
            logging.debug(f"🔍 Fetching channel IDs and blacklists from backend (attempt {attempt}/{max_retries})")
            response = requests.get(f"{BACKEND_URL}/api/config/admin", headers=headers, timeout=10)
            
            if response.status_code == 200:
                config = response.json()
                
                if config['admin']:
                    admin_config = config['admin']
                    
                    # Update channel IDs
                    if admin_config.get('clipChannelIds'):
                        channel_ids = admin_config['clipChannelIds']
                        if channel_ids and len(channel_ids) > 0:
                            CLIP_CHANNEL_IDS = [int(channel_id) for channel_id in channel_ids if channel_id]
                            logging.info(f"📺 Updated clip channel IDs from backend: {CLIP_CHANNEL_IDS}")
                        else:
                            logging.warning("⚠️ Empty channel IDs list in config, keeping current list")
                    else:
                        logging.warning("⚠️ No clip channel IDs found in config, keeping current list")
                    
                    # Update blacklisted submitter IDs
                    blacklisted_submitters = admin_config.get('blacklistedSubmitters', [])
                    # Extract user IDs from the new structure
                    current_ids = [str(submitter.get('userId', '')) for submitter in blacklisted_submitters if submitter.get('userId', '').strip()]
                    if current_ids != BLACKLISTED_SUBMITTER_IDS:
                        BLACKLISTED_SUBMITTER_IDS = current_ids
                        logging.info(f"🚫 Updated blacklisted submitter IDs: {len(BLACKLISTED_SUBMITTER_IDS)} users")
                    
                    # Update blacklisted streamers
                    blacklisted_streamers = admin_config.get('blacklistedStreamers', [])
                    if blacklisted_streamers != BLACKLISTED_STREAMERS:
                        BLACKLISTED_STREAMERS = [streamer.strip().lower() for streamer in blacklisted_streamers if streamer.strip()]
                        logging.info(f"🚫 Updated blacklisted streamers: {len(BLACKLISTED_STREAMERS)} streamers")
                    
                    return  # Success, exit the retry loop
                    
            elif response.status_code == 401:
                logging.warning("🔑 Token expired while fetching config, refreshing...")
                try:
                    refresh_token()
                except Exception as token_error:
                    logging.error(f"❌ Failed to refresh token: {token_error}")
                    if attempt == max_retries:
                        return
            else:
                logging.warning(f"⚠️ Failed to fetch config, status code: {response.status_code}")
                if attempt == max_retries:
                    return
                    
        except requests.exceptions.RequestException as e:
            logging.error(f"🌐 Network error fetching config (attempt {attempt}/{max_retries}): {str(e)}")
            if attempt == max_retries:
                return
        except Exception as e:
            logging.error(f"❌ Unexpected error fetching config (attempt {attempt}/{max_retries}): {str(e)}")
            if attempt == max_retries:
                return
        
        # Wait before retrying (except on last attempt)
        if attempt < max_retries:
            logging.debug(f"⏳ Waiting {retry_delay} seconds before retry...")
            time.sleep(retry_delay)
            retry_delay *= 1.5

def is_blacklisted(streamer_name, discord_submitter_id):
    """Check if a streamer or submitter is blacklisted"""
    global BLACKLISTED_SUBMITTER_IDS, BLACKLISTED_STREAMERS
    
    # Check if submitter is blacklisted
    if str(discord_submitter_id) in BLACKLISTED_SUBMITTER_IDS:
        logging.info(f"🚫 Submitter {discord_submitter_id} is blacklisted")
        return True, "submitter"
    
    # Check if streamer is blacklisted (case-insensitive)
    if streamer_name and streamer_name.lower() in BLACKLISTED_STREAMERS:
        logging.info(f"🚫 Streamer '{streamer_name}' is blacklisted")
        return True, "streamer"
    
    return False, None

def check_ffmpeg():
    try:
        result = subprocess.run(['ffmpeg', '-version'], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logging.info('✅ FFmpeg is installed and accessible')
    except subprocess.CalledProcessError:
        logging.error('❌ FFmpeg is installed but returned an error')
        raise
    except FileNotFoundError:
        logging.error('❌ FFmpeg is not installed or not found in PATH')
        raise

check_ffmpeg()

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

@client.event
async def on_ready():
    global CLIP_PROCESSING_SEMAPHORE
    
    logging.info(f'🤖 Bot logged in as {client.user}')
    
    # Initialize the semaphore for concurrent clip processing
    CLIP_PROCESSING_SEMAPHORE = asyncio.Semaphore(2)  # Process max 2 clips concurrently
    logging.info("⚙️ Initialized clip processing semaphore (max 2 concurrent)")
    
    # Fetch channel IDs on startup (with retry logic)
    logging.info("📺 Refreshing channel configuration on startup...")
    fetch_channel_ids()
    
    # Refresh token to ensure it's valid
    try:
        if BACKEND_TOKEN:
            logging.info("🔑 Validating backend token...")
        refresh_token()
        logging.info("✅ Backend token refreshed and validated")
    except Exception as e:
        logging.error(f"❌ Failed to refresh token on startup: {e}")
    
    # Only start the task if it's not already running
    if not refresh_config_task.is_running():
        refresh_config_task.start()
        logging.info("⏰ Started background config refresh task")
    else:
        logging.debug("⏰ Config refresh task already running")
    
    await client.change_presence(activity=discord.Activity(
        type=discord.ActivityType.watching, name='for clips'))
    logging.info("👁️ Bot presence set to 'Watching for clips'")
    
    logging.info("🎉 Bot startup completed successfully!")

@tasks.loop(minutes=20)
async def refresh_config_task():
    fetch_channel_ids()
    logging.info("Refreshed channel IDs and blacklists from backend config")
    
    if refresh_config_task.current_loop % 3 == 0 and refresh_config_task.current_loop > 0:
        refresh_token()
        logging.info("Refreshed backend token")

@refresh_config_task.before_loop
async def before_refresh_task():
    await client.wait_until_ready()

@client.event
async def on_message(message):
    global CLIP_CHANNEL_IDS, BACKEND_TOKEN
    
    if not CLIP_CHANNEL_IDS:
        fetch_channel_ids()
        if not CLIP_CHANNEL_IDS:
            logging.warning("No clip channels configured, skipping message")
            return

    if message.author == client.user or message.channel.id not in CLIP_CHANNEL_IDS:
        return
    
    url_pattern = r'(https?://[^\s]+)'
    urls = re.findall(url_pattern, message.content)
    filename = None

    if urls:
        # await message.add_reaction('🔄')
        url = urls[0].strip()
        ydl_opts = {
            'outtmpl': 'downloads/%(id)s.%(ext)s',
            'ratelimit': 20 * 1024 * 1024,
        }
        logging.debug(f'📥 Received message with URL: {url}')

        if 'youtube.com' in url or 'youtu.be' in url or 'twitch.tv' in url or 'medal.tv' in url:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                logging.debug(f'YoutubeDL info: {info}')
                link = url
                filename = ydl.prepare_filename(info or {})
                streamer = (info or {}).get('creator') or (info or {}).get('channel') or (info or {}).get('uploader') or message.author.name
                title = (info or {}).get('title', 'YT Clip')
                submitter = message.author.name

    elif message.attachments and 'cdn.discordapp.com' in message.attachments[0].url:
        # await message.add_reaction('🔄')
        split_v1 = str(message.attachments).split("filename='")[1]
        filename = str(split_v1).split("' ")[0]
        logging.debug(f'📎 Filename from message attachments: {filename}')
        if filename.endswith(".mp4") or filename.endswith(".mov"):
            filename = "downloads/{}".format(filename)
            logging.debug(f'💾 New filename: {filename}')

            os.makedirs(os.path.dirname(filename), exist_ok=True)

            await message.attachments[0].save(fp=filename)
            logging.debug(f'📁 Saved attachment to: {filename}')
            streamer = message.author.name
            title = "Discord Clip"
            link = message.jump_url
            submitter = message.author.name
    
    if filename:
        # Check if submitter or streamer is blacklisted
        is_blocked, block_type = is_blacklisted(streamer, message.author.id)
        if is_blocked:
            logging.info(f"🚫 Clip blocked: {block_type} is blacklisted (submitter: {message.author.name}, streamer: {streamer})")
            if os.path.exists(filename):
                os.remove(filename)
            return
        
        # Schedule clip processing as a background task to avoid blocking
        asyncio.create_task(process_clip(filename, streamer, title, link, submitter, message.author.id))

if __name__ == '__main__':
    logging.info(f"🚀 Starting bot with backend URL: {BACKEND_URL}")
    
    retry_count = 0
    max_retries = 10
    retry_delay = 5
    
    while not BACKEND_TOKEN and retry_count < max_retries:
        try:
            BACKEND_TOKEN = get_backend_token()
            if not BACKEND_TOKEN:
                retry_count += 1
                logging.error(f"❌ Failed to get backend token (attempt {retry_count}/{max_retries}), retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay = min(retry_delay * 1.5, 60)
        except ConnectionError as e:
            retry_count += 1
            logging.error(f"🌐 Backend connection error (attempt {retry_count}/{max_retries}): {e}")
            logging.info(f"⏳ Will retry in {retry_delay} seconds...")
            time.sleep(retry_delay)
            retry_delay = min(retry_delay * 1.5, 60)
        except ValueError as e:
            logging.critical(f"🔑 Authentication error, please check credentials: {e}")
            logging.warning("⚠️ Moving forward with a blank token, uploads will fail until backend is accessible")
            break
        except Exception as e:
            retry_count += 1
            logging.error(f"💥 Unexpected error getting token (attempt {retry_count}/{max_retries}): {e}")
            logging.info(f"⏳ Will retry in {retry_delay} seconds...")
            time.sleep(retry_delay)
            retry_delay = min(retry_delay * 1.5, 60)
    
    if retry_count >= max_retries:
        logging.warning("⚠️ Max retry attempts reached. Running bot without valid backend token.")
        logging.warning("⚠️ Clip uploads will fail until the backend becomes accessible.")
    
    if not DISCORD_BOT_TOKEN:
        logging.warning("⚠️ No Discord bot token found in config, checking alternative sources")
        
        if not DISCORD_BOT_TOKEN:
            logging.critical("❌ No Discord bot token available. Bot cannot start.")
            exit(1)
    
    try:
        logging.info("📺 Fetching initial channel configuration...")
        fetch_channel_ids()
        if not CLIP_CHANNEL_IDS:
            logging.warning("⚠️ No clip channel IDs configured. Bot will run but won't process any clips.")
        else:
            logging.info(f"✅ Initial channel IDs loaded: {CLIP_CHANNEL_IDS}")
    except Exception as e:
        logging.error(f"❌ Error fetching initial channel IDs: {e}")
        logging.warning("⚠️ Using channel IDs from config file as fallback.")

    try:
        logging.info("🤖 Starting Discord bot...")
        client.run(DISCORD_BOT_TOKEN)
    except Exception as e:
        logging.critical(f"💥 Failed to start Discord bot: {e}")
        exit(1)