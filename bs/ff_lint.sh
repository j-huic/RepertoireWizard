#!/bin/bash

cp manifest_firefox.json manifest.json

web-ext lint --ignore-files "build*" "bs/" "*.sh" "options2.js" "coursefiles/"

cp manifest_chrome.json manifest.json