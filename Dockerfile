# Dockerfile for Go Backend
FROM golang:1.21 AS builder

WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application code
COPY . .

# Build the Go application
RUN go build -o main .

# Final stage
FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=builder /app/main .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the executable
CMD ["./main"]