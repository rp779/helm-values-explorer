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

// Interface for caching parsed values
interface ValuesCache {
    values: Map<string, Map<string, ValueWithSource>>;
    lastModified: Map<string, number>;
}

// Interface for Helm template expression matches
interface HelmValueMatch {
    valuePath: string;
    fullMatch: string;
    startIndex: number;
    endIndex: number;
}

// Global cache for values
let valuesCache: ValuesCache = {
    values: new Map(),
    lastModified: new Map()
};

// File watchers for cache invalidation
const fileWatchers = new Map<string, vscode.FileSystemWatcher>();

// Helper function to format values for display
function formatValueForDisplay(value: any): string {
    if (value === null || value === undefined) {
        return 'null';
    }
    
    if (typeof value === 'string') {
        // Handle multiline strings nicely
        if (value.includes('\n')) {
            return value;
        }
        return `"${value}"`;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return '[]';
        }
        if (value.length <= 3 && value.every(item => typeof item !== 'object')) {
            // Short arrays of primitives - show inline
            return `[${value.map(item => typeof item === 'string' ? `"${item}"` : String(item)).join(', ')}]`;
        }
        // Longer or complex arrays - show as YAML
        return yaml.dump(value).trim();
    }
    
    if (typeof value === 'object') {
        return yaml.dump(value).trim();
    }
    
    return String(value);
}

// Helper function to determine the appropriate language for syntax highlighting
function getValueLanguage(value: any): string {
    if (typeof value === 'string' && !value.includes('\n')) {
        return 'text';
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
        return 'text';
    }
    
    if (Array.isArray(value) && value.length <= 3 && value.every(item => typeof item !== 'object')) {
        return 'json';
    }
    
    return 'yaml';
}

// Enhanced function to find Helm .Values expressions with better pattern matching
function findHelmValueExpressions(text: string): HelmValueMatch[] {
    const matches: HelmValueMatch[] = [];
    
    // Improved regex to handle complex Helm expressions
    // Matches: {{ .Values.path }}, {{ .Values.path | function }}, {{ .Values.path | function "arg" }}, etc.
    const helmRegex = /\{\{\s*-?\s*\.Values\.([a-zA-Z0-9_.]+)(?:\s*\|\s*[^}]+)?\s*-?\s*\}\}/g;
    
    let match;
    while ((match = helmRegex.exec(text)) !== null) {
        const valuePath = match[1];
        const fullMatch = match[0];
        const startIndex = match.index;
        const endIndex = match.index + fullMatch.length;
        
        matches.push({
            valuePath,
            fullMatch,
            startIndex,
            endIndex
        });
    }
    
    return matches;
}

// Function to check if cursor position is within a Helm expression
function isPositionInHelmExpression(line: string, position: number): HelmValueMatch | undefined {
    const expressions = findHelmValueExpressions(line);
    
    for (const expr of expressions) {
        if (position >= expr.startIndex && position <= expr.endIndex) {
            return expr;
        }
    }
    
    return undefined;
}

// Function to invalidate cache for a specific file
function invalidateCache(filePath: string): void {
    const fileName = path.basename(filePath);
    valuesCache.values.delete(fileName);
    valuesCache.lastModified.delete(filePath);
    console.log(`Cache invalidated for ${fileName}`);
}

// Function to setup file watchers for values files
function setupFileWatcher(filePath: string): void {
    if (fileWatchers.has(filePath)) {
        return;
    }
    
    const watcher = vscode.workspace.createFileSystemWatcher(filePath);
    
    watcher.onDidChange(() => invalidateCache(filePath));
    watcher.onDidDelete(() => invalidateCache(filePath));
    
    fileWatchers.set(filePath, watcher);
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

// Enhanced function to find and parse values files with caching
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
            const fileName = path.basename(filePath);
            
            try {
                // Check if file is cached and up-to-date
                const stats = fs.statSync(filePath);
                const lastModified = stats.mtime.getTime();
                const cachedModified = valuesCache.lastModified.get(filePath);
                
                if (cachedModified === lastModified && valuesCache.values.has(fileName)) {
                    console.log(`Using cached values for ${fileName}`);
                    const cachedValues = valuesCache.values.get(fileName);
                    if (cachedValues) {
                        valuesMap.set(fileName, cachedValues);
                        continue;
                    }
                }
                
                // Parse file and update cache
                const content = fs.readFileSync(filePath, 'utf8');
                const values = yaml.load(content) as any;
                
                console.log('Processing file:', fileName);
                
                // Extract all values with their paths
                const fileValues = new Map<string, ValueWithSource>();
                function extractValues(obj: any, prefix = '') {
                    if (!obj || typeof obj !== 'object') {
                        return;
                    }
                    
                    for (const [key, value] of Object.entries(obj)) {
                        const fullPath = prefix ? `${prefix}.${key}` : key;
                        if (value && typeof value === 'object' && !Array.isArray(value)) {
                            extractValues(value, fullPath);
                        } else {
                            fileValues.set(fullPath, { value, source: fileName });
                        }
                    }
                }
                
                if (values) {
                    extractValues(values);
                    valuesMap.set(fileName, fileValues);
                    
                    // Update cache
                    valuesCache.values.set(fileName, fileValues);
                    valuesCache.lastModified.set(filePath, lastModified);
                    
                    // Setup file watcher
                    setupFileWatcher(filePath);
                    
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

    // Register enhanced hover provider for yaml files
    const hoverProvider = vscode.languages.registerHoverProvider('yaml', {
        provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
            const line = document.lineAt(position.line).text;
            const cursorPosition = position.character;
            
            // Check if cursor is within a Helm expression
            const helmExpression = isPositionInHelmExpression(line, cursorPosition);
            if (!helmExpression) {
                return undefined;
            }

            console.log('Found Helm expression:', helmExpression);

            const valuesMap = findAndParseValuesFiles(document);
            console.log('Values files found:', Array.from(valuesMap.keys()));

            if (valuesMap.size === 0) {
                return new vscode.Hover('No values files found in the current or parent directories.');
            }

            // Create markdown content showing values from all files
            const content = new vscode.MarkdownString();
            const config = vscode.workspace.getConfiguration('helmValuesExplorer');
            const showFileNames = config.get<boolean>('showFileNames', true);

            const valuePath = helmExpression.valuePath;
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
                // Header with the value path
                content.appendMarkdown(`## 🎯 \`${valuePath}\`\n\n`);
                
                // Show the original expression in a subtle way
                content.appendMarkdown(`📝 *${helmExpression.fullMatch}*\n\n`);
                
                // Show values from each file
                if (valuesFound.size === 1) {
                    // Single file - cleaner display
                    const firstEntry = valuesFound.entries().next().value;
                    if (firstEntry) {
                        const fileName = firstEntry[0];
                        const value = firstEntry[1];
                        
                        if (showFileNames) {
                            content.appendMarkdown(`📄 **${fileName}**\n\n`);
                        }
                        
                        const displayValue = formatValueForDisplay(value);
                        const language = getValueLanguage(value);
                        content.appendCodeblock(displayValue, language);
                    }
                } else {
                    // Multiple files - organized display
                    content.appendMarkdown(`### Values across ${valuesFound.size} files:\n\n`);
                    
                    for (const [fileName, value] of valuesFound.entries()) {
                        if (showFileNames) {
                            content.appendMarkdown(`#### 📄 ${fileName}\n`);
                        }
                        
                        const displayValue = formatValueForDisplay(value);
                        const language = getValueLanguage(value);
                        content.appendCodeblock(displayValue, language);
                        content.appendMarkdown('\n');
                    }
                }
                
                // Create hover range that covers the entire Helm expression
                const hoverRange = new vscode.Range(
                    position.line,
                    helmExpression.startIndex,
                    position.line,
                    helmExpression.endIndex
                );
                
                return new vscode.Hover(content, hoverRange);
            }

            // Create a helpful message when no value is found
            const notFoundContent = new vscode.MarkdownString();
            notFoundContent.appendMarkdown(`## ❌ Value Not Found\n\n`);
            notFoundContent.appendMarkdown(`**Path:** \`${valuePath}\`\n\n`);
            notFoundContent.appendMarkdown(`**Expression:** \`${helmExpression.fullMatch}\`\n\n`);
            notFoundContent.appendMarkdown(`💡 *This value path was not found in any of the available values files.*\n\n`);
            
            if (valuesMap.size > 0) {
                notFoundContent.appendMarkdown(`**Searched in:** ${Array.from(valuesMap.keys()).join(', ')}`);
            } else {
                notFoundContent.appendMarkdown(`**Note:** No values files were found in the current directory or parent directories.`);
            }
            
            return new vscode.Hover(notFoundContent);
        }
    });

    // Register enhanced definition provider for yaml files
    const definitionProvider = vscode.languages.registerDefinitionProvider('yaml', {
        provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Definition | undefined {
            const line = document.lineAt(position.line).text;
            const cursorPosition = position.character;
            
            // Check if cursor is within a Helm expression
            const helmExpression = isPositionInHelmExpression(line, cursorPosition);
            if (!helmExpression) {
                return undefined;
            }

            const targetValuePath = helmExpression.valuePath;
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

    // Register completion provider for .Values autocomplete
    const completionProvider = vscode.languages.registerCompletionItemProvider('yaml', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
            const line = document.lineAt(position.line).text;
            const textBeforeCursor = line.substring(0, position.character);
            
            // Check if we're in a Helm template context and typing .Values
            const helmContextRegex = /\{\{\s*-?\s*\.Values\.([a-zA-Z0-9_.]*)$/;
            const match = textBeforeCursor.match(helmContextRegex);
            
            if (!match) {
                return [];
            }
            
            const partialPath = match[1];
            console.log('Autocomplete for partial path:', partialPath);
            
            const valuesMap = findAndParseValuesFiles(document);
            const completionItems: vscode.CompletionItem[] = [];
            const addedPaths = new Set<string>();
            
            // Collect all possible completions from all values files
            for (const [fileName, fileValues] of valuesMap.entries()) {
                for (const [valuePath] of fileValues.entries()) {
                    // Check if this path starts with our partial path
                    if (valuePath.startsWith(partialPath)) {
                        // Get the next segment after the partial path
                        const remainingPath = valuePath.substring(partialPath.length);
                        const nextSegment = remainingPath.split('.')[0];
                        
                        if (nextSegment && !addedPaths.has(nextSegment)) {
                            const fullSuggestion = partialPath + nextSegment;
                            addedPaths.add(nextSegment);
                            
                            const item = new vscode.CompletionItem(nextSegment, vscode.CompletionItemKind.Property);
                            item.insertText = nextSegment;
                            item.detail = `Helm Value from ${fileName}`;
                            
                            // Add documentation showing the value
                            const valueInfo = fileValues.get(fullSuggestion);
                            if (valueInfo) {
                                item.documentation = new vscode.MarkdownString(
                                    `**${fullSuggestion}**: \`${valueInfo.value}\`\n\nFrom: ${valueInfo.source}`
                                );
                            }
                            
                            completionItems.push(item);
                        }
                    }
                }
            }
            
            return completionItems;
        }
    }, '.'); // Trigger completion on dot

    // Clean up file watchers on deactivation
    const disposable = vscode.Disposable.from(
        hoverProvider,
        definitionProvider,
        completionProvider,
        {
            dispose() {
                for (const watcher of fileWatchers.values()) {
                    watcher.dispose();
                }
                fileWatchers.clear();
            }
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}
