import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

// Function to find and parse values.yaml
function findAndParseValuesFile(document: vscode.TextDocument): any {
    const documentDir = path.dirname(document.uri.fsPath);
    let currentDir = documentDir;
    
    // Look for values.yaml in current and parent directories
    while (currentDir.length > 1) {
        const valuesPath = path.join(currentDir, 'values.yaml');
        if (fs.existsSync(valuesPath)) {
            try {
                const content = fs.readFileSync(valuesPath, 'utf8');
                return yaml.load(content);
            } catch (error) {
                console.error('Error parsing values.yaml:', error);
                return null;
            }
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}

// Function to get value from nested object using path
function getValueByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[part];
    }
    
    return current;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Helm Values Hover extension is now active!');

    // Register hover provider for yaml files
    const hoverProvider = vscode.languages.registerHoverProvider('yaml', {
        provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
            const range = document.getWordRangeAtPosition(position);
            if (!range) {
                return undefined;
            }

            const line = document.lineAt(position.line).text;
            
            // Match {{ .Values.* }} pattern
            const valueMatch = line.match(/\{\{\s*\.Values\.([^}\s]+)\s*\}\}/);
            if (!valueMatch) {
                return undefined;
            }

            const valuePath = valueMatch[1];
            const values = findAndParseValuesFile(document);
            
            if (!values) {
                return new vscode.Hover('No values.yaml file found in the current or parent directories.');
            }

            const value = getValueByPath(values, valuePath);
            
            if (value === undefined) {
                return new vscode.Hover(`Value '${valuePath}' not found in values.yaml`);
            }

            // Create markdown content for hover
            const content = new vscode.MarkdownString();
            content.appendCodeblock(yaml.dump({ [valuePath]: value }), 'yaml');
            
            return new vscode.Hover(content);
        }
    });

    context.subscriptions.push(hoverProvider);
}

export function deactivate() {}
