# Use Node.js base image
FROM node:18

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Expose the backend port
EXPOSE 3647
# Run the backend server
CMD ["node", "server.js"]

