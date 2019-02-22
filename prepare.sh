rm -rf /s /q ./meteor-css-modules
rsync -d --exclude-from prepare-exclude.rsync.list --exclude='*/' ./ ./meteor-css-modules
rsync -d --exclude-from prepare-exclude.rsync.list --exclude='*/' ./helpers/ ./meteor-css-modules/helpers
rsync -d --exclude-from prepare-exclude.rsync.list --exclude='*/' ./package/ ./meteor-css-modules/package
