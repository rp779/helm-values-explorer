# Helm Values Explorer

[![Version](https://flat.badgen.net/vs-marketplace/v/rossp.helm-values-explorer)](https://marketplace.visualstudio.com/items?itemName=rossp.helm-values-explorer)
[![Installs](https://flat.badgen.net/vs-marketplace/i/rossp.helm-values-explorer)](https://marketplace.visualstudio.com/items?itemName=rossp.helm-values-explorer)
[![Rating](https://flat.badgen.net/vs-marketplace/rating/rossp.helm-values-explorer)](https://marketplace.visualstudio.com/items?itemName=rossp.helm-values-explorer)
[![License: MIT](https://flat.badgen.net/badge/license/MIT/blue)](LICENSE)

A Visual Studio Code extension that enhances your Helm chart development workflow by providing instant value previews and navigation across multiple environment-specific values files.

## Features

- **Smart Value Preview**: Hover over any `{{ .Values.* }}` expression to instantly see values from all matching files
- **Advanced Expression Support**: Works with complex Helm expressions including pipes, functions, and filters
- **Intelligent Autocomplete**: Get context-aware suggestions when typing `.Values` paths
- **Go to Definition**: Navigate directly to value definitions across multiple files
- **Multi-Environment Support**: View values from multiple files (values.yaml, dev-values.yaml, prod-values.yaml, etc.)
- **Automatic File Detection**: Finds values files in current and parent directories with configurable patterns
- **Zero Configuration**: Works out of the box with any Helm chart structure
- **Performance Optimized**: Smart caching with file watching for fast response times

## Installation

1. Open Visual Studio Code
2. Press `Ctrl+P` / `Cmd+P` to open the Quick Open dialog
3. Type `ext install rossp.helm-values-explorer` and press Enter

## Usage

1. Open a Helm chart directory in VS Code
2. Navigate to any template file (e.g., `templates/deployment.yaml`)
3. **Hover** over any `{{ .Values.* }}` expression to see values from all matching files
4. **Ctrl+Click** on any `{{ .Values.* }}` expression to navigate to its definition in the values file(s)
5. **Type** `{{ .Values.` to get autocomplete suggestions for available value paths

### Example

Given these files:
```
mychart/
├── values.yaml         # Default values
├── dev-values.yaml     # Development overrides
├── prod-values.yaml    # Production overrides
└── templates/
    └── deployment.yaml
```

**Hover Preview**: When hovering over `{{ .Values.image.repository }}`, you'll see values from all matching files with clear source labeling.

**Go to Definition**: Ctrl+Click on `{{ .Values.image.repository }}` will jump to the definition of `image.repository` in the values file(s), allowing you to quickly navigate and edit the values.

**Autocomplete**: Type `{{ .Values.image.` and press Ctrl+Space to see available properties like `repository`, `tag`, and `pullPolicy`.

## Configuration

This extension contributes the following settings:

* `helmValuesExplorer.valueFiles`: Patterns to match Helm values files (default: `["values.yaml", "*values.yaml", "values.*.yaml"]`)
* `helmValuesExplorer.showFileNames`: Show source file names in hover preview (default: `true`)

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Release Notes
### 0.0.7 (2025-01-XX)
- **Enhanced Pattern Matching**: Support for complex Helm expressions with pipes, functions, and filters (e.g., `{{ .Values.port | default 8080 }}`)
- **Improved Hover Detection**: Hover works anywhere within `{{ }}` expressions, not just on specific words
- **Intelligent Autocomplete**: Context-aware suggestions when typing `.Values` paths
- **Performance Improvements**: Smart caching with file watching for faster response times
- **Better User Experience**: Cleaner hover popup formatting with organized multi-file value display
- **Go to Definition**: Navigate directly to value definitions across multiple files

### 0.0.6 (2025-04-28)
- Lowered minimum VSCode version requirement to 1.74.0 for better compatibility

### 0.0.5 (2025-04-24)
- Synchronized README and CHANGELOG release notes for better documentation consistency

### 0.0.4 (2025-04-24)
- Updated CHANGELOG format and documentation
- Improved README badge clarity using badgen.net

### 0.0.3 (2025-04-24)
- Updated extension icon
- Improved package size by excluding development assets
- Fixed README badges for better visibility on GitHub

### 0.0.2 (2025-04-24)
- Updated extension icon
- Fixed README formatting and badge display

### 0.0.1 (2025-04-24)
- Initial release
- Hover preview for Helm values
- Support for multiple value files (values.yaml, dev-values.yaml, prod-values.yaml)
- Automatic value file detection in current and parent directories
- YAML formatting with source file labels
- Configurable value file patterns
- Toggle for showing/hiding source file names in hover


---

**Made for the Helm community**

Got feedback? [Open an issue](https://github.com/rp779/helm-values-explorer/issues) or star the repo if you find it useful!
