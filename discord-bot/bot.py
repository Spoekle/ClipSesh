import os
import re
import asyncio
import logging
import requests
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

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/bot.log"),
        logging.StreamHandler()
    ]
)

def get_backend_token():
    global BACKEND_URL
    if not BACKEND_URL:
        BACKEND_URL = CONFIG_BACKEND_URL
    
    try:
        logging.debug(f"Attempting to get token from {BACKEND_URL}/api/users/login")
        response = requests.post(
            f'{BACKEND_URL}/api/users/login', 
            json={
                'username': UPLOADBOT_USERNAME,
                'password': UPLOADBOT_PASSWORD
            },
            timeout=10
        )
        
        if response.status_code == 400:
            logging.error(f"Bad request (400) - Likely invalid credentials: {response.text}")
            raise ValueError(f"Authentication failed with 400 error: {response.text}")
        elif response.status_code == 502:
            logging.error("Backend server unavailable (502 Bad Gateway)")
            raise ConnectionError("Backend API is currently unavailable (502)")
        
        response.raise_for_status()
        
        data = response.json()
        if 'token' not in data:
            logging.error(f"No token in response: {data}")
            raise ValueError("Backend API did not return a token")
            
        logging.debug("Successfully retrieved backend token")
        return data['token']
        
    except requests.exceptions.RequestException as e:
        logging.error(f"Network error while getting token: {str(e)}")
        raise
    except (ValueError, KeyError) as e:
        logging.error(f"Data error while getting token: {str(e)}")
        raise

def refresh_token():
    global BACKEND_TOKEN
    BACKEND_TOKEN = get_backend_token()
    logging.debug(f'Refreshed backend token: {BACKEND_TOKEN}')

def fetch_channel_ids():
    global BACKEND_URL, CLIP_CHANNEL_IDS, BACKEND_TOKEN
    try:
        if not BACKEND_TOKEN:
            refresh_token()
        
        headers = {'Authorization': f'Bearer {BACKEND_TOKEN}'}
        response = requests.get(f"{BACKEND_URL}/api/config/admin", headers=headers)
        
        if response.status_code == 200:
            config = response.json()
            
            if config['admin'] and config['admin'].get('clipChannelIds'):
                channel_ids = config['admin']['clipChannelIds']
                if channel_ids and len(channel_ids) > 0:
                    CLIP_CHANNEL_IDS = [int(channel_id) for channel_id in channel_ids if channel_id]
                    logging.info(f"Updated clip channel IDs from backend: {CLIP_CHANNEL_IDS}")
                else:
                    logging.warning("Empty channel IDs list in config, keeping current list")
            else:
                logging.warning("No clip channel IDs found in config, keeping current list")
        else:
            logging.warning(f"Failed to fetch channel IDs, status code: {response.status_code}")
    except Exception as e:
        logging.error(f"Error fetching channel IDs: {str(e)}")

def check_ffmpeg():
    try:
        result = subprocess.run(['ffmpeg', '-version'], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logging.debug('FFmpeg is installed and accessible.')
    except subprocess.CalledProcessError:
        logging.error('FFmpeg is installed but returned an error.')
        raise
    except FileNotFoundError:
        logging.error('FFmpeg is not installed or not found in PATH.')
        raise

check_ffmpeg()

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f'Logged in as {client.user}')
    fetch_channel_ids()
    refresh_token()
    
    refresh_config_task.start()
    
    await client.change_presence(activity=discord.Activity(
        type=discord.ActivityType.watching, name='for clips'))

@tasks.loop(hours=1)
async def refresh_config_task():
    fetch_channel_ids()
    logging.info("Refreshed channel IDs from backend config")
    
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
        logging.debug(f'Received message with URL: {url}')

        if 'youtube.com' in url or 'youtu.be' in url or 'twitch.tv' in url or 'medal.tv' in url:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                logging.debug(f'YoutubeDL info: {info}')
                link = url
                filename = ydl.prepare_filename(info)
                streamer = info.get('creator') or info.get('channel') or info.get('uploader') or message.author.name
                title = info.get('title', 'YT Clip')
                submitter = message.author.name

    elif message.attachments and 'cdn.discordapp.com' in message.attachments[0].url:
        # await message.add_reaction('🔄')
        split_v1 = str(message.attachments).split("filename='")[1]
        filename = str(split_v1).split("' ")[0]
        logging.debug(f'Filename from message attachments: {filename}')
        if filename.endswith(".mp4") or filename.endswith(".mov"):
            filename = "downloads/{}".format(filename)
            logging.debug(f'New filename: {filename}')

            os.makedirs(os.path.dirname(filename), exist_ok=True)

            await message.attachments[0].save(fp=filename)
            logging.debug(f'Saved attachment to: {filename}')
            streamer = message.author.name
            title = "Discord Clip"
            link = message.jump_url
            submitter = message.author.name
    
    if filename:
        try:
            logging.debug(f'Compressing and converting video: {filename}')
            temp_filename = f"{filename}.temp.mp4"
            
            ffmpeg_cmd = [
                'ffmpeg', '-i', filename,
                '-vcodec', 'libx264',
                '-crf', '23',
                '-y',
                temp_filename
            ]
            
            subprocess.run(ffmpeg_cmd, check=True, capture_output=True)
            logging.debug('Video compression and conversion completed.')

            shutil.move(temp_filename, filename)
            logging.debug(f'Replaced original file with compressed file: {filename}')

        except subprocess.SubprocessError as e:
            logging.error(f'FFmpeg error: {str(e)}')
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            os.remove(filename)
            return

        if not BACKEND_TOKEN:
            try:
                BACKEND_TOKEN = get_backend_token()
            except Exception as e:
                logging.error(f"Failed to refresh token before upload: {e}")
                save_path = f"downloads/pending/{int(time.time())}_{os.path.basename(filename)}"
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                shutil.move(filename, save_path)
                logging.info(f"Saved clip for later upload: {save_path}")
                return

        max_upload_retries = 3
        for attempt in range(1, max_upload_retries + 1):
            try:
                with open(filename, 'rb') as f:
                    files = {'clip': f}
                    data = {'streamer': streamer, 'title': title, 'link': link, 'submitter': submitter}
                    headers = {'Authorization': f'Bearer {BACKEND_TOKEN}'}
                    response = requests.post(f'{BACKEND_URL}/api/clips', files=files, data=data, headers=headers, timeout=30)
                    logging.debug(f'Response from server: {response.text}')
                
                break
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
                if attempt == max_upload_retries:
                    logging.error(f"Failed to upload after {max_upload_retries} attempts: {e}")
                    save_path = f"downloads/pending/{int(time.time())}_{os.path.basename(filename)}"
                    os.makedirs(os.path.dirname(save_path), exist_ok=True)
                    shutil.move(filename, save_path)
                    logging.info(f"Saved clip for later upload: {save_path}")
                    return
                else:
                    logging.warning(f"Upload attempt {attempt} failed: {e}, retrying...")
                    await asyncio.sleep(2 * attempt)
            except Exception as e:
                logging.error(f"Unexpected error during upload: {e}")
                os.remove(filename)
                return

        if response.status_code == 200:
            # await message.add_reaction('✅')
            logging.info('Clip uploaded successfully, removing file.')
            os.remove(filename)
        elif response.status_code == 401:
            logging.warning("Token expired during upload, attempting to refresh...")
            try:
                refresh_token()
            except Exception as e:
                logging.error(f"Failed to refresh token after 401: {e}")
            finally:
                os.remove(filename)
        else:
            # await message.add_reaction('❌')
            error_msg = f"Server error ({response.status_code})"
            try:
                error_details = response.json()
                if 'error' in error_details:
                    error_msg += f": {error_details['error']}"
            except:
                pass
            logging.error(f'Response status code is {response.status_code}. Removing file.')
            os.remove(filename)

if __name__ == '__main__':
    logging.info(f"Starting bot with backend URL: {BACKEND_URL}")
    
    retry_count = 0
    max_retries = 10
    retry_delay = 5
    
    while not BACKEND_TOKEN and retry_count < max_retries:
        try:
            BACKEND_TOKEN = get_backend_token()
            if not BACKEND_TOKEN:
                retry_count += 1
                logging.error(f"Failed to get backend token (attempt {retry_count}/{max_retries}), retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay = min(retry_delay * 1.5, 60)
        except ConnectionError as e:
            retry_count += 1
            logging.error(f"Backend connection error (attempt {retry_count}/{max_retries}): {e}")
            logging.info(f"Will retry in {retry_delay} seconds...")
            time.sleep(retry_delay)
            retry_delay = min(retry_delay * 1.5, 60)
        except ValueError as e:
            logging.critical(f"Authentication error, please check credentials: {e}")
            logging.warning("Moving forward with a blank token, uploads will fail until backend is accessible")
            break
        except Exception as e:
            retry_count += 1
            logging.error(f"Unexpected error getting token (attempt {retry_count}/{max_retries}): {e}")
            logging.info(f"Will retry in {retry_delay} seconds...")
            time.sleep(retry_delay)
            retry_delay = min(retry_delay * 1.5, 60)
    
    if retry_count >= max_retries:
        logging.warning("Max retry attempts reached. Running bot without valid backend token.")
        logging.warning("Clip uploads will fail until the backend becomes accessible.")
    
    if not DISCORD_BOT_TOKEN:
        logging.warning("No Discord bot token found in config, checking alternative sources")
        
        if not DISCORD_BOT_TOKEN:
            logging.critical("No Discord bot token available. Bot cannot start.")
            exit(1)
    
    try:
        fetch_channel_ids()
        if not CLIP_CHANNEL_IDS:
            logging.warning("No clip channel IDs configured. Bot will run but won't process any clips.")
    except Exception as e:
        logging.error(f"Error fetching channel IDs: {e}")
        logging.warning("Using channel IDs from config file as fallback.")

    try:
        logging.info("Starting Discord bot")
        client.run(DISCORD_BOT_TOKEN)
    except Exception as e:
        logging.critical(f"Failed to start Discord bot: {e}")
        exit(1)