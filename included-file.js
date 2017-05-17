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
    this.contents = null;
  }

  prepInputFile() {
    this.referencedImportPaths = [];

    if (!this.contents) {
      this.contents = fs.readFileSync(this.path, 'utf-8');
    }
    if (pluginOptions.globalVariablesText) {
      this.contents = `${pluginOptions.globalVariablesText}\n\n${this.contents}`;
    }
    this.rawContents = this.contents;
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

