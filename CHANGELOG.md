# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2.2.0](https://github.com/ljharb/purl/compare/v2.1.0...v2.2.0) - 2026-06-18

### Commits

- [New] add `chrome-extension` and `vscode-extension` types; deprecate `chrome` and `vscode` [`43165bf`](https://github.com/ljharb/purl/commit/43165bf128cbcc1a18492500829c601b76f0e3ac)
- [Refactor] remove unpublished `chrome` and `vscode` type aliases [`5c7c968`](https://github.com/ljharb/purl/commit/5c7c96842149530d5144a42116ad47d435a82320)
- [New] add `chrome` type for Chrome Web Store browser extensions [`2f603dc`](https://github.com/ljharb/purl/commit/2f603dcebf1d6b55608a00450ed44e11f5662074)
- [Deps] update `pargs` [`955c658`](https://github.com/ljharb/purl/commit/955c65857da32901fe1849b33540d392bc22685c)
- [New] add `vscode` type for Visual Studio Code extensions [`c2e0279`](https://github.com/ljharb/purl/commit/c2e0279fecd8c260492b6ad5c90a1897e0d88191)
- [actions] update workflows [`9e6b7d4`](https://github.com/ljharb/purl/commit/9e6b7d4f3074271db0cd0b572c91a964a8da1305)
- [Dev Deps] update `@arethetypeswrong/cli`, `auto-changelog`, `tape` [`63a75c2`](https://github.com/ljharb/purl/commit/63a75c22749df6543315ed34c4a21fcf6470c381)
- [Dev Deps] update `@ljharb/eslint-config`, `@types/node`, `eslint` [`b8dc0e3`](https://github.com/ljharb/purl/commit/b8dc0e36bec082f25d6107c60d1114508a5b869a)
- [Dev Deps] update `eslint`, `tape` [`c537c6b`](https://github.com/ljharb/purl/commit/c537c6b0dc80374fc85c78f9a8248d49e07300a5)
- [Dev Deps] override `yargs` to 17.7.3-candidate.0 (Node 26 require(ESM) fix) [`d0c7940`](https://github.com/ljharb/purl/commit/d0c7940ee378fb42674c558564c36b4d63613b72)
- [Deps] update `pargs` [`ea210fc`](https://github.com/ljharb/purl/commit/ea210fc8dec99f8f0a849026e5496abeb7e51a02)
- [readme] fix actions badge [`5ab6c32`](https://github.com/ljharb/purl/commit/5ab6c32fea44225fe0ffa9dcbe5e6cfd488cf318)
- [Deps] update `pargs` [`0353b5b`](https://github.com/ljharb/purl/commit/0353b5be8a71dc3e253492c5250ecc61dee9a9d4)
- [Dev Deps] update `@arethetypeswrong/cli` [`16cf0bb`](https://github.com/ljharb/purl/commit/16cf0bb3a5570e67dac55e1baf654c7ba906f48b)

## [v2.1.0](https://github.com/ljharb/purl/compare/v2.0.0...v2.1.0) - 2026-01-14

### Commits

- [New] integrate purl-types.json for full type support [`e8dd45f`](https://github.com/ljharb/purl/commit/e8dd45f8ef96f73f0883fc679fa6c88281ef822f)

## [v2.0.0](https://github.com/ljharb/purl/compare/v1.0.4...v2.0.0) - 2026-01-08

### Commits

- [Breaking] complete reimplementation [`b88c079`](https://github.com/ljharb/purl/commit/b88c079d0d56e0f061f8d2b6a1df71e355587e7c)
- Initial commit [`d53d0a0`](https://github.com/ljharb/purl/commit/d53d0a0cf2763c27dd19eb0e9ad62451f78384f4)
- npm init [`2ba41d2`](https://github.com/ljharb/purl/commit/2ba41d2b0b1edcb030122f945651dccb20ca671e)
- Only apps should have lockfiles [`7c72917`](https://github.com/ljharb/purl/commit/7c72917bfc1e557ec63d406250533f3b4d0fc192)
- [readme] add note about pre-v2 versions [`9ce1e9b`](https://github.com/ljharb/purl/commit/9ce1e9bbfca6810ee318f074d66fb865b6ce756a)
- [meta] add missing npmrc settings [`92056e3`](https://github.com/ljharb/purl/commit/92056e32e5685edfbbb2c807fb87c1fe49313c2d)

## [v1.0.4](https://github.com/ljharb/purl/compare/v1.0.3...v1.0.4) - 2015-08-18

### Merged

- Fix for issue #4 - Does not match _ (underscores) in path parameters [`#5`](https://github.com/ljharb/purl/pull/5)
- Merge branch 'release/1.0.3' into develop [`#3`](https://github.com/ljharb/purl/pull/3)

## [v1.0.3](https://github.com/ljharb/purl/compare/v1.0.2...v1.0.3) - 2015-06-14

### Commits

- Add server and client tests for purl [`4a65625`](https://github.com/ljharb/purl/commit/4a65625e46e26076b5481708efb2a778cf95ea2d)
- remove old tests.js [`35aee10`](https://github.com/ljharb/purl/commit/35aee102dde3f60c21cb7ec1a4772648a5143cee)
- correct build tasks order and add support for client tests [`1e24ad3`](https://github.com/ljharb/purl/commit/1e24ad39ddcae6c0d29887241378bbc4adcaf141)
- move tests from tests/ to root folder [`44c0af0`](https://github.com/ljharb/purl/commit/44c0af030e784b009fe2c59b2445e48acd539fbb)
- bump up version [`43d4d1b`](https://github.com/ljharb/purl/commit/43d4d1bf8a4f0a593d34570104fa0fb5e64db57b)
- ensure tests folder is not published to npm [`deb211d`](https://github.com/ljharb/purl/commit/deb211d44bdeee81fff8e93da79c1862b3f74a86)
- add jsdom 3.x as a dev dependency [`8fd621f`](https://github.com/ljharb/purl/commit/8fd621f7bf6567bf1935847071d371cac8596c03)

## [v1.0.2](https://github.com/ljharb/purl/compare/v1.0.1...v1.0.2) - 2015-06-11

### Merged

- Fix mistakes in README [`#2`](https://github.com/ljharb/purl/pull/2)
- Merge branch 'hotfix/fix-tests-and-global-export' into develop [`#1`](https://github.com/ljharb/purl/pull/1)

### Commits

- remove manual global exports to rely on webpack for browser builds [`c3c44b5`](https://github.com/ljharb/purl/commit/c3c44b5e8ef8bb8dbf450d8eef06e5b32c7b79a5)
- modify webpack settings to output library code exposing purl as global [`51dbdb4`](https://github.com/ljharb/purl/commit/51dbdb4cb7d23928ac41f2aa8e7b2f7ae73941b4)

## [v1.0.1](https://github.com/ljharb/purl/compare/v1.0.0...v1.0.1) - 2015-06-11

### Commits

- fix global export of purl [`2dad020`](https://github.com/ljharb/purl/commit/2dad0208b78fdb431163a0ba57224e8b96cf8803)
- fix tests not running as part of build [`2ec10fc`](https://github.com/ljharb/purl/commit/2ec10fc9cfb8e438475db3021ddfa1fcf6434062)

## [v1.0.0](https://github.com/ljharb/purl/compare/v0.0.1...v1.0.0) - 2015-06-11

### Commits

- implement purl and tests [`3680bfe`](https://github.com/ljharb/purl/commit/3680bfef16f88e5ab8c0294ab6db5bd642b8f2f4)
- add browser distributions [`e8e3ae7`](https://github.com/ljharb/purl/commit/e8e3ae78185690104bb507cb3edd91c1bad1e8dc)
- update README to add documentation and badges [`6b74811`](https://github.com/ljharb/purl/commit/6b74811e301aaeeb0eda3b583dde18b8bd0b5b90)
- add webpack configuration [`cbe0247`](https://github.com/ljharb/purl/commit/cbe0247d51d7a61452119d6931e80d74904a9788)
- Initial commit [`a7d280a`](https://github.com/ljharb/purl/commit/a7d280afe2a871f6c385eb2709a4b6d90ee9f85c)
- add Gulpfile [`6ed6c74`](https://github.com/ljharb/purl/commit/6ed6c74ac003c320e8f11f4c9d4076796db9d8af)
- add package manifest [`1f08c3f`](https://github.com/ljharb/purl/commit/1f08c3f0534cb8034a962618157fb33ebd2c57c7)
- add ESLint settings [`4b7519a`](https://github.com/ljharb/purl/commit/4b7519a7a7c3457a574efaafc5715d195e1687cd)
- add travis config file [`6b3e4ee`](https://github.com/ljharb/purl/commit/6b3e4ee2ed7fa9378130e81dea3de7bdede8c4bc)
- add NPM publish ignore list [`7b8f915`](https://github.com/ljharb/purl/commit/7b8f915d3578f8fc7319afa8e84d8e97594bab64)

## v0.0.1 - 2012-04-12
