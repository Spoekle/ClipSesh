FROM python:3.9-slim AS builder

# Create app directory
WORKDIR /build

# Copy requirements file for dependency installation
COPY requirements.txt .

# Install build dependencies and create a virtual environment
RUN pip install --no-cache-dir --user --no-warn-script-location wheel \
    && python -m venv /venv \
    && /venv/bin/pip install --no-cache-dir -U pip wheel \
    && /venv/bin/pip install --no-cache-dir -r requirements.txt

# Production stage with minimal image
FROM python:3.9-slim

# Install only FFmpeg without keeping the package cache
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /venv /venv

# Copy only the necessary application code
COPY bot.py config.py ./

# Create directories the bot needs
RUN mkdir -p downloads logs

# Set PATH to use the virtual environment
ENV PATH="/venv/bin:$PATH"

# Run the bot
CMD ["python", "bot.py"]