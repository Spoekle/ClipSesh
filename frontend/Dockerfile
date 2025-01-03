# Use an official Nginx image as the base
FROM nginx:alpine

# Copy the build output to the Nginx web root
COPY build /usr/share/nginx/html

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80
