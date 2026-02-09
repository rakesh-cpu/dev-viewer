/**
 * Code Helper - Generate access code snippets
 * Shows developers how to access nested JSON data
 */

class CodeHelper {
    constructor() {
        this.parser = new JSONParser();
        this.currentPath = [];
        this.currentValue = null;
        this.currentKey = null;
        this.jsonData = null;
    }

    /**
     * Update code helper with new selection
     */
    update(path, value, key, jsonData = null) {
        this.currentPath = path;
        this.currentValue = value;
        this.currentKey = key;
        if (jsonData !== null) {
            this.jsonData = jsonData;
        }
    }

    /**
     * Detect if current path is inside an array and get array context
     * Returns: { isInArray, arrayPath, propertyPath, arrayData } or null
     */
    detectArrayContext(jsonData) {
        if (!this.currentPath || this.currentPath.length === 0) {
            return null;
        }

        // Traverse the path to find if we're inside an array
        let current = jsonData;
        let arrayPath = [];
        let arrayData = null;
        let foundArray = false;
        let propertyPathAfterArray = [];

        for (let i = 0; i < this.currentPath.length; i++) {
            const segment = this.currentPath[i];
            
            if (current === undefined || current === null) break;

            // Check if current is an array
            if (Array.isArray(current)) {
                // We found an array - this is our context
                arrayPath = this.currentPath.slice(0, i);
                arrayData = current;
                foundArray = true;
                propertyPathAfterArray = this.currentPath.slice(i + 1); // Skip the index
                break;
            }

            current = current[segment];
        }

        if (!foundArray) {
            return null;
        }

        return {
            isInArray: true,
            arrayPath,
            propertyPath: propertyPathAfterArray,
            arrayData,
            itemExample: arrayData && arrayData.length > 0 ? arrayData[0] : null
        };
    }

    /**
     * Generate all access code examples
     */
    generateCode(jsonData = null) {
        if (!this.currentPath || this.currentPath.length === 0) {
            return this.generateRootCode();
        }

        // Check if we're accessing a property inside an array
        const arrayContext = jsonData ? this.detectArrayContext(jsonData) : null;
        
        // If we're inside an array, show property-specific array operations
        if (arrayContext && arrayContext.propertyPath.length > 0) {
            return this.generatePropertyInArrayExamples(arrayContext, jsonData);
        }

        // Otherwise, show standard access examples
        const pathInfo = this.parser.generateAccessPath(this.currentPath);
        const valueType = this.parser.getType(this.currentValue);
        
        const examples = [];

        // Basic access methods
        examples.push({
            title: '🎯 Dot Notation',
            code: `const value = ${pathInfo.dot};`,
            description: 'Standard JavaScript property access'
        });

        examples.push({
            title: '📦 Bracket Notation',
            code: `const value = ${pathInfo.bracket};`,
            description: 'Safe for keys with special characters'
        });

        examples.push({
            title: '✅ Optional Chaining (ES2020)',
            code: `const value = ${pathInfo.optional};`,
            description: 'Prevents errors if path doesn\'t exist'
        });

        // Type-specific examples
        if (valueType === 'array') {
            examples.push(...this.generateArrayExamples(pathInfo));
        } else if (valueType === 'object') {
            examples.push(...this.generateObjectExamples(pathInfo));
        }

        // Destructuring examples
        if (this.currentPath.length > 1) {
            examples.push(this.generateDestructuringExample(pathInfo));
        }

        // Default value example
        examples.push({
            title: '🛡️ With Default Value',
            code: `const value = ${pathInfo.optional} ?? 'default';`,
            description: 'Provide fallback if undefined/null'
        });

        return examples;
    }

    /**
     * Generate array-specific examples
     */
    generateArrayExamples(pathInfo) {
        const examples = [];
        const arrayLength = Array.isArray(this.currentValue) ? this.currentValue.length : 0;

        examples.push({
            title: '🔄 Map Over Array',
            code: `const mapped = ${pathInfo.dot}.map(item => {\n  // Process each item\n  return item;\n});`,
            description: `Transform all ${arrayLength} items`
        });

        examples.push({
            title: '🔍 Filter Array',
            code: `const filtered = ${pathInfo.dot}.filter(item => {\n  // Return true to keep item\n  return condition;\n});`,
            description: 'Filter items based on condition'
        });

        examples.push({
            title: '📊 Reduce Array',
            code: `const result = ${pathInfo.dot}.reduce((acc, item) => {\n  // Accumulate values\n  return acc + item;\n}, 0);`,
            description: 'Aggregate array values'
        });

        examples.push({
            title: '🎲 Access First/Last',
            code: `const first = ${pathInfo.dot}[0];\nconst last = ${pathInfo.dot}[${arrayLength - 1}];`,
            description: 'Get first or last element'
        });

        return examples;
    }

    /**
     * Generate property-specific array operation examples
     * When a property inside an array item is clicked
     */
    generatePropertyInArrayExamples(arrayContext, jsonData) {
        const examples = [];
        
        // Build the array access path
        const arrayPathInfo = this.parser.generateAccessPath(arrayContext.arrayPath);
        const arrayAccessPath = arrayPathInfo.dot || 'data';
        
        // Build the property access path within each item
        let propertyAccessPath = '';
        if (arrayContext.propertyPath.length > 0) {
            propertyAccessPath = arrayContext.propertyPath.map(p => {
                return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p) ? `.${p}` : `["${p}"]`;
            }).join('');
        }
        
        const propertyName = this.currentKey || arrayContext.propertyPath[arrayContext.propertyPath.length - 1];
        const itemVar = 'item';
        const fullPropertyAccess = `${itemVar}${propertyAccessPath}`;
        
        // Determine the type of the property for smart examples
        const propertyType = typeof this.currentValue;
        const isNumeric = propertyType === 'number';
        const isString = propertyType === 'string';
        const isBoolean = propertyType === 'boolean';

        // 1. Direct Access to specific item
        const indexExample = arrayContext.arrayData && arrayContext.arrayData.length > 0 ? 0 : 0;
        examples.push({
            title: '🎯 Direct Access',
            code: `const value = ${arrayAccessPath}[${indexExample}]${propertyAccessPath};`,
            description: `Access ${propertyName} from specific item`
        });

        // 2. Map - Get all values of this property
        examples.push({
            title: '🗺️ Map All Values',
            code: `const allValues = ${arrayAccessPath}.map(${itemVar} => ${fullPropertyAccess});`,
            description: `Get array of all ${propertyName} values`
        });

        // 3. Filter - Type-specific filtering
        let filterExample = '';
        let filterDesc = '';
        if (isNumeric) {
            const exampleValue = this.currentValue || 10;
            filterExample = `const filtered = ${arrayAccessPath}.filter(${itemVar} => ${fullPropertyAccess} > ${exampleValue});`;
            filterDesc = `Filter items where ${propertyName} > ${exampleValue}`;
        } else if (isString) {
            const exampleValue = this.currentValue ? `"${this.currentValue}"` : '"example"';
            filterExample = `const filtered = ${arrayAccessPath}.filter(${itemVar} => ${fullPropertyAccess} === ${exampleValue});`;
            filterDesc = `Filter items where ${propertyName} matches`;
        } else if (isBoolean) {
            filterExample = `const filtered = ${arrayAccessPath}.filter(${itemVar} => ${fullPropertyAccess});`;
            filterDesc = `Filter items where ${propertyName} is true`;
        } else {
            filterExample = `const filtered = ${arrayAccessPath}.filter(${itemVar} => ${fullPropertyAccess} !== null);`;
            filterDesc = `Filter items where ${propertyName} exists`;
        }
        
        examples.push({
            title: '🔍 Filter by Property',
            code: filterExample,
            description: filterDesc
        });

        // 4. forEach - Iterate and log
        examples.push({
            title: '🔄 forEach Iteration',
            code: `${arrayAccessPath}.forEach(${itemVar} => {\n  console.log(${fullPropertyAccess});\n});`,
            description: `Loop through and access ${propertyName}`
        });

        // 5. Find - Find first matching item
        if (isNumeric) {
            const exampleValue = this.currentValue || 10;
            examples.push({
                title: '🎲 Find First Match',
                code: `const found = ${arrayAccessPath}.find(${itemVar} => ${fullPropertyAccess} === ${exampleValue});`,
                description: `Find first item where ${propertyName} equals ${exampleValue}`
            });
        } else if (isString) {
            examples.push({
                title: '🎲 Find First Match',
                code: `const found = ${arrayAccessPath}.find(${itemVar} => ${fullPropertyAccess}.includes("search"));`,
                description: `Find first item where ${propertyName} contains text`
            });
        } else {
            examples.push({
                title: '🎲 Find First Match',
                code: `const found = ${arrayAccessPath}.find(${itemVar} => ${fullPropertyAccess});`,
                description: `Find first item where ${propertyName} is truthy`
            });
        }

        // 6. Reduce - Aggregate (for numeric values)
        if (isNumeric) {
            examples.push({
                title: '📊 Sum/Aggregate',
                code: `const total = ${arrayAccessPath}.reduce((sum, ${itemVar}) => sum + ${fullPropertyAccess}, 0);`,
                description: `Calculate total of all ${propertyName} values`
            });
            
            examples.push({
                title: '📈 Min/Max Values',
                code: `const values = ${arrayAccessPath}.map(${itemVar} => ${fullPropertyAccess});\nconst min = Math.min(...values);\nconst max = Math.max(...values);`,
                description: `Find minimum and maximum ${propertyName}`
            });
        }

        // 7. Some/Every - Check conditions
        if (isNumeric) {
            const exampleValue = this.currentValue || 10;
            examples.push({
                title: '✅ Check Conditions',
                code: `const hasAny = ${arrayAccessPath}.some(${itemVar} => ${fullPropertyAccess} > ${exampleValue});\nconst hasAll = ${arrayAccessPath}.every(${itemVar} => ${fullPropertyAccess} > 0);`,
                description: `Check if some/all items meet condition`
            });
        } else if (isBoolean) {
            examples.push({
                title: '✅ Check Conditions',
                code: `const hasAny = ${arrayAccessPath}.some(${itemVar} => ${fullPropertyAccess});\nconst hasAll = ${arrayAccessPath}.every(${itemVar} => ${fullPropertyAccess});`,
                description: `Check if some/all ${propertyName} are true`
            });
        }

        // 8. Sort by property
        if (isNumeric) {
            examples.push({
                title: '🔀 Sort by Property',
                code: `const sorted = [...${arrayAccessPath}].sort((a, b) => a${propertyAccessPath} - b${propertyAccessPath});`,
                description: `Sort items by ${propertyName} (ascending)`
            });
        } else if (isString) {
            examples.push({
                title: '🔀 Sort by Property',
                code: `const sorted = [...${arrayAccessPath}].sort((a, b) => \n  a${propertyAccessPath}.localeCompare(b${propertyAccessPath})\n);`,
                description: `Sort items by ${propertyName} alphabetically`
            });
        }

        return examples;
    }

    /**
     * Generate object-specific examples
     */
    generateObjectExamples(pathInfo) {
        const examples = [];
        const keys = Object.keys(this.currentValue || {});

        if (keys.length > 0) {
            examples.push({
                title: '🔑 Get All Keys',
                code: `const keys = Object.keys(${pathInfo.dot});\n// [${keys.slice(0, 3).map(k => `"${k}"`).join(', ')}${keys.length > 3 ? ', ...' : ''}]`,
                description: `Extract all ${keys.length} property names`
            });

            examples.push({
                title: '📋 Get All Values',
                code: `const values = Object.values(${pathInfo.dot});`,
                description: 'Extract all property values'
            });

            examples.push({
                title: '🔄 Iterate Entries',
                code: `Object.entries(${pathInfo.dot}).forEach(([key, value]) => {\n  console.log(key, value);\n});`,
                description: 'Loop through key-value pairs'
            });
        }

        return examples;
    }

    /**
     * Generate destructuring example
     */
    generateDestructuringExample(pathInfo) {
        const parentPath = this.currentPath.slice(0, -1);
        const parentPathInfo = this.parser.generateAccessPath(parentPath);
        const key = this.currentPath[this.currentPath.length - 1];

        return {
            title: '📦 Destructuring',
            code: `const { ${key} } = ${parentPathInfo.dot};`,
            description: 'Extract property directly'
        };
    }

    /**
     * Generate code for root object
     */
    generateRootCode() {
        return [{
            title: '📄 Root Object',
            code: 'const data = /* your JSON data */;',
            description: 'Click on any key to see access examples'
        }];
    }

    /**
     * Render code examples to HTML
     */
    renderToHTML() {
        const examples = this.generateCode(this.jsonData);
        
        let html = '<div class="code-examples">';
        
        // Path description
        if (this.currentPath && this.currentPath.length > 0) {
            const pathInfo = this.parser.generateAccessPath(this.currentPath);
            html += `
                <div class="code-path-info">
                    <div class="code-path-label">Selected Path:</div>
                    <div class="code-path-value">${pathInfo.description}</div>
                </div>
            `;
        }

        // Examples
        examples.forEach((example, index) => {
            const escapedCode = this.escapeHtml(example.code);
            html += `
                <div class="code-example" data-index="${index}">
                    <div class="code-example-header">
                        <span class="code-example-title">${example.title}</span>
                        <button class="code-copy-btn" data-code="${escapedCode}" title="Copy to clipboard">
                            📋
                        </button>
                    </div>
                    <pre class="code-example-code"><code>${example.code}</code></pre>
                    <div class="code-example-desc">${example.description}</div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Syntax highlighting for code
     */
    highlightCode(code) {
        return code
            .replace(/\b(const|let|var|return|if|else|for|while|function|class|import|export|async|await|new|typeof|instanceof)\b/g, '<span class="code-keyword">$1</span>')
            .replace(/\b(true|false|null|undefined)\b/g, '<span class="code-boolean">$1</span>')
            .replace(/\b(\d+)\b/g, '<span class="code-number">$1</span>')
            .replace(/(\/\/.*$)/gm, '<span class="code-comment">$1</span>')
            .replace(/('.*?'|".*?")/g, '<span class="code-string">$1</span>');
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Copy code to clipboard
     */
    async copyToClipboard(code) {
        try {
            await navigator.clipboard.writeText(code);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = code;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    }

    /**
     * Show copy success feedback
     */
    showCopyFeedback(button) {
        const originalText = button.textContent;
        button.textContent = '✅';
        button.style.background = 'var(--accent-primary)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 1500);
    }

    /**
     * Generate TypeScript interface from JSON
     */
    generateTypeScriptInterface(data, interfaceName = 'DataType') {
        const generateType = (value, depth = 0) => {
            const indent = '  '.repeat(depth);
            
            if (value === null) return 'null';
            if (Array.isArray(value)) {
                if (value.length === 0) return 'any[]';
                return `${generateType(value[0], depth)}[]`;
            }
            if (typeof value === 'object') {
                const keys = Object.keys(value);
                if (keys.length === 0) return '{}';
                
                let typeStr = '{\n';
                keys.forEach(key => {
                    typeStr += `${indent}  ${key}: ${generateType(value[key], depth + 1)};\n`;
                });
                typeStr += `${indent}}`;
                return typeStr;
            }
            return typeof value;
        };

        return `interface ${interfaceName} ${generateType(data)}`;
    }

    /**
     * Generate JSON Schema
     */
    generateJSONSchema(data) {
        const generateSchema = (value) => {
            if (value === null) {
                return { type: 'null' };
            }
            if (Array.isArray(value)) {
                return {
                    type: 'array',
                    items: value.length > 0 ? generateSchema(value[0]) : {}
                };
            }
            if (typeof value === 'object') {
                const properties = {};
                Object.keys(value).forEach(key => {
                    properties[key] = generateSchema(value[key]);
                });
                return {
                    type: 'object',
                    properties,
                    required: Object.keys(value)
                };
            }
            return { type: typeof value };
        };

        return {
            $schema: 'http://json-schema.org/draft-07/schema#',
            ...generateSchema(data)
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeHelper;
}
