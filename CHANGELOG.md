# Changelog

## [1.1.2] - 2024-02-12
### Added
- Add engine specification.

## [1.1.1] - 2024-02-11
### Changed
- Improve documentation.
- Improve tests.
- Improve examples.

## [1.1.0] - 2024-02-10
### Added
- Add a port parameter to the `PortStream` constructor.
### Changed
- Improve documentation.
- Improve and formalize tests.
- Improve examples.
### Fixed
- Fix a bug in tree traversal that can errantly invoke a function along the property path.
- Implement a more authentic tree traversal algorithm.  The effect of calling a remote method using a Service API should - to the fullest extent possible - resemble the effect of calling the same method on a locally referenced object.  For example, it is now possible to traverse into a method of a function object e.g., `Function.prototype.bind`.  **Please see the instructions for imposing runtime property path restrictions in the [README.md](https://github.com/faranalytics/network-services/?tab=readme-ov-file#restrict-api-calls-at-runtime).**

## [1.0.4] - 2024-02-04
### Fixed
- Improve logic around how message headers are read.
- Improve various aspects of error handling.
- Ensure that muxing errors result in destruction of the stream.

## [1.0.3] - 2024-02-04
### Changed
- Improve documentation.

## [1.0.2] - 2024-02-04
### Added
- Add .gitignore to examples.
### Fixed
- Fix logic for selecting a Mux.

## [1.0.1] - 2024-02-04
### Changed
- Improve examples.
### Fixed
- Prevent instantiation of more than one Service for each stream.Duplex.
- Fix access modifiers.

## [1.0.0] - 2024-02-03
### Added
- This project adheres to Semantic Versioning.
### Changed
### Deprecated
### Fixed
### Removed
### Security