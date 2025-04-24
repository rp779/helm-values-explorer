# Helm Values Hover 🎡

[![Version](https://img.shields.io/visual-studio-marketplace/v/helm-values-hover)](https://marketplace.visualstudio.com/items?itemName=helm-values-hover)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/helm-values-hover)](https://marketplace.visualstudio.com/items?itemName=helm-values-hover)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/helm-values-hover)](https://marketplace.visualstudio.com/items?itemName=helm-values-hover)
[![License](https://img.shields.io/github/license/helm-values-hover)](LICENSE)

> 🚀 Supercharge your Helm development with instant value previews!

A Visual Studio Code extension that enhances your Helm chart development experience by showing values from your `values.yaml` file when hovering over template expressions.

## ✨ Features

- 🔍 **Instant Value Preview**: Hover over any `{{ .Values.* }}` expression to see its current value
- 📁 **Smart File Detection**: Automatically finds `values.yaml` in current or parent directories
- 🎯 **Zero Configuration**: Works out of the box with any Helm chart
- 💪 **Type Support**: Shows proper YAML formatting for complex values

## 📦 Installation

1. Open Visual Studio Code
2. Press `Ctrl+P` / `Cmd+P` to open the Quick Open dialog
3. Type `ext install helm-values-hover` and press Enter

## 🚀 Usage

1. Open a Helm chart directory in VS Code
2. Navigate to any template file (e.g., `templates/deployment.yaml`)
3. Hover over any `{{ .Values.* }}` expression to see its value

### Example

Given this `values.yaml`:
\`\`\`yaml
image:
  repository: nginx
  tag: latest
port: 8080
\`\`\`

When hovering over `{{ .Values.image.repository }}` in your template, you'll see:
\`\`\`yaml
image.repository: nginx
\`\`\`

## 🔧 Requirements

- Visual Studio Code version 1.99.0 or higher
- Helm charts with valid `values.yaml` files

## ⚙️ Extension Settings

This extension currently requires no configuration. It works automatically with any Helm chart structure.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Release Notes

### 0.0.1
- Initial release
- Basic hover functionality for Helm values
- Automatic values.yaml detection
- YAML formatting for complex values

---

**Made with ❤️ for the Helm community**

Got feedback? [Open an issue](https://github.com/yourusername/helm-values-hover/issues) or star the repo if you find it useful!
