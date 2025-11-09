#!/bin/bash

echo "Paste the QR code base64 data (everything after 'base64,'):"
read QR_DATA

# Create HTML file with QR code
HTML_FILE="/tmp/qr_code_$$.html"  # $$ adds process ID for uniqueness

cat > "$HTML_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>QR Code</title>
    <style>
        body { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
            background: #f0f0f0;
        }
        img { 
            max-width: 90%; 
            max-height: 90%; 
            border: 2px solid #333;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <img src="data:image/png;base64,$QR_DATA" alt="QR Code">
</body>
</html>
EOF

# Open in default browser
if command -v xdg-open > /dev/null; then
    xdg-open "$HTML_FILE"  # Linux
elif command -v open > /dev/null; then
    open "$HTML_FILE"      # macOS
else
    echo "Please open this file in your browser: $HTML_FILE"
fi

echo "QR code opened in browser!"
