import { fileURLToPath } from 'url'; import { dirname, join } from 'path'; import { promises as fs } from 'fs'; import mammoth from 'mammoth';
import chokidar from 'chokidar';
import simpleGit from 'simple-git';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use the actual folder path instead of a symbolic link
const inputDir = "/Users/donbullard/Library/CloudStorage/Dropbox/Don\'s\ documents/webpage";  // Your actual input folder path
const outputDir = join(__dirname, 'output');

// Ensure output directory exists
await fs.mkdir(outputDir, { recursive: true });

// Initialize git
const git = simpleGit();

// HTML template with basic styling
const htmlTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
        }
        a {
            color: #3498db;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>
`;

async function convertWordToHtml(inputPath, outputPath) {
    try {
        const result = await mammoth.convertToHtml({ path: inputPath });
        const html = htmlTemplate(inputPath.split('/').pop().replace('.docx', ''), result.value);
        await fs.writeFile(outputPath, html, 'utf8');
        console.log(`✅ Converted ${inputPath} to HTML`);
        return true;
    } catch (error) {
        console.error(`❌ Error converting ${inputPath}:`, error);
        return false;
    }
}

async function handleGitOperations(inputPath, outputPath, isDeletion = false) {
    try {
        if (isDeletion) {
            // For deletions, remove the file from git and commit
            await git.rm([outputPath]);
            await git.commit(`Remove HTML conversion for ${inputPath.split('/').pop()}`);
        } else {
            // For additions/updates, add the file and commit
            await git.add([outputPath]);
            await git.commit(`Update HTML conversion for ${inputPath.split('/').pop()}`);
        }
        await git.push();
        console.log(`✅ Changes ${isDeletion ? 'removed and' : 'committed and'} pushed to GitHub`);
    } catch (error) {
        console.error('❌ Git operation failed:', error);
    }
}

async function processFile(filePath) {
    if (!filePath.endsWith('.docx')) return;
    
    const fileName = filePath.split('/').pop();
    const outputPath = join(outputDir, fileName.replace('.docx', '.html'));
    
    const success = await convertWordToHtml(filePath, outputPath);
    if (success) {
        await handleGitOperations(filePath, outputPath);
    }
}

async function handleDeletion(filePath) {
    if (!filePath.endsWith('.docx')) return;
    
    const fileName = filePath.split('/').pop();
    const outputPath = join(outputDir, fileName.replace('.docx', '.html'));
    
    try {
        // Check if the HTML file exists before trying to remove it
        await fs.access(outputPath);
        // Remove the HTML file
        await fs.unlink(outputPath);
        console.log(`✅ Removed HTML file for ${fileName}`);
        // Update git
        await handleGitOperations(filePath, outputPath, true);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`ℹ️ No HTML file found for ${fileName}`);
        } else {
            console.error(`❌ Error removing HTML file for ${fileName}:`, error);
        }
    }
}

// Check if we're running in single file mode
if (process.argv.length > 2) {
    if (process.argv[2] === '--run-once') {
        // Single-run mode: process all files and exit
        console.log('🔄 Processing all Word documents in the input folder...');
        try {
            const files = await fs.readdir(inputDir);
            const wordFiles = files.filter(file => file.endsWith('.docx'));
            
            if (wordFiles.length === 0) {
                console.log('ℹ️ No Word documents found in the input folder');
                process.exit(0);
            }

            for (const file of wordFiles) {
                const inputPath = join(inputDir, file);
                const outputPath = join(outputDir, file.replace('.docx', '.html'));
                await processFile(inputPath);
            }
            
            console.log('✅ All documents processed successfully');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error processing documents:', error);
            process.exit(1);
        }
    } else {
        // Single file conversion mode
        const inputFile = process.argv[2];
        const outputFile = process.argv[3];
        if (inputFile && outputFile) {
            const success = await convertWordToHtml(inputFile, outputFile);
            if (success) {
                await handleGitOperations(inputFile, outputFile);
            }
            process.exit(success ? 0 : 1);
        }
    }
}

// Watch for changes
const watcher = chokidar.watch(inputDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
});

console.log('👀 Watching for Word documents in the input folder...');

watcher
    .on('add', processFile)
    .on('change', processFile)
    .on('unlink', handleDeletion);

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Stopping the watcher...');
    watcher.close().then(() => process.exit(0));
}); 
