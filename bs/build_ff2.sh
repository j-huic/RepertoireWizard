#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

BUILD_DIR="build_ff"
BASE_NAME="RepertoireHelper"
IGNORE_FILE=".buildignore"

# Create build directory if it doesn't exist
mkdir -p "$BUILD_DIR"

if [ ! -f "$IGNORE_FILE" ]; then
    echo "Ignore file not found."
    exit 1
fi

process_ignore_patterns() {
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" == \#* ]] && continue
        
        # If line ends with /, add * after it
        if [[ "$line" == */ ]]; then
            echo -n " -x \"$line*\""
        else
            echo -n " -x \"$line\""
        fi
    done < "$IGNORE_FILE"
    # Add manifest.json to ignore patterns
    echo -n " -x \"manifest.json\""
}

IGNORE_PATTERNS=$(process_ignore_patterns)

# Create temporary directory for Firefox version
FIREFOX_TEMP_DIR=$(mktemp -d)

# Copy all files to the temporary directory, excluding those in .buildignore
rsync -av --exclude-from="$IGNORE_FILE" --exclude="manifest.json" . "$FIREFOX_TEMP_DIR"

# Replace "chrome" with "browser" in all .js files
find "$FIREFOX_TEMP_DIR" -type f -name "*.js" -exec sed -i 's/chrome\./browser./g' {} +

# Copy Firefox-specific manifest
if [ -f "manifest_firefox.json" ]; then
    cp "manifest_firefox.json" "$FIREFOX_TEMP_DIR/manifest.json"
else
    echo "Firefox manifest (manifest_firefox.json) not found. Exiting."
    exit 1
fi

# Find an available filename
COUNTER=1
OUTPUT_FILE="$BUILD_DIR/${BASE_NAME}.zip"
while [ -f "$OUTPUT_FILE" ]; do
    OUTPUT_FILE="$BUILD_DIR/${BASE_NAME}_$COUNTER.zip"
    ((COUNTER++))
done

# Zip the Firefox version
(cd "$FIREFOX_TEMP_DIR" && zip -r "$OUTPUT_FILE" .)

if [ $? -eq 0 ]; then
    echo "Firef