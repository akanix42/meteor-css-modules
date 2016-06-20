/**
 * Adapted from https://github.com/tmeasday/check-npm-versions
 */
import fs from 'fs';
import semver from 'semver';
import colors from 'colors';

export default function checkNpmPackage(packageWithVersion ) {
	const [packageName, packageVersion ] = packageWithVersion.split('@');

	if (!verifyPackageExists(packageName))
		return false;

	return checkNpmVersion(packageName, packageVersion);
}

function verifyPackageExists(packageName) {
	const packagePath = `${ImportPathHelpers.basePath}/node_modules/${packageName}`;
	return fs.existsSync(packagePath);
}

function checkNpmVersion(name, version){
	try {
		const installedVersion = require(`${name}/package.json`).version;
		if (semver.satisfies(installedVersion, version)) {
			console.log('semver', installedVersion, version)
			return true;
		} else {
			console.warn(colors.yellow.bold(`WARNING: version mismatch for ${name}; installed version is ${installedVersion}, but version ${version} is required by nathantreid:css-modules)`));
			return true;
		}
	} catch (e) {
		console.error(colors.red.bold(`Error checking package: ${name}@${version} (required by nathantreid:css-modules): ${e.message}`));
		return false;
	}
}

