/**
 * Main Application Logic
 * Handles both Markdown and JSON file viewing with multiple visualization modes
 */

class ViewerApp {
    constructor() {
        // Initialize parsers
        this.markdownParser = new MarkdownParser();
        this.jsonParser = new JSONParser();
        this.codeHelper = new CodeHelper();
        
        // Initialize visualizers
        this.treeVisualizer = new TreeVisualizer();
        this.prettierVisualizer = new PrettierVisualizer();
        this.graphVisualizer = new GraphVisualizer();
        this.tableVisualizer = new TableVisualizer();
        
        // State
        this.currentFile = null;
        this.currentFileType = null; // 'markdown' or 'json'
        this.currentTheme = 'light';
        this.currentFontSize = 'normal';
        this.currentViewMode = 'tree';
        this.currentJsonData = null;
        this.codePanelCollapsed = true; // Start collapsed by default
        
        // DOM elements
        this.elements = {
            // Common
            landingPage: document.getElementById('landingPage'),
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            browseBtn: document.getElementById('browseBtn'),
            pasteJsonBtn: document.getElementById('pasteJsonBtn'),
            pasteJsonBtn2: document.getElementById('pasteJsonBtn2'),
            themeToggle: document.getElementById('themeToggle'),
            fontSizeIncrease: document.getElementById('fontSizeIncrease'),
            fontSizeDecrease: document.getElementById('fontSizeDecrease'),
            downloadBtn: document.getElementById('downloadBtn'),
            clearBtn: document.getElementById('clearBtn'),
            faqToggle: document.getElementById('faqToggleBtn'),
            
            // Markdown
            previewContainer: document.getElementById('previewContainer'),
            markdownContent: document.getElementById('markdownContent'),
            fileName: document.getElementById('fileName'),
            fileSize: document.getElementById('fileSize'),
            readingTimeText: document.getElementById('readingTimeText'),
            
            // JSON
            jsonViewerContainer: document.getElementById('jsonViewerContainer'),
            jsonInput: document.getElementById('jsonInput'),
            jsonVisualization: document.getElementById('jsonVisualization'),
            codeHelper: document.getElementById('codeHelper'),
            codeHelperPanel: document.getElementById('codeHelperPanel'),
            jsonStats: document.getElementById('jsonStats'),
            formatJsonBtn: document.getElementById('formatJsonBtn'),
            validateJsonBtn: document.getElementById('validateJsonBtn'),
            autoRepairBtn: document.getElementById('autoRepairBtn'),
            toggleCodePanel: document.getElementById('toggleCodePanel'),
            
            // Modal
            jsonPasteModal: document.getElementById('jsonPasteModal'),
            modalJsonInput: document.getElementById('modalJsonInput'),
            closeModal: document.getElementById('closeModal'),
            cancelPaste: document.getElementById('cancelPaste'),
            confirmPaste: document.getElementById('confirmPaste'),
            lineNumbers: document.getElementById('lineNumbers'),
        };
        
        // Initialize
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadThemePreference();
        this.loadFontSizePreference();
        this.setupVisualizerCallbacks();
        this.initLineNumbers();
        
        // Initialize JSON repair
        this.jsonRepair = new JSONRepair();
    }

    /**
     * Setup visualizer click callbacks
     */
    setupVisualizerCallbacks() {
        const callback = (path, value, key) => {
            this.handleNodeClick(path, value, key);
        };
        
        this.treeVisualizer.setClickCallback(callback);
        this.prettierVisualizer.setClickCallback(callback);
        this.graphVisualizer.setClickCallback(callback);
        this.tableVisualizer.setClickCallback(callback);
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // File upload events
        this.elements.browseBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Paste JSON button
        this.elements.pasteJsonBtn.addEventListener('click', () => {
            this.showPasteModal();
        });
        this.elements.pasteJsonBtn2.addEventListener('click', () => {
            this.showPasteModal();
        });

        // Drag and drop events
        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.add('dragover');
        });

        this.elements.uploadArea.addEventListener('dragleave', () => {
            this.elements.uploadArea.classList.remove('dragover');
        });

        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            this.handleFileSelect(file);
        });

        // Control buttons
        this.elements.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        if (this.elements.faqToggle) {
            this.elements.faqToggle.addEventListener('click', () => {
                this.toggleFaq();
            });
        }

        this.elements.fontSizeIncrease.addEventListener('click', () => {
            this.increaseFontSize();
        });

        this.elements.fontSizeDecrease.addEventListener('click', () => {
            this.decreaseFontSize();
        });

        this.elements.downloadBtn.addEventListener('click', () => {
            this.downloadContent();
        });

        this.elements.clearBtn.addEventListener('click', () => {
            this.clearDocument();
        });

        // JSON specific controls
        if (this.elements.formatJsonBtn) {
            this.elements.formatJsonBtn.addEventListener('click', () => {
                this.formatJsonInput();
            });
        }

        if (this.elements.validateJsonBtn) {
            this.elements.validateJsonBtn.addEventListener('click', () => {
                this.validateJsonInput();
            });
        }

        if (this.elements.autoRepairBtn) {
            this.elements.autoRepairBtn.addEventListener('click', () => {
                this.autoRepairJSON();
            });
        }

        if (this.elements.toggleCodePanel) {
            this.elements.toggleCodePanel.addEventListener('click', () => {
                this.toggleCodePanel();
            });
        }


        // JSON input textarea
        if (this.elements.jsonInput) {
            this.elements.jsonInput.addEventListener('input', () => {
                this.handleJsonInputChange();
            });
            
            // Auto-format on paste
            this.elements.jsonInput.addEventListener('paste', (e) => {
                this.handlePaste(e, this.elements.jsonInput);
            });
        }

        // Modal JSON input - auto-format on paste
        if (this.elements.modalJsonInput) {
            this.elements.modalJsonInput.addEventListener('paste', (e) => {
                this.handlePaste(e, this.elements.modalJsonInput);
            });
        }


        // View mode switcher
        const viewModeButtons = document.querySelectorAll('.view-mode-btn');
        viewModeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchViewMode(mode);
            });
        });

        // Modal events
        if (this.elements.closeModal) {
            this.elements.closeModal.addEventListener('click', () => {
                this.hidePasteModal();
            });
        }

        if (this.elements.cancelPaste) {
            this.elements.cancelPaste.addEventListener('click', () => {
                this.hidePasteModal();
            });
        }

        if (this.elements.confirmPaste) {
            this.elements.confirmPaste.addEventListener('click', () => {
                this.handlePasteConfirm();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + D: Toggle dark mode
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Ctrl/Cmd + +: Increase font size
            if ((e.ctrlKey || e.metaKey) && e.key === '+') {
                e.preventDefault();
                this.increaseFontSize();
            }
            
            // Ctrl/Cmd + -: Decrease font size
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                this.decreaseFontSize();
            }

            // Escape: Close modal
            if (e.key === 'Escape' && !this.elements.jsonPasteModal.classList.contains('hidden')) {
                this.hidePasteModal();
            }
        });
    }

    /**
     * Initialize line numbers for JSON input
     */
    initLineNumbers() {
        if (!this.elements.jsonInput || !this.elements.lineNumbers) return;

        // Update line numbers on input
        this.elements.jsonInput.addEventListener('input', () => {
            this.updateLineNumbers();
        });

        // Sync scroll between textarea and line numbers
        this.elements.jsonInput.addEventListener('scroll', () => {
            this.elements.lineNumbers.scrollTop = this.elements.jsonInput.scrollTop;
        });

        // Initial update
        this.updateLineNumbers();
    }

    /**
     * Update line numbers based on textarea content
     */
    updateLineNumbers() {
        if (!this.elements.jsonInput || !this.elements.lineNumbers) return;

        const lines = this.elements.jsonInput.value.split('\n');
        const lineCount = lines.length;

        // Generate line numbers as individual divs
        let lineNumbersHTML = '';
        for (let i = 1; i <= lineCount; i++) {
            lineNumbersHTML += `<div>${i}</div>`;
        }

        this.elements.lineNumbers.innerHTML = lineNumbersHTML;
    }

    /**
     * Detect file type from extension
     */
    detectFileType(fileName) {
        const lower = fileName.toLowerCase();
        if (lower.endsWith('.json')) return 'json';
        if (lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.txt')) return 'markdown';
        return null;
    }

    /**
     * Handle file selection
     */
    handleFileSelect(file) {
        if (!file) return;

        const fileType = this.detectFileType(file.name);
        
        if (!fileType) {
            this.showError('Please select a valid file (.md, .markdown, .txt, or .json)');
            return;
        }

        // Read file
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            
            if (fileType === 'markdown') {
                this.renderMarkdown(content, file);
            } else if (fileType === 'json') {
                this.renderJSON(content, file);
            }
        };

        reader.onerror = () => {
            this.showError('Error reading file. Please try again.');
        };

        reader.readAsText(file);
    }

    /**
     * Render markdown content
     */
    renderMarkdown(markdown, file) {
        try {
            // Parse markdown to HTML
            const html = this.markdownParser.parse(markdown);
            
            // Update UI
            this.elements.markdownContent.innerHTML = html;
            this.elements.fileName.textContent = file.name;
            this.elements.fileSize.textContent = this.formatFileSize(file.size);
            
            // Calculate and display reading time
            const readingTime = this.markdownParser.calculateReadingTime(markdown);
            this.elements.readingTimeText.textContent = `${readingTime} min read`;
            
            // Show markdown preview, hide others
            this.elements.landingPage.classList.add('hidden');
            this.elements.jsonViewerContainer.classList.add('hidden');
            this.elements.previewContainer.classList.remove('hidden');
            
            // Enable control buttons
            this.elements.downloadBtn.disabled = false;
            this.elements.clearBtn.disabled = false;
            
            // Store current file info
            this.currentFile = {
                name: file.name,
                content: markdown,
                html: html,
            };
            this.currentFileType = 'markdown';
            
            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error rendering markdown:', error);
            this.showError('Error rendering markdown. Please check the file format.');
        }
    }

    /**
     * Render JSON content with validation - shows JSON even if invalid
     */
    renderJSONWithValidation(jsonString, file) {
        const result = this.jsonParser.parse(jsonString);
        
        // Always show the JSON viewer UI
        this.elements.landingPage.classList.add('hidden');
        this.elements.previewContainer.classList.add('hidden');
        this.elements.jsonViewerContainer.classList.remove('hidden');
        
        // Update JSON input textarea with the raw input
        this.elements.jsonInput.value = jsonString;
        this.updateLineNumbers();
        
        if (!result.success) {
            // Show error in stats area with line highlighting
            this.currentJsonData = null;
            this.currentFile = {
                name: file ? file.name : 'pasted-data.json',
                content: jsonString,
                data: null,
            };
            this.currentFileType = 'json';
            
            // Display error message with line number and context
            const errorLine = result.line || 'unknown';
            
            // Extract context around error (5 words before and after)
            let contextSnippet = '';
            if (result.line && result.column) {
                const lines = jsonString.split('\n');
                const errorLineText = lines[result.line - 1] || '';
                
                // Get text around the error position
                const beforeError = errorLineText.substring(0, result.column - 1);
                const afterError = errorLineText.substring(result.column - 1);
                
                // Extract words (split by spaces, quotes, brackets, etc.)
                const wordsBefore = beforeError.match(/[\w"']+/g) || [];
                const wordsAfter = afterError.match(/[\w"']+/g) || [];
                
                // Get last 5 words before and first 5 words after
                const contextBefore = wordsBefore.slice(-5).join(' ');
                const contextAfter = wordsAfter.slice(0, 5).join(' ');
                
                contextSnippet = `
                    <div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; font-family: monospace; font-size: 0.875rem;">
                        <div style="color: #64748b; font-size: 0.75rem; margin-bottom: 0.25rem;">Context around error:</div>
                        <div style="color: #1e293b;">
                            <span style="color: #64748b;">...${contextBefore}</span>
                            <span style="background: #ef4444; color: white; padding: 2px 4px; font-weight: bold;">⚠</span>
                            <span style="color: #64748b;">${contextAfter}...</span>
                        </div>
                    </div>
                `;
            }
            
            this.elements.jsonStats.innerHTML = `
                <div style="color: #ef4444; font-weight: 600;">
                    ❌ Invalid JSON: ${result.error}
                    ${result.line ? `<br>📍 Error near line ${result.line}${result.column ? `, column ${result.column}` : ''}` : ''}
                </div>
                ${contextSnippet}
            `;
            this.elements.jsonStats.classList.remove('hidden');
            
            // Show JSON with line numbers and error highlighting in visualization panel
            this.elements.jsonVisualization.innerHTML = this.renderJsonWithLineNumbers(jsonString, result.line);
            
            // Highlight error line in textarea if possible
            if (result.line) {
                this.highlightErrorLine(this.elements.jsonInput, result.line);
            }
            
            // Enable control buttons
            this.elements.downloadBtn.disabled = true;
            this.elements.clearBtn.disabled = false;
            
            return;
        }

        // Valid JSON - render normally
        try {
            // Store JSON data
            this.currentJsonData = result.data;
            this.currentFile = {
                name: file ? file.name : 'pasted-data.json',
                content: jsonString,
                data: result.data,
            };
            this.currentFileType = 'json';

            // Update JSON input textarea with formatted version
            this.elements.jsonInput.value = JSON.stringify(result.data, null, 2);
            this.updateLineNumbers();

            // Show statistics
            const stats = this.jsonParser.getStatistics(result.data);
            this.elements.jsonStats.innerHTML = `
                <div style="color: #10b981; font-weight: 600;">
                    ✅ Valid JSON
                </div>
                <div style="margin-top: 0.5rem;">
                    <strong>Stats:</strong> 
                    ${stats.totalNodes} nodes | 
                    ${stats.maxDepth} max depth | 
                    ${stats.arrays} arrays | 
                    ${stats.objects} objects
                </div>
            `;
            this.elements.jsonStats.classList.remove('hidden');

            // Render visualization
            this.renderVisualization();

            // Start with code panel collapsed
            if (!this.codePanelCollapsed) {
                this.toggleCodePanel();
            }

            // Enable control buttons
            this.elements.downloadBtn.disabled = false;
            this.elements.clearBtn.disabled = false;

            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Error rendering JSON:', error);
            this.showError('Error rendering JSON. Please check the format.');
        }
    }

    /**
     * Render JSON content (legacy method for file uploads)
     */
    renderJSON(jsonString, file) {
        const result = this.jsonParser.parse(jsonString);
        
        if (!result.success) {
            this.showError(result.error);
            return;
        }

        try {
            // Store JSON data
            this.currentJsonData = result.data;
            this.currentFile = {
                name: file ? file.name : 'pasted-data.json',
                content: jsonString,
                data: result.data,
            };
            this.currentFileType = 'json';

            // Update JSON input textarea
            this.elements.jsonInput.value = JSON.stringify(result.data, null, 2);
            this.updateLineNumbers();

            // Show statistics
            const stats = this.jsonParser.getStatistics(result.data);
            this.elements.jsonStats.innerHTML = `
                <strong>Stats:</strong> 
                ${stats.totalNodes} nodes | 
                ${stats.maxDepth} max depth | 
                ${stats.arrays} arrays | 
                ${stats.objects} objects
            `;
            this.elements.jsonStats.classList.remove('hidden');

            // Render visualization
            this.renderVisualization();

            // Show JSON viewer, hide others
            this.elements.landingPage.classList.add('hidden');
            this.elements.previewContainer.classList.add('hidden');
            this.elements.jsonViewerContainer.classList.remove('hidden');

            // Start with code panel collapsed
            if (!this.codePanelCollapsed) {
                this.toggleCodePanel();
            }

            // Enable control buttons
            this.elements.downloadBtn.disabled = false;
            this.elements.clearBtn.disabled = false;

            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Error rendering JSON:', error);
            this.showError('Error rendering JSON. Please check the format.');
        }
    }

    /**
     * Render JSON with line numbers and error highlighting
     */
    renderJsonWithLineNumbers(jsonString, errorLine) {
        const lines = jsonString.split('\n');
        const lineNumberWidth = String(lines.length).length;
        
        let html = `
            <div style="background: var(--bg-secondary); border-radius: 8px; overflow: hidden; height: 100%; display: flex; flex-direction: column;">
                <div style="padding: 1rem; background: var(--error-bg, #fee); border-bottom: 2px solid var(--error-color, #ef4444);">
                    <h3 style="margin: 0; color: var(--error-color, #ef4444); font-size: 1rem;">
                        ⚠️ JSON Preview (Invalid)
                    </h3>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">
                        Fix the errors below to see the visualization
                    </p>
                </div>
                <div style="flex: 1; overflow: auto; font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 0.875rem; line-height: 1.6;">
                    <pre style="margin: 0; padding: 1rem; background: transparent;"><code>`;
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const isErrorLine = errorLine && lineNum === errorLine;
            const lineNumStr = String(lineNum).padStart(lineNumberWidth, ' ');
            
            // Escape HTML
            const escapedLine = line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
            
            if (isErrorLine) {
                html += `<div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; margin-left: -1rem; padding-left: calc(1rem - 3px); margin-right: -1rem; padding-right: 1rem;">`;
                html += `<span style="color: #ef4444; font-weight: bold; user-select: none;">${lineNumStr} ❌ </span>`;
                html += `<span style="color: #ef4444;">${escapedLine || ' '}</span>`;
                html += `</div>`;
            } else {
                html += `<div>`;
                html += `<span style="color: var(--text-muted, #94a3b8); user-select: none;">${lineNumStr}  </span>`;
                html += `<span>${escapedLine || ' '}</span>`;
                html += `</div>`;
            }
        });
        
        html += `</code></pre>
                </div>
            </div>
        `;
        
        return html;
    }

    /**
     * Highlight error line in textarea
     */
    highlightErrorLine(textarea, lineNumber) {
        const lines = textarea.value.split('\n');
        let charCount = 0;
        
        for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
            charCount += lines[i].length + 1; // +1 for newline
        }
        
        // Select the error line
        textarea.focus();
        textarea.setSelectionRange(charCount, charCount + (lines[lineNumber - 1]?.length || 0));
        textarea.scrollTop = textarea.scrollHeight * ((lineNumber - 1) / lines.length);
        
        // Show visual error marker
        const errorMarker = document.getElementById('errorMarker');
        if (errorMarker) {
            const lineHeight = 1.6; // Match textarea line-height
            const fontSize = 14; // 0.875rem = 14px
            const padding = 16; // var(--spacing-md)
            const lineHeightPx = lineHeight * fontSize;
            
            // Calculate position
            const top = padding + (lineNumber - 1) * lineHeightPx;
            const height = lineHeightPx;
            
            // Position and show marker
            errorMarker.style.top = `${top}px`;
            errorMarker.style.height = `${height}px`;
            errorMarker.classList.remove('hidden');
            
            // Hide marker after 5 seconds
            setTimeout(() => {
                errorMarker.classList.add('hidden');
            }, 5000);
        }
    }

    /**
     * Render JSON visualization based on current mode
     */
    renderVisualization() {
        if (!this.currentJsonData) return;

        const container = this.elements.jsonVisualization;
        container.innerHTML = '';

        try {
            switch (this.currentViewMode) {
                case 'tree':
                    this.treeVisualizer.render(this.currentJsonData, container);
                    break;
                case 'prettier':
                    this.prettierVisualizer.render(this.currentJsonData, container);
                    break;
                case 'graph':
                    this.graphVisualizer.render(this.currentJsonData, container);
                    break;
                case 'table':
                    this.tableVisualizer.render(this.currentJsonData, container);
                    break;
            }
        } catch (error) {
            console.error('Error rendering visualization:', error);
            container.innerHTML = '<p style="color: red;">Error rendering visualization</p>';
        }
    }

    /**
     * Switch view mode
     */
    switchViewMode(mode) {
        this.currentViewMode = mode;

        // Update active button
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });

        // Re-render visualization
        this.renderVisualization();
    }

    /**
     * Handle node click in visualizer
     */
    handleNodeClick(path, value, key) {
        // Get the full JSON data
        const jsonString = this.elements.jsonInput.value;
        const parseResult = this.jsonParser.parse(jsonString);
        const jsonData = parseResult.success ? parseResult.data : null;
        
        // Update code helper with the path, value, key, and full JSON data
        this.codeHelper.update(path, value, key, jsonData);
        
        // Render the code examples
        const codeHTML = this.codeHelper.renderToHTML();
        this.elements.codeHelper.innerHTML = codeHTML;
        this.elements.codeHelper.classList.remove('hidden');

        // Setup copy buttons
        this.setupCopyButtons();
    }

    /**
     * Setup copy buttons for code examples
     */
    setupCopyButtons() {
        const copyButtons = this.elements.codeHelper.querySelectorAll('.code-copy-btn');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const code = btn.dataset.code;
                const success = await this.codeHelper.copyToClipboard(code);
                if (success) {
                    this.codeHelper.showCopyFeedback(btn);
                }
            });
        });
    }

    /**
     * Handle JSON input change
     */
    handleJsonInputChange() {
        // Debounce the parsing
        clearTimeout(this.jsonInputTimeout);
        this.jsonInputTimeout = setTimeout(() => {
            const jsonString = this.elements.jsonInput.value;
            if (jsonString.trim()) {
                this.renderJSONWithValidation(jsonString, null);
            }
        }, 1000);
    }

    /**
     * Format JSON input
     */
    formatJsonInput() {
        const result = this.jsonParser.parse(this.elements.jsonInput.value);
        if (result.success) {
            const formatted = JSON.stringify(result.data, null, 2);
            this.elements.jsonInput.value = formatted;
            this.updateLineNumbers();
            this.renderJSONWithValidation(formatted, null);
        } else {
            this.showError(result.error);
        }
    }

    autoRepairJSON() {
        const jsonString = this.elements.jsonInput.value.trim();
        if (!jsonString) {
            alert('Please paste some JSON first');
            return;
        }

        const result = this.jsonRepair.repair(jsonString);

        if (result.repairs.length === 0) {
            this.elements.jsonStats.innerHTML = '<div style="color: #f59e0b; font-weight: 600;">⚠️ No automatic fixes available.</div>';
            this.elements.jsonStats.classList.remove('hidden');
            return;
        }

        this.elements.jsonInput.value = result.repaired;
        this.updateLineNumbers();

        const repairList = result.repairs.map(r => `<li>${r}</li>`).join('');
        this.elements.jsonStats.innerHTML = `
            <div style="color: #10b981; font-weight: 600;">🔧 Auto-Repair Complete!</div>
            <div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; font-size: 0.875rem;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">Repairs made:</div>
                <ul style="margin: 0; padding-left: 1.5rem;">${repairList}</ul>
            </div>
        `;
        this.elements.jsonStats.classList.remove('hidden');

        // Automatically render the visualization with the repaired JSON
        setTimeout(() => {
            this.renderJSONWithValidation(result.repaired);
        }, 500);
    }

    /**
     * Validate JSON input
     */
    validateJsonInput() {
        const result = this.jsonParser.parse(this.elements.jsonInput.value);
        if (result.success) {
            alert('✅ Valid JSON!');
        } else {
            alert(`❌ Invalid JSON:\n${result.error}`);
        }
    }

    /**
     * Toggle code helper panel
     */
    toggleCodePanel() {
        this.codePanelCollapsed = !this.codePanelCollapsed;
        
        if (this.codePanelCollapsed) {
            this.elements.codeHelperPanel.classList.add('collapsed');
            this.elements.toggleCodePanel.textContent = '▶';
            document.querySelector('.json-panels').classList.add('code-panel-collapsed');
        } else {
            this.elements.codeHelperPanel.classList.remove('collapsed');
            this.elements.toggleCodePanel.textContent = '◀';
            document.querySelector('.json-panels').classList.remove('code-panel-collapsed');
        }
    }

    /**
     * Show paste JSON modal
     */
    showPasteModal() {
        this.elements.jsonPasteModal.classList.remove('hidden');
        this.elements.modalJsonInput.value = '';
        this.elements.modalJsonInput.focus();
    }

    /**
     * Hide paste JSON modal
     */
    hidePasteModal() {
        this.elements.jsonPasteModal.classList.add('hidden');
        this.elements.modalJsonInput.value = '';
    }

    /**
     * Handle paste event and auto-format JSON
     */
    handlePaste(event, targetElement) {
        // Prevent default paste
        event.preventDefault();
        
        // Get pasted text
        const pastedText = (event.clipboardData || window.clipboardData).getData('text');
        
        // Try to parse and format the JSON
        const result = this.jsonParser.parse(pastedText);
        
        if (result.success) {
            // If valid JSON, format it nicely
            const formattedJson = JSON.stringify(result.data, null, 2);
            
            // Insert formatted JSON at cursor position
            const start = targetElement.selectionStart;
            const end = targetElement.selectionEnd;
            const currentValue = targetElement.value;
            
            targetElement.value = currentValue.substring(0, start) + formattedJson + currentValue.substring(end);
            
            // Set cursor position after inserted text
            const newPosition = start + formattedJson.length;
            targetElement.setSelectionRange(newPosition, newPosition);
            
            // Trigger input event to update visualization if it's the main textarea
            if (targetElement === this.elements.jsonInput) {
                this.handleJsonInputChange();
            }
        } else {
            // If not valid JSON, paste as-is
            const start = targetElement.selectionStart;
            const end = targetElement.selectionEnd;
            const currentValue = targetElement.value;
            
            targetElement.value = currentValue.substring(0, start) + pastedText + currentValue.substring(end);
            
            const newPosition = start + pastedText.length;
            targetElement.setSelectionRange(newPosition, newPosition);
        }
    }

    /**
     * Handle paste confirm
     */
    handlePasteConfirm() {
        const jsonString = this.elements.modalJsonInput.value;
        if (jsonString.trim()) {
            this.hidePasteModal();
            this.renderJSONWithValidation(jsonString, null);
        } else {
            this.showError('Please paste some JSON data');
        }
    }


    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Toggle theme (light/dark)
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        if (this.currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Update button icon (if it exists, for backward compatibility)
        const icon = this.elements.themeToggle.querySelector('.icon');
        if (icon) {
            icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
        
        // Save preference
        localStorage.setItem('theme', this.currentTheme);

        // Re-render visualizations if JSON is active
        if (this.currentFileType === 'json' && this.currentJsonData) {
            this.renderVisualization();
        }
    }

    /**
     * Load theme preference from localStorage
     */
    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            document.documentElement.setAttribute('data-theme', this.currentTheme);
            
            if (this.currentTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            
            const icon = this.elements.themeToggle.querySelector('.icon');
            if (icon) {
                icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
            }
        }
    }

    /**
     * Increase font size
     */
    increaseFontSize() {
        const sizes = ['normal', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(this.currentFontSize);
        
        if (currentIndex < sizes.length - 1) {
            this.currentFontSize = sizes[currentIndex + 1];
            this.applyFontSize();
        }
    }

    /**
     * Decrease font size
     */
    decreaseFontSize() {
        const sizes = ['small', 'normal', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(this.currentFontSize);
        
        if (currentIndex > 0) {
            this.currentFontSize = sizes[currentIndex - 1];
            this.applyFontSize();
        }
    }

    /**
     * Apply font size to body
     */
    applyFontSize() {
        // Remove all font size classes
        document.body.classList.remove('font-small', 'font-large', 'font-xlarge');
        
        // Add current font size class
        if (this.currentFontSize !== 'normal') {
            document.body.classList.add(`font-${this.currentFontSize}`);
        }
        
        // Save preference
        localStorage.setItem('fontSize', this.currentFontSize);
    }

    /**
     * Load font size preference from localStorage
     */
    loadFontSizePreference() {
        const savedFontSize = localStorage.getItem('fontSize');
        if (savedFontSize) {
            this.currentFontSize = savedFontSize;
            this.applyFontSize();
        }
    }

    /**
     * Download content based on file type
     */
    downloadContent() {
        if (!this.currentFile) return;

        if (this.currentFileType === 'markdown') {
            this.downloadMarkdownAsHtml();
        } else if (this.currentFileType === 'json') {
            this.downloadJsonAsHtml();
        }
    }

    /**
     * Download markdown as HTML
     */
    downloadMarkdownAsHtml() {
        const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.currentFile.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.7;
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            color: #1a1a1a;
            background: #ffffff;
        }
        h1, h2, h3, h4, h5, h6 {
            font-weight: 700;
            line-height: 1.3;
            margin-top: 2em;
            margin-bottom: 0.75em;
        }
        h1 { font-size: 2.5rem; border-bottom: 3px solid #6366f1; padding-bottom: 0.5rem; }
        h2 { font-size: 2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.4rem; }
        h3 { font-size: 1.5rem; }
        code {
            background: #e9ecef;
            padding: 0.2em 0.4em;
            border-radius: 0.375rem;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9em;
        }
        pre {
            background: #e9ecef;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            border-left: 4px solid #6366f1;
        }
        pre code {
            background: none;
            padding: 0;
        }
        blockquote {
            border-left: 4px solid #6366f1;
            padding-left: 1rem;
            margin: 1.5em 0;
            font-style: italic;
            background: #e9ecef;
            padding: 1rem;
            border-radius: 0 0.5rem 0.5rem 0;
        }
        a {
            color: #6366f1;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
        }
    </style>
</head>
<body>
    ${this.currentFile.html}
</body>
</html>`;

        this.downloadFile(htmlTemplate, this.currentFile.name.replace(/\.(md|markdown|txt)$/, '.html'), 'text/html');
    }

    /**
     * Download JSON as HTML
     */
    downloadJsonAsHtml() {
        const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.currentFile.name}</title>
    <style>
        body {
            font-family: monospace;
            padding: 2rem;
            background: #1e293b;
            color: #f1f5f9;
        }
        pre {
            background: #0f172a;
            padding: 1.5rem;
            border-radius: 0.5rem;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <pre>${JSON.stringify(this.currentFile.data, null, 2)}</pre>
</body>
</html>`;

        this.downloadFile(htmlTemplate, this.currentFile.name.replace(/\.json$/, '.html'), 'text/html');
    }

    /**
     * Download file helper
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Clear current document and show upload area
     */
    clearDocument() {
        this.currentFile = null;
        this.currentFileType = null;
        this.currentJsonData = null;
        
        this.elements.markdownContent.innerHTML = '';
        this.elements.jsonInput.value = '';
        this.elements.jsonVisualization.innerHTML = '<div class="visualization-placeholder"><p>📊 Your JSON visualization will appear here</p><p class="placeholder-hint">Upload a file or paste JSON to get started</p></div>';
        this.elements.codeHelper.innerHTML = '<div class="code-helper-placeholder"><p>🎯 Click on any key in the visualization</p><p class="placeholder-hint">See how to access it in JavaScript</p></div>';
        this.elements.jsonStats.classList.add('hidden');
        
        this.elements.previewContainer.classList.add('hidden');
        this.elements.jsonViewerContainer.classList.add('hidden');
        this.elements.landingPage.classList.remove('hidden');
        
        this.elements.fileInput.value = '';
        this.elements.downloadBtn.disabled = true;
        this.elements.clearBtn.disabled = true;
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(message);
    }

    /**
     * Toggle FAQ Section Visibility
     */
    toggleFaq() {
        const container = document.getElementById('faqContainer');
        const btn = this.elements.faqToggle;
        
        if (container && btn) {
            container.classList.toggle('hidden');
            btn.classList.toggle('active');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ViewerApp();
});
