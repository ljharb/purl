import type PURL from './purl.mjs';
import type { PURLString } from './purl.mjs';

/**
 * Get a PURL's package name as its own ecosystem writes it (eg `@babel/core`, `org.apache.commons:commons-lang3`, `github.com/gorilla/mux`).
 * Only the type, namespace, and name are used; the version, qualifiers, and subpath are ignored.
 * @param purl - PURL string or instance
 * @returns Native package name, or null if the PURL's type has no single well-defined native package name
 * @throws {TypeError} If the PURL is invalid, including for its type (eg a missing required namespace, or an npm namespace that is not an `@scope`)
 */
declare function nativeName(purl: PURL | PURLString | string): string | null;

export default nativeName;
