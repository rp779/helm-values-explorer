# Helm Values Explorer 🎡

[![Version](https://img.shields.io/visual-studio-marketplace/v/helm-values-explorer)](https://marketplace.visualstudio.com/items?itemName=helm-values-explorer)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/helm-values-explorer)](https://marketplace.visualstudio.com/items?itemName=helm-values-explorer)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/helm-values-explorer)](https://marketplace.visualstudio.com/items?itemName=helm-values-explorer)
[![License](https://img.shields.io/github/license/helm-values-explorer)](LICENSE)

> 🚀 Navigate Helm values across multiple environments with ease!

A Visual Studio Code extension that makes Helm chart development easier by instantly showing values from multiple environment-specific files.

## ✨ Features

- 🔍 **Smart Value Preview**: Hover over any `{{ .Values.* }}` expression to instantly see values
- 🌍 **Multi-Environment Support**: View values from multiple files (e.g., values.yaml, dev-values.yaml, prod-values.yaml)
- 📁 **Intelligent File Detection**: Automatically finds values files in current and parent directories
- 🎯 **Zero Configuration**: Works out of the box with any Helm chart
- 💪 **Rich Value Display**: Shows properly formatted YAML with clear source labeling

## 📦 Installation

1. Open Visual Studio Code
2. Press `Ctrl+P` / `Cmd+P` to open the Quick Open dialog
3. Type `ext install helm-values-explorer` and press Enter

## 🚀 Usage

1. Open a Helm chart directory in VS Code
2. Navigate to any template file (e.g., `templates/deployment.yaml`)
3. Hover over any `{{ .Values.* }}` expression to see values from all matching files

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

When hovering over `{{ .Values.image.repository }}`, you'll see:
```yaml
[values.yaml] image.repository: nginx
[dev-values.yaml] image.repository: nginx-dev
[prod-values.yaml] image.repository: nginx-prod
```

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

### 0.0.1
- Initial release
- Multi-environment values preview
- Automatic values file detection
- YAML formatting with source labels

---

**Made with ❤️ for the Helm community**

Got feedback? [Open an issue](https://github.com/yourusername/helm-values-explorer/issues) or star the repo if you find it useful!
