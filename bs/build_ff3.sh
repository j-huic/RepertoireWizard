#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

BUILD_DIR="build"
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
}

IGNORE_PATTERNS=$(process_ignore_patterns)

create_zip() {
    local output_file="$1"
    local zip_command="zip -r \"$output_file\" . $IGNORE_PATTERNS"
    echo "Executing: $zip_command"
    eval $zip_command

    if [ $? -eq 0 ]; then
        echo "Extension zipped successfully into $output_file"
        echo "File size: $(du -h "$output_file" | cut -f1)"
        
        # List the contents of the zip file
        echo "Contents of the zip file:"
        unzip -l "$output_file" | awk 'NR > 3 {print $4}' | sed '$d' | sed '$d'
    else
        echo "An error occurred while zipping the extension."
        exit 1
    fi
}

# Create Chrome version
CHROME_OUTPUT="$BUILD_DIR/${BASE_NAME}_chrome.zip"
create_zip "$CHROME_OUTPUT"

# Create temporary directory for Firefox version
FIREFOX_TEMP_DIR=$(mktemp -d)
cp -R . "$FIREFOX_TEMP_DIR"

# Replace "chrome" with "browser" in all .js files
find "$FIREFOX_TEMP_DIR" -type f -name "*.js" -exec sed -i 's/chrome\./browser./g' {} +

# Copy Firefox-specific manifest if it exists
if [ -f "manifest_firefox.json" ]; then
    cp "manifest_firefox.json" "$FIREFOX_TEMP_DIR/manifest.json"
fi

# Create Firefox version
FIREFOX_OUTPUT="$BUILD_DIR/${BASE_NAME}_firefox.zip"
(cd "$FIREFOX_TEMP_DIR" && create_zip "$FIREFOX_OUTPUT")

# Clean up temporary directory
rm -rf "$FIREFOX_TEMP_DIR"

echo "Build process completed. Chrome version: $CHROME_OUTPUT, Firefox version: $FIREFOX_OUTPUT"