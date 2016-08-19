import path from 'path';
import fs from 'fs';
import sha1 from './sha1';
import pluginOptionsWrapper from './options';

const pluginOptions = pluginOptionsWrapper.options;

export default class IncludedFile {
  constructor(filePath, backingInputFile) {
    this.path = filePath;
    this.inputFile = backingInputFile;
    this.extension = path.extname(this.path);
    this.basename = path.basename(this.path);
  }

  async prepInputFile(file) {
    file.referencedImportPaths = [];

    file.contents = await (new Promise((resolve, reject) => fs.readFile(file.path, 'utf-8', function(err, result) {
      if (err) reject(err);
      resolve(result);
    })));

    if (pluginOptions.globalVariablesText) {
      file.contents = `${pluginOptions.globalVariablesText}\n\n${file.contents}`;
    }
    file.rawContents = file.contents;
  }

  addJavaScript(options) {
    this.inputFile.addJavaScript(options);
  }

  addStylesheet(options) {
    this.inputFile.addStylesheet(options);
  }

  error(data) {
    data.message = 'Explicitly imported file error: ' + data.message;
    this.inputFile.error(data);
  }

  getArch() {
    return this.inputFile.getArch();
  }

  getBasename() {
    return this.basename;
  }

  getContentsAsString() {
    return this.contents;
  }

  getDisplayPath() {
    return this.path;
  }

  getExtension() {
    return this.extension;
  }

  getFileOptions() {
    return {};
  }

  getPackageName() {
    return null;
  }

  getPathInPackage() {
    return this.path;
  }

  getSourceHash() {
    return sha1(this.getContentsAsString());
  }

};

