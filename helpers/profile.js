import pluginOptionsWrapper from '../options';

let pluginOptions = pluginOptionsWrapper.options;
let isFirstLogStatement = true;

function clock(start) {
	if (!start) return process.hrtime();
	var end = process.hrtime(start);
	return Math.round((end[0] * 1000) + (end[1] / 1000000));
}

export default function profile(start, message) {
	if (!pluginOptions.enableProfiling)
		return;

	const time = clock(start);
	if (start !== undefined && message !== undefined) {
		if (isFirstLogStatement) {
			isFirstLogStatement = false;
			console.log('');
		}
		console.log(`${message} ${time}ms`);
	}

	return time;
}

const profilingResults = {};
export function profileFunction(name, fn, context) {
	profilingResults[name] = profilingResults[name] || 0;
	return function(...args) {
		const start = profile();

		let result;
		if (context === undefined)
			result = fn(...args);
		else
			result = fn.apply(context, arguments);
		if (result && result.then) {
			return result.then(function() {
				recordTime(start);
			});
		}

		recordTime(start);
		console.log(name, );
		if (result !== undefined)
			return result;

		function recordTime(start) {
			profilingResults[name] += profile(start);
		}
	}
}

export function displayFunctionProfilingResults() {
	const keys = Object.keys(profilingResults);
	keys.forEach(key=> {
		console.log(`plugin: ${key}: ${profilingResults[key]}ms`);
	});
}
