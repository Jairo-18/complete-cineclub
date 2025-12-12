Write-Host "Fetching upstream..."
git fetch upstream
Write-Host "Checking out main..."
git checkout main
Write-Host "Merging upstream/dev into main..."
git merge upstream/dev
Write-Host "Done."
