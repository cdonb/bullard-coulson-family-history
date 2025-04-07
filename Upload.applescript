set scriptPath to POSIX path of (path to me)
set scriptDir to do shell script "dirname " & quoted form of scriptPath
do shell script "cd " & quoted form of scriptDir & " && /opt/homebrew/bin/node converter.js --run-once"