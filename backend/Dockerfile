# Use an official Node.js image as the base
FROM node:18

# Install Nginx and Certbot
RUN apt-get update && apt-get install -y nginx certbot python3-certbot-nginx ffmpeg

# Create and set the working directory for the application
WORKDIR /var/www/backend

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install PM2 to manage the Node.js application
RUN npm install -g pm2

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports for Nginx
EXPOSE 80
EXPOSE 443

# Start Nginx and the application
CMD ["sh", "-c", "nginx && pm2-runtime start src/server.js"]
