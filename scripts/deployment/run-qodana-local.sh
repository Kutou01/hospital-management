#!/bin/bash

echo "Starting Qodana local analysis..."

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not running"
    echo "Please install Docker and make sure it's running"
    exit 1
fi

echo "Installing dependencies..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error installing frontend dependencies"
    cd ..
    exit 1
fi
cd ..

# Install backend service dependencies
echo "Installing backend service dependencies..."
cd backend
find services -name "package.json" -execdir npm install \;
if [ $? -ne 0 ]; then
    echo "Error installing backend service dependencies"
    cd ..
    exit 1
fi
cd ..

echo "Running Qodana analysis..."
docker run --rm -it -v "$(pwd)":/data/project jetbrains/qodana-js:latest

echo "Qodana analysis completed!"
echo "Check the results in qodana-results folder"
