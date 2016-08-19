/* globals ImportPathHelpers */
/**
 * Adapted from https://github.com/tmeasday/check-npm-versions
 */
import fs from 'fs';
import semver from 'semver';
import colors from 'colors';
import logger from './logger';

export default function checkNpmPackage(packageWithVersion ) {
	const [ packageName, packageVersion ] = packageWithVersion.split('@');

	if (!verifyPackageExists(packageName, packageVersion))
		return false;

	return checkNpmVersion(packageName, packageVersion);
}

function verifyPackageExists(packageName, packageVersion) {
	const packagePath = `${ImportPathHelpers.basePath}/node_modules/${packageName}`;
	const doesPackageExist = fs.existsSync(packagePath);
	if (!doesPackageExist)
		logger.error(colors.red.bold(`Error checking npm module: ${packageName}@${packageVersion} (required by nathantreid:css-modules): module not found. Please ensure you have installed the module; here is the command:\n meteor npm install ${packageName} --save-dev\n`));

	return doesPackageExist;
}

function checkNpmVersion(name, version){
	try {
		const installedVersion = require(`${name}/package.json`).version;
		if (semver.satisfies(installedVersion, version)) {
			return true;
		} else {
			logger.warn(colors.yellow.bold(`WARNING: version mismatch for ${name}; installed version is ${installedVersion}, but version ${version} is required by nathantreid:css-modules)`));
			return true;
		}
	} catch (e) {
		logger.error(colors.red.bold(`Error checking package: ${name}@${version} (required by nathantreid:css-modules): ${e.message}`));
		return false;
	}
}

