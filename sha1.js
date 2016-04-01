import {createHash} from "crypto";

export default function sha1(contents) {
	var hash = createHash('sha1');
	hash.update(contents);
	return hash.digest('hex');
};
