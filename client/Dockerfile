# Dockerfile for React Frontend
FROM node:18 AS build 

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY / ./

# Build the React application
RUN npm run build

# Final stage
FROM node:18

WORKDIR /app

# Copy the built application from the build stage
COPY --from=build /app/dist ./build

# Copy the server file
COPY server.js ./

# Install Express
RUN npm install express

# Expose the port the app runs on
EXPOSE 3000

# Command to run the Express server
CMD ["node", "server.js"]