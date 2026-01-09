import type PURL from './purl.mjs';

/**
 * Convert an npm package specifier to a PURL.
 * @param spec - npm package specifier (e.g., "lodash@4.17.21", "@babel/core@7.0.0")
 * @returns PURL object
 * @throws {TypeError} If the specifier is invalid or cannot be converted to a PURL
 */
declare function fromNPM(spec: string): PURL;

export default fromNPM;
