#!/bin/bash

echo "Stopping old game servers..."
pkill -f vite 2>/dev/null

echo "Starting Reading Adventure..."
npm run dev
