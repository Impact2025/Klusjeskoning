# PowerShell script to update GitHub repository
Write-Host "Starting GitHub update process..."

# Check current git status
Write-Host "Checking git status..."
git status

# Add all changes
Write-Host "Adding all changes..."
git add .

# Commit changes
Write-Host "Committing changes..."
git commit -m "Update to latest version: Complete admin dashboard, email notifications, SEO improvements, and documentation"

# Force push to GitHub
Write-Host "Force pushing to GitHub..."
git push origin master --force

Write-Host "GitHub update process completed!"