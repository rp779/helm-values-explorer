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

// Interface for storing value locations
interface ValueLocation {
    file: string;
    line: number;
    column: number;
}

// Function to find the line and column of a YAML key in a file
function findYamlKeyLocation(filePath: string, keyPath: string): ValueLocation | undefined {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const keys = keyPath.split('.');
        
        let currentIndent = 0;
        let foundKeys = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }
            
            // Calculate indentation
            const indent = line.length - line.trimStart().length;
            
            // Check if this line contains a key
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                
                // If we're looking for the next key in our path
                if (foundKeys < keys.length && key === keys[foundKeys]) {
                    // Check if indentation is correct for this level
                    if (foundKeys === 0 || indent >= currentIndent) {
                        foundKeys++;
                        currentIndent = indent;
                        
                        // If we found all keys, this is our target
                        if (foundKeys === keys.length) {
                            return {
                                file: filePath,
                                line: i,
                                column: indent
                            };
                        }
                    }
                } else if (indent <= currentIndent && foundKeys > 0) {
                    // We've moved back to a higher level, reset our search
                    if (key === keys[0]) {
                        foundKeys = 1;
                        currentIndent = indent;
                    } else {
                        foundKeys = 0;
                        currentIndent = 0;
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error finding key location in ${filePath}:`, error);
    }
    
    return undefined;
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

// Function to get all values files with their full paths
function getValuesFilePaths(document: vscode.TextDocument): string[] {
    const documentDir = path.dirname(document.uri.fsPath);
    let currentDir = documentDir;
    const filePaths: string[] = [];
    
    while (currentDir.length > 1) {
        const config = vscode.workspace.getConfiguration('helmValuesExplorer');
        const patterns = config.get<string[]>('valueFiles') || ['values.yaml', '*values.yaml', 'values.*.yaml'];
        
        const valueFiles = glob.sync(patterns, {
            cwd: currentDir,
            absolute: true,
            onlyFiles: true,
            dot: true
        });
        
        filePaths.push(...valueFiles);
        
        if (currentDir === documentDir) {
            currentDir = path.dirname(currentDir);
        } else {
            break;
        }
    }
    
    return filePaths;
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

    // Register definition provider for yaml files
    const definitionProvider = vscode.languages.registerDefinitionProvider('yaml', {
        provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Definition | undefined {
            const line = document.lineAt(position.line).text;
            
            // Find all {{ .Values.* }} patterns in the line
            const valueMatches = [...line.matchAll(/\{\{\s*\.Values\.([^}\s]+)\s*\}\}/g)];
            if (valueMatches.length === 0) {
                return undefined;
            }

            // Check if the cursor is within one of the .Values expressions
            let targetValuePath: string | undefined;
            for (const match of valueMatches) {
                const startIndex = match.index! + match[0].indexOf('.Values.');
                const endIndex = startIndex + '.Values.'.length + match[1].length;
                
                if (position.character >= startIndex && position.character <= endIndex) {
                    targetValuePath = match[1];
                    break;
                }
            }

            if (!targetValuePath) {
                return undefined;
            }

            console.log('Looking for definition of:', targetValuePath);

            // Get all values files
            const valuesFilePaths = getValuesFilePaths(document);
            const locations: vscode.Location[] = [];

            // Find the value in each file
            for (const filePath of valuesFilePaths) {
                const location = findYamlKeyLocation(filePath, targetValuePath);
                if (location) {
                    const uri = vscode.Uri.file(location.file);
                    const range = new vscode.Range(
                        new vscode.Position(location.line, location.column),
                        new vscode.Position(location.line, location.column + targetValuePath.split('.').pop()!.length)
                    );
                    locations.push(new vscode.Location(uri, range));
                    console.log(`Found definition in ${filePath} at line ${location.line + 1}`);
                }
            }

            return locations.length > 0 ? locations : undefined;
        }
    });

    context.subscriptions.push(hoverProvider, definitionProvider);
}

export function deactivate() {}
