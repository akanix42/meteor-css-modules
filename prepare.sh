rm -rf /s /q ./meteor-css-modules
rsync -d --exclude-from prepare-exclude.rsync.list --exclude='*/' ./ ./meteor-css-modules
rsync -d --exclude-from prepare-exclude.rsync.list --exclude='*/' ./helpers/ ./meteor-css-modules/helpers
