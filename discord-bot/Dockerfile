FROM python:3.9-slim

# Install FFmpeg which is required by the bot
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements file first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories the bot needs
RUN mkdir -p downloads logs

# Run the bot
CMD ["python", "bot.py"]