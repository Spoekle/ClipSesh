#!/bin/bash

echo "===================================="
echo "ClipSesh Setup"
echo "===================================="

echo
echo "This script will set up the ClipSesh application."

while true; do
    echo
    echo "Choose an option:"
    echo "1. Install dependencies only"
    echo "2. Install dependencies and set up database"
    echo "3. Run the application"
    echo "4. Exit"
    echo

    read -p "Enter your choice (1-4): " choice

    case $choice in
        1)
            echo
            echo "Installing server dependencies..."
            cd server
            npm install
            cd ..

            echo
            echo "Installing client dependencies..."
            cd client
            npm install
            cd ..

            echo
            echo "Dependencies installed successfully!"
            ;;
        3)
            echo
            echo "Starting the application..."
            echo
            echo "Press Ctrl+C to stop the servers when done."
            echo

            # Start backend in background
            (cd backend && npm run dev) &
            backend_pid=$!

            # Wait a bit then start frontend
            sleep 5
            (cd frontend && npm run dev -- --host 192.168.1.38) &
            frontend_pid=$!

            echo
            echo "Both servers are now running!"
            echo "- Backend: http://localhost:5000"
            echo "- Frontend: http://localhost:5173"
            echo

            # Wait for user to press Ctrl+C
            wait
            ;;
        4)
            echo
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            ;;
    esac
done
