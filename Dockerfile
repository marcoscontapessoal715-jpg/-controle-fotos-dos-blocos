# Use Node.js LTS (Long Term Support) image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose the port (Render uses 10000 by default)
EXPOSE 10000

# Start the application
CMD ["npm", "start"]
