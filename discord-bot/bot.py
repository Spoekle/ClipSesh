import os
import requests
import ffmpeg
import discord
import logging
import schedule
import asyncio
import re
from yt_dlp import YoutubeDL
from config import DISCORD_BOT_TOKEN, UPLOADBOT_USERNAME, UPLOADBOT_PASSWORD, BACKEND_URL, CLIP_CHANNEL_ID
from logging.handlers import TimedRotatingFileHandler
import subprocess
import shutil

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

logs_dir = 'logs'
if not os.path.exists(logs_dir):
    os.makedirs(logs_dir)

log_filename = os.path.join(logs_dir, 'bot.log')
logging.basicConfig(handlers=[TimedRotatingFileHandler(log_filename, when="midnight", interval=1, backupCount=7)],
                    level=logging.DEBUG, 
                    format='%(asctime)s:%(levelname)s:%(message)s')


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

# Call the check at startup
check_ffmpeg()


def get_backend_token():
    response = requests.post(f'{BACKEND_URL}/api/users/login', json={
        'username': UPLOADBOT_USERNAME,
        'password': UPLOADBOT_PASSWORD
    })
    response.raise_for_status()
    return response.json()['token']

def refresh_token():
    global BACKEND_TOKEN
    BACKEND_TOKEN = get_backend_token()
    logging.debug(f'Refreshed backend token: {BACKEND_TOKEN}')

@client.event
async def on_ready():
    print(f'Logged in as {client.user}')
    refresh_token()
    schedule.every(170).minutes.do(refresh_token)
    await client.change_presence(activity=discord.CustomActivity(name='Fetching your clips...'))

    while True:
        schedule.run_pending()
        await asyncio.sleep(1)

@client.event
async def on_message(message):

    if message.author == client.user or message.channel.id not in CLIP_CHANNEL_ID:
        return
    
    # Define a regex pattern for URLs
    url_pattern = r'(https?://[^\s]+)'
    urls = re.findall(url_pattern, message.content)

    if urls:
        # await message.add_reaction('🔄')
        url = urls[0].strip()
        ydl_opts = {
            'outtmpl': 'downloads/%(id)s.%(ext)s',
            'ratelimit': 20 * 1024 * 1024,
        }
        logging.debug(f'Received message with URL: {url}')

        if 'youtube.com' in url or 'youtu.be' in url or 'twitch.tv' in url or 'medal.tv' in url:
            with YoutubeDL(ydl_opts) as ydl:
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

    # Compress and convert video to h.264 using FFmpeg
    try:
        logging.debug(f'Compressing and converting video: {filename}')
        temp_filename = f"{filename}.temp.mp4"

        (
            ffmpeg
            .input(filename)
            .output(temp_filename, vcodec='libx264', crf=23)
            .overwrite_output()
            .run(quiet=True)
        )
        logging.debug('Video compression and conversion completed.')

        # Replace the original file with the compressed file
        shutil.move(temp_filename, filename)
        logging.debug(f'Replaced original file with compressed file: {filename}')

    except ffmpeg.Error as e:
        logging.error(f'FFmpeg error: {e.stderr.decode()}')
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        os.remove(filename)
        await message.channel.send("An error occurred while processing the video.")
        return

    with open(filename, 'rb') as f:
        files = {'clip': f}
        data = {'streamer': streamer, 'title': title, 'link': link, 'submitter': submitter}
        headers = {'Authorization': f'Bearer {BACKEND_TOKEN}'}
        logging.debug(f'Sending POST request to {BACKEND_URL}/api/clips/upload with streamer: {streamer}')
        response = requests.post(f'{BACKEND_URL}/api/clips/upload', files=files, data=data, headers=headers)
        logging.debug(f'Response from server: {response.text}')
        # await message.clear_reaction('🔄')

    if response.status_code == 200:
        # await message.add_reaction('✅')
        logging.debug('Response status code is 200, removing file.')
        os.remove(filename)
    else:
        # await message.add_reaction('❌')
        logging.error(f'Response status code is not 200, it is: {response.status_code}. Removing file.')
        os.remove(filename)

logging.info('Running client with {DISCORD_BOT_TOKEN}')
client.run(DISCORD_BOT_TOKEN)