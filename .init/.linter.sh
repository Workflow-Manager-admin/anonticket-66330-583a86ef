#!/bin/bash
cd /home/kavia/workspace/code-generation/anonticket-66330-583a86ef/ticketing_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

