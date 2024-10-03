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

# Find an available filename
COUNTER=1
OUTPUT_FILE="$BUILD_DIR/${BASE_NAME}.zip"
while [ -f "$OUTPUT_FILE" ]; do
    OUTPUT_FILE="$BUILD_DIR/${BASE_NAME}_$COUNTER.zip"
    ((COUNTER++))
done

# Construct and execute the zip command
ZIP_COMMAND="zip -r \"$OUTPUT_FILE\" . $IGNORE_PATTERNS"
echo "Executing: $ZIP_COMMAND"
eval $ZIP_COMMAND

if [ $? -eq 0 ]; then
    echo "Extension zipped successfully into $OUTPUT_FILE"
    echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
    
    # List the contents of the zip file
    echo "Contents of the zip file:"
    unzip -l "$OUTPUT_FILE" | awk 'NR > 3 {print $4}' | head -n -2
else
    echo "An error occurred while zipping the extension."
    exit 1
fi