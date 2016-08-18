import pluginOptionsWrapper from '../options';

let pluginOptions = pluginOptionsWrapper.options;
let isFirstLogStatement = true;

/* clock function thanks to NextLocal: http://stackoverflow.com/a/34970550/1090626 */
function clock(start) {
	if (!start) return process.hrtime();
	var end = process.hrtime(start);
	return Math.round((end[0] * 1000) + (end[1] / 1000000));
}

export default function profile(start, message) {
	if (!pluginOptions.enableProfiling)
		return;

	const time = clock(start);
	if (start !== undefined) {
		if (isFirstLogStatement) {
			isFirstLogStatement = false;
			console.log('');
		}
		console.log(`${message} ${time}ms`);
	}

	return time;
}
