import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'fast-glob';

// Interface for storing values with their source file
interface ValueWithSource {
    value: any;
    source: string;
}

// Function to find and parse values files
function findAndParseValuesFiles(document: vscode.TextDocument): Map<string, Map<string, ValueWithSource>> {
    const documentDir = path.dirname(document.uri.fsPath);
    let currentDir = documentDir;
    const valuesMap = new Map<string, Map<string, ValueWithSource>>();
    
    while (currentDir.length > 1) {
        // Get user-configured patterns
        const config = vscode.workspace.getConfiguration('helmValuesExplorer');
        const patterns = config.get<string[]>('valueFiles') || ['values.yaml', '*values.yaml', 'values.*.yaml'];
        
        console.log('Searching in directory:', currentDir);
        console.log('Using patterns:', patterns);
        
        // Find all matching files in current directory
        const valueFiles = glob.sync(patterns, {
            cwd: currentDir,
            absolute: true,
            onlyFiles: true,
            dot: true
        });
        
        console.log('Found value files:', valueFiles);

        for (const filePath of valueFiles) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const values = yaml.load(content) as any;
                const fileName = path.basename(filePath);
                
                console.log('Processing file:', fileName);
                
                // Extract all values with their paths
                const fileValues = new Map<string, ValueWithSource>();
                function extractValues(obj: any, prefix = '') {
                    for (const [key, value] of Object.entries(obj)) {
                        const fullPath = prefix ? `${prefix}.${key}` : key;
                        if (value && typeof value === 'object') {
                            extractValues(value, fullPath);
                        } else {
                            fileValues.set(fullPath, { value, source: fileName });
                        }
                    }
                }
                
                if (values) {
                    extractValues(values);
                    valuesMap.set(fileName, fileValues);
                    console.log(`Added values from ${fileName}`);
                }
            } catch (error) {
                console.error(`Error parsing ${filePath}:`, error);
            }
        }
        
        // Always check parent directory once
        if (currentDir === documentDir) {
            currentDir = path.dirname(currentDir);
        } else {
            break;
        }
    }
    
    return valuesMap;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Helm Values Explorer is now active!');

    // Register hover provider for yaml files
    const hoverProvider = vscode.languages.registerHoverProvider('yaml', {
        provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
            const range = document.getWordRangeAtPosition(position);
            if (!range) {
                return undefined;
            }

            const line = document.lineAt(position.line).text;
            
            // Match all {{ .Values.* }} patterns in the line
            const valueMatches = [...line.matchAll(/\{\{\s*\.Values\.([^}\s]+)\s*\}\}/g)];
            if (valueMatches.length === 0) {
                return undefined;
            }

            console.log('Found value patterns:', valueMatches.map(m => m[1]));

            const valuesMap = findAndParseValuesFiles(document);
            console.log('Values files found:', Array.from(valuesMap.keys()));

            if (valuesMap.size === 0) {
                return new vscode.Hover('No values files found in the current or parent directories.');
            }

            // Create markdown content showing values from all files
            const content = new vscode.MarkdownString();
            const config = vscode.workspace.getConfiguration('helmValuesExplorer');
            const showFileNames = config.get<boolean>('showFileNames', true);

            for (const valuePath of valueMatches.map(match => match[1])) {
                console.log('Looking up value path:', valuePath);
                const valuesFound = new Map<string, any>();
                
                // Collect values from all files
                for (const [fileName, fileValues] of valuesMap.entries()) {
                    const valueInfo = fileValues.get(valuePath);
                    if (valueInfo) {
                        console.log(`Found value in ${fileName}:`, valueInfo.value);
                        valuesFound.set(fileName, valueInfo.value);
                    }
                }

                if (valuesFound.size > 0) {
                    content.appendMarkdown(`\n**${valuePath}**:\n`);
                    for (const [fileName, value] of valuesFound.entries()) {
                        const label = showFileNames ? `[${fileName}] ` : '';
                        content.appendCodeblock(`${label}${yaml.dump({ [valuePath]: value }).trim()}`, 'yaml');
                    }
                }
            }

            return content.value ? new vscode.Hover(content) : undefined;
        }
    });

    context.subscriptions.push(hoverProvider);
}

export function deactivate() {}
