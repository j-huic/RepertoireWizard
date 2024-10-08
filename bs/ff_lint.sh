#!/bin/bash

cp manifest_firefox.json manifest.json

web-ext lint

cp manifest_chrome.json manifest.json