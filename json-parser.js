/**
 * JSON Parser and Path Tracker
 * Optimized for performance with large JSON structures
 */

class JSONParser {
    constructor() {
        this.pathCache = new Map(); // Cache for performance
        this.maxDepth = 100; // Prevent infinite recursion
    }

    /**
     * Parse and validate JSON string
     * @param {string} jsonString - Raw JSON input
     * @returns {Object} - { success: boolean, data: any, error: string }
     */
    parse(jsonString) {
        try {
            if (!jsonString || typeof jsonString !== 'string') {
                return { success: false, error: 'Invalid input: expected a string' };
            }

            const trimmed = jsonString.trim();
            if (trimmed.length === 0) {
                return { success: false, error: 'Empty JSON string' };
            }

            const data = JSON.parse(trimmed);
            return { success: true, data, error: null };
        } catch (error) {
            return { 
                success: false, 
                error: `Parse error: ${error.message}`,
                line: this.getErrorLine(error, jsonString)
            };
        }
    }

    /**
     * Extract line number from parse error
     */
    getErrorLine(error, jsonString) {
        const match = error.message.match(/position (\d+)/);
        if (match) {
            const position = parseInt(match[1]);
            const lines = jsonString.substring(0, position).split('\n');
            return lines.length;
        }
        return null;
    }

    /**
     * Get type of value
     */
    getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    /**
     * Generate path string for accessing a value
     * @param {Array} pathArray - Array of keys/indices
     * @returns {Object} - Multiple notation formats
     */
    generateAccessPath(pathArray) {
        if (!pathArray || pathArray.length === 0) {
            return {
                dot: 'data',
                bracket: 'data',
                optional: 'data',
                description: 'Root object'
            };
        }

        let dotNotation = 'data';
        let bracketNotation = 'data';
        let optionalChaining = 'data';

        pathArray.forEach(key => {
            if (typeof key === 'number') {
                // Array index
                dotNotation += `[${key}]`;
                bracketNotation += `[${key}]`;
                optionalChaining += `?.[${key}]`;
            } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
                // Valid identifier - can use dot notation
                dotNotation += `.${key}`;
                bracketNotation += `['${key}']`;
                optionalChaining += `?.${key}`;
            } else {
                // Invalid identifier - must use bracket notation
                dotNotation += `['${key}']`;
                bracketNotation += `['${key}']`;
                optionalChaining += `?.['${key}']`;
            }
        });

        return {
            dot: dotNotation,
            bracket: bracketNotation,
            optional: optionalChaining,
            description: this.generateDescription(pathArray)
        };
    }

    /**
     * Generate human-readable description of path
     */
    generateDescription(pathArray) {
        if (pathArray.length === 0) return 'Root object';
        
        const parts = [];
        pathArray.forEach((key, index) => {
            if (typeof key === 'number') {
                parts.push(`element at index ${key}`);
            } else {
                parts.push(`property "${key}"`);
            }
        });
        
        return parts.join(' → ');
    }

    /**
     * Count total nodes in JSON structure (for performance estimation)
     */
    countNodes(obj, depth = 0) {
        if (depth > this.maxDepth) return 1;
        
        if (obj === null || typeof obj !== 'object') {
            return 1;
        }

        let count = 1;
        const keys = Object.keys(obj);
        
        for (const key of keys) {
            count += this.countNodes(obj[key], depth + 1);
        }
        
        return count;
    }

    /**
     * Get statistics about JSON structure
     */
    getStatistics(data) {
        const stats = {
            totalNodes: 0,
            maxDepth: 0,
            arrays: 0,
            objects: 0,
            primitives: 0,
            nulls: 0
        };

        const traverse = (obj, depth = 0) => {
            if (depth > this.maxDepth) return;
            
            stats.totalNodes++;
            stats.maxDepth = Math.max(stats.maxDepth, depth);

            if (obj === null) {
                stats.nulls++;
            } else if (Array.isArray(obj)) {
                stats.arrays++;
                obj.forEach(item => traverse(item, depth + 1));
            } else if (typeof obj === 'object') {
                stats.objects++;
                Object.values(obj).forEach(value => traverse(value, depth + 1));
            } else {
                stats.primitives++;
            }
        };

        traverse(data);
        return stats;
    }

    /**
     * Format JSON with syntax highlighting
     * Optimized for large structures
     */
    formatWithHighlight(data, indent = 2) {
        const json = JSON.stringify(data, null, indent);
        
        // Use efficient regex-based highlighting
        return json
            .replace(/(".*?"):/g, '<span class="json-key">$1</span>:')
            .replace(/: (".*?")/g, ': <span class="json-string">$1</span>')
            .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
            .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/: (null)/g, ': <span class="json-null">$1</span>');
    }

    /**
     * Search JSON for a key or value
     * Returns array of paths where found
     */
    search(data, searchTerm, caseSensitive = false) {
        const results = [];
        const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

        const traverse = (obj, path = []) => {
            if (obj === null || typeof obj !== 'object') {
                const valueStr = String(obj);
                const compareValue = caseSensitive ? valueStr : valueStr.toLowerCase();
                if (compareValue.includes(term)) {
                    results.push({ path: [...path], value: obj, type: 'value' });
                }
                return;
            }

            const entries = Array.isArray(obj) 
                ? obj.map((v, i) => [i, v])
                : Object.entries(obj);

            for (const [key, value] of entries) {
                const keyStr = String(key);
                const compareKey = caseSensitive ? keyStr : keyStr.toLowerCase();
                
                if (compareKey.includes(term)) {
                    results.push({ path: [...path, key], value, type: 'key' });
                }
                
                traverse(value, [...path, key]);
            }
        };

        traverse(data);
        return results;
    }

    /**
     * Flatten JSON to key-value pairs with paths
     * Useful for table view
     */
    flatten(data, maxDepth = 10) {
        const flattened = [];

        const traverse = (obj, path = [], depth = 0) => {
            if (depth > maxDepth) return;

            if (obj === null || typeof obj !== 'object') {
                flattened.push({
                    path: this.generateAccessPath(path),
                    value: obj,
                    type: this.getType(obj)
                });
                return;
            }

            const entries = Array.isArray(obj)
                ? obj.map((v, i) => [i, v])
                : Object.entries(obj);

            for (const [key, value] of entries) {
                traverse(value, [...path, key], depth + 1);
            }
        };

        traverse(data);
        return flattened;
    }

    /**
     * Validate JSON schema (basic validation)
     */
    validateStructure(data, expectedKeys = []) {
        if (!expectedKeys.length) return { valid: true };

        const missingKeys = [];
        const extraKeys = [];
        const actualKeys = Object.keys(data);

        expectedKeys.forEach(key => {
            if (!actualKeys.includes(key)) {
                missingKeys.push(key);
            }
        });

        actualKeys.forEach(key => {
            if (!expectedKeys.includes(key)) {
                extraKeys.push(key);
            }
        });

        return {
            valid: missingKeys.length === 0,
            missingKeys,
            extraKeys
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSONParser;
}
