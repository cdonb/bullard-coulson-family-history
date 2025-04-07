# Word to HTML Converter

This project automatically converts Microsoft Word documents to HTML and manages them in a GitHub repository. It uses mammoth.js for conversion and runs on Node.js.

## Setup

1. Install Node.js 16 or higher
2. Install dependencies:
   ```bash
   npm install
   ```
3. The following folder structure will be created automatically:
   ```
   .
   ├── input/     # Place your Word documents here
   └── output/    # Converted HTML files will be saved here
   ```

## Usage

1. Place your Word documents in the `input` folder
2. Run the converter:
   ```bash
   npm start
   ```
3. The script will:
   - Watch for changes in the input folder
   - Convert new or modified Word documents to HTML
   - Save HTML files to the output folder
   - Automatically commit and push changes to GitHub

## Features

- Automatic conversion of Word documents to HTML
- Modern, responsive HTML output with clean styling
- Automatic Git integration
- File watching for instant conversion
- Error handling and logging

## Requirements

- Node.js 16+
- Git installed and configured
- GitHub repository set up
- Dependencies listed in package.json 