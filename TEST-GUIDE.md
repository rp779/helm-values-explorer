# Helm Values Explorer - Testing Guide

## Installation Steps

1. **Install the Extension**:
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Extensions: Install from VSIX..."
   - Select the file: `helm-values-explorer-0.0.7.vsix`
   - Restart VS Code if prompted

2. **Open Test Project**:
   - Open this folder (`helm-values-explorer`) in VS Code
   - Navigate to the `examples/` directory

## Test Cases

### Test 1: Basic Hover Functionality
**File**: `examples/templates/deployment.yaml`

1. Hover over these expressions and verify you see values:
   - `{{ .Values.image.repository }}` → should show "nginx"
   - `{{ .Values.image.tag }}` → should show "latest"
   - `{{ .Values.port }}` → should show "8080"
   - `{{ .Values.resources.limits.cpu }}` → should show "100m"

**Expected**: Hover should work anywhere within the `{{ }}` brackets, not just on the word.

### Test 2: Complex Expression Support
**File**: `examples/templates/test-complex.yaml` (already created)

1. Hover over each expression and verify:
   - Shows the correct value from values files
   - Displays the full expression in the hover tooltip
   - Works with pipes, functions, and whitespace variations

### Test 3: Multi-File Values Support
**Files**: All three values files (`values.yaml`, `dev-values.yaml`, `prod-values.yaml`)

1. Hover over `{{ .Values.image.repository }}` in the deployment template
2. **Expected**: Should show values from all three files:
   - `values.yaml`: "nginx"
   - `dev-values.yaml`: "gunicorn" 
   - `prod-values.yaml`: "nginx"

### Test 4: Autocomplete Functionality
**File**: `examples/templates/deployment.yaml`

1. **Test basic autocomplete**:
   - Type `{{ .Values.` and press `Ctrl+Space`
   - Should see suggestions: `image`, `port`, `service`, `resources`

2. **Test nested autocomplete**:
   - Type `{{ .Values.image.` and press `Ctrl+Space`
   - Should see: `repository`, `tag`, `pullPolicy`

3. **Test deep nesting**:
   - Type `{{ .Values.resources.limits.` and press `Ctrl+Space`
   - Should see: `cpu`, `memory`

### Test 5: Go-to-Definition
**File**: `examples/templates/deployment.yaml`

1. Right-click on `{{ .Values.image.repository }}`
2. Select "Go to Definition" (or press F12)
3. **Expected**: Should show all locations where `image.repository` is defined across all values files

### Test 6: Performance & Caching
**Test file watching and caching**:

1. Open `examples/values.yaml`
2. Hover over a `.Values` expression in the template (to load cache)
3. Modify a value in `values.yaml` (e.g., change port from 8080 to 9090)
4. Save the file
5. Hover over `{{ .Values.port }}` again
6. **Expected**: Should immediately show the new value (9090)

### Test 7: Error Handling
**Test edge cases**:

1. **Invalid expressions**: Try hovering over `{{ .Values.nonexistent.path }}`
   - Should show "No value found for nonexistent.path"

2. **Malformed YAML**: Temporarily break the syntax in a values file
   - Extension should handle gracefully without crashing

## What to Look For

### Expected Behaviors:
- Hover works anywhere within `{{ }}` expressions
- Complex expressions with pipes and functions are recognized
- Autocomplete suggestions appear when typing `.Values.`
- Values from multiple files are shown
- File changes are reflected immediately
- Go-to-definition works across all values files

### Potential Issues:
- Hover only works on exact words (old behavior)
- Complex expressions not recognized
- Autocomplete doesn't trigger or shows wrong suggestions
- Performance issues with large values files
- Cache not updating when files change
- Extension crashes or shows errors in console

## Debugging

If you encounter issues:

1. **Check Developer Console**:
   - Press `Ctrl+Shift+I` (or `Cmd+Opt+I` on Mac)
   - Look for console logs starting with "Helm Values Explorer"

2. **Check Extension Output**:
   - View → Output → Select "Helm Values Explorer" from dropdown

3. **Reload Extension**:
   - Press `Ctrl+Shift+P` → "Developer: Reload Window"

## Test Results

After testing, please note:
- Which features work as expected
- Any issues or unexpected behavior
- Performance observations
- Suggestions for improvements

---

Install the extension and work through these test cases to verify all improvements are working correctly.
