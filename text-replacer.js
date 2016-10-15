export function createReplacer(replacer) {
  if (Array.isArray(replacer)) {
    const pattern = replacer.shift();
    let regexOptions;
    if (replacer.length === 2) {
      regexOptions = replacer.shift();
    }
    const regex = new RegExp(pattern, regexOptions);
    const replacement = replacer.shift();

    return makeReplacer(regex, replacement);
  }

  return makeReplacer(new RegExp(replacer));
}

function makeReplacer(regex, replacement = '') {
  return function replaceText(textToReplace) {
    return textToReplace.replace(regex, replacement);
  };
}
