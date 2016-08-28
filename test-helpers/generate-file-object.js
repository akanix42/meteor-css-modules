import ImportPathHelpers from '../helpers/import-path-helpers';
import path from 'path';

export default function generateFileObject(filePath, rawContents, packageName = null) {
  const file = {
    fileOptions: {},
    rawContents,
    referencedImportPaths: [],
    arch: 'web',
    getPackageName() {
      return packageName;
    },
    getPathInPackage() {
      return filePath;
    },
    getBasename() {
      return path.basename(filePath);
    },
    getExtension() {
      return path.extname(filePath);
    }
  };

  file.getFileOptions = function() {
    return file.fileOptions;
  };

  file.getContentsAsString = function() {
    return file.rawContents;
  };

  file.getArch = function() {
    return file.arch;
  };

  file.importPath = ImportPathHelpers.getImportPathInPackage(file);

  return file;
}

export function generatePreprocessedFileObject(filePath, rawContents, packageName = null) {
  const file = generateFileObject(filePath, rawContents, packageName = null);
  file.contents = file.rawContents;
  return file;
}
