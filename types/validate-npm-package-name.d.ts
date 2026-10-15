// `@types/validate-npm-package-name` only covers v4; v5+ has the same shape.

declare module 'validate-npm-package-name' {
	function validate(name: unknown): {
		validForNewPackages: boolean;
		validForOldPackages: boolean;
		warnings?: string[];
		errors?: string[];
	};
	export = validate;
}
