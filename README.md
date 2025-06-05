# Helm Values Explorer 🎡

[![Version](https://flat.badgen.net/vs-marketplace/v/rossp.helm-values-explorer)](https://marketplace.visualstudio.com/items?itemName=rossp.helm-values-explorer)
[![Installs](https://flat.badgen.net/vs-marketplace/i/rossp.helm-values-explorer)](https://marketplace.visualstudio.com/items?itemName=rossp.helm-values-explorer)
[![Rating](https://flat.badgen.net/vs-marketplace/rating/rossp.helm-values-explorer)](https://marketplace.visualstudio.com/items?itemName=rossp.helm-values-explorer)
[![License: MIT](https://flat.badgen.net/badge/license/MIT/blue)](LICENSE)

> 🚀 Navigate Helm values across multiple environments with ease!

A Visual Studio Code extension that enhances your Helm chart development experience by providing instant value previews from multiple environment-specific values files.

## ✨ Features

- 🔍 **Smart Value Preview**: Hover over any `{{ .Values.* }}` expression to instantly see values
- 🎯 **Go to Definition**: Ctrl+Click on any `{{ .Values.* }}` expression to jump directly to its definition in the relevant values file(s)
- 🌍 **Multi-Environment Support**: View values from multiple files (e.g., values.yaml, dev-values.yaml, prod-values.yaml)
- 📁 **Intelligent File Detection**: Automatically finds values files in current and parent directories
- 🎯 **Zero Configuration**: Works out of the box with any Helm chart
- 💪 **Rich Value Display**: Shows properly formatted YAML with clear source labeling

## 📦 Installation

1. Open Visual Studio Code
2. Press `Ctrl+P` / `Cmd+P` to open the Quick Open dialog
3. Type `ext install rossp.helm-values-explorer` and press Enter

## 🚀 Usage

1. Open a Helm chart directory in VS Code
2. Navigate to any template file (e.g., `templates/deployment.yaml`)
3. **Hover** over any `{{ .Values.* }}` expression to see values from all matching files
4. **Ctrl+Click** on any `{{ .Values.* }}` expression to navigate to its definition in the values file(s)

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

**Hover Preview**: When hovering over `{{ .Values.image.repository }}`, you'll see:
```yaml
[values.yaml] image.repository: nginx
[dev-values.yaml] image.repository: nginx-dev
[prod-values.yaml] image.repository: nginx-prod
```

**Go to Definition**: Ctrl+Click on `{{ .Values.image.repository }}` will jump to the definition of `image.repository` in the values file(s), allowing you to quickly navigate and edit the values.

## 🔧 Extension Settings

This extension contributes the following settings:

* `helmValuesExplorer.valueFiles`: Patterns to match Helm values files (default: `["values.yaml", "*values.yaml", "values.*.yaml"]`)
* `helmValuesExplorer.showFileNames`: Show source file names in hover preview (default: `true`)

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Release Notes
### 0.0.7 (2025-01-XX)
- Added **Go to Definition** support: Ctrl+Click on any `{{ .Values.* }}` expression to jump directly to its definition
- Navigate between values definitions across multiple environment files
- Precise cursor positioning at the exact YAML key location

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

**Made with ❤️ for the Helm community**

Got feedback? [Open an issue](https://github.com/rp779/helm-values-explorer/issues) or star the repo if you find it useful!
