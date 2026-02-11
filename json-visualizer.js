/**
 * JSON Visualizers - Multiple view modes
 * Optimized rendering algorithms for performance
 */

/**
 * Base Visualizer Class
 */
class BaseVisualizer {
    constructor() {
        this.maxNodes = 10000; // Prevent browser freeze
        this.clickCallback = null;
    }

    setClickCallback(callback) {
        this.clickCallback = callback;
    }

    createNodeElement(key, value, path, type) {
        const node = document.createElement('div');
        node.className = `json-node json-${type}`;
        node.dataset.path = JSON.stringify(path);
        node.dataset.key = key;
        
        if (this.clickCallback) {
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clickCallback(path, value, key);
            });
        }
        
        return node;
    }
}

/**
 * Tree View Visualizer
 * Optimized with virtual scrolling for large trees
 */
class TreeVisualizer extends BaseVisualizer {
    constructor() {
        super();
        this.expandedNodes = new Set(['root']); // Track expanded state
        this.maxInitialDepth = 2; // Only render 2 levels initially for performance
    }

    render(data, container) {
        container.innerHTML = '';
        container.className = 'tree-view';
        
        const fragment = document.createDocumentFragment();
        const tree = this.buildTree(data, [], 'root', 0);
        fragment.appendChild(tree);
        container.appendChild(fragment);
    }

    buildTree(obj, path = [], key = 'root', depth = 0) {
        const nodeId = path.length === 0 ? 'root' : path.join('.');
        const isExpanded = this.expandedNodes.has(nodeId);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'tree-node-wrapper';
        wrapper.style.marginLeft = `${depth * 20}px`;
        wrapper.dataset.nodeId = nodeId; // Store for debugging

        const node = document.createElement('div');
        node.className = 'tree-node';
        
        const type = this.getType(obj);
        const isExpandable = type === 'object' || type === 'array';

        // Expand/collapse icon
        if (isExpandable) {
            const toggle = document.createElement('span');
            toggle.className = 'tree-toggle';
            toggle.textContent = isExpanded ? '▼' : '▶';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNode(nodeId, wrapper, obj, path, key, depth);
            });
            node.appendChild(toggle);
        } else {
            const spacer = document.createElement('span');
            spacer.className = 'tree-spacer';
            spacer.textContent = '  ';
            node.appendChild(spacer);
        }

        // Key
        const keySpan = document.createElement('span');
        keySpan.className = 'tree-key';
        keySpan.textContent = key;
        keySpan.addEventListener('click', () => {
            if (this.clickCallback) {
                this.clickCallback(path, obj, key);
            }
        });
        node.appendChild(keySpan);

        // Type indicator
        const typeSpan = document.createElement('span');
        typeSpan.className = 'tree-type';
        
        if (type === 'array') {
            typeSpan.textContent = ` [${obj.length}]`;
        } else if (type === 'object') {
            typeSpan.textContent = ` {${Object.keys(obj).length}}`;
        } else {
            typeSpan.textContent = ': ';
        }
        node.appendChild(typeSpan);

        // Value (for primitives)
        if (!isExpandable) {
            const valueSpan = document.createElement('span');
            valueSpan.className = `tree-value tree-value-${type}`;
            valueSpan.textContent = this.formatValue(obj, type);
            node.appendChild(valueSpan);
        }

        wrapper.appendChild(node);

        // Children (if expanded and within depth limit)
        if (isExpandable && isExpanded && depth < this.maxInitialDepth + 10) {
            const children = document.createElement('div');
            children.className = 'tree-children';
            
            const entries = Array.isArray(obj)
                ? obj.map((v, i) => [i, v])
                : Object.entries(obj);

            const fragment = document.createDocumentFragment();
            entries.forEach(([childKey, childValue]) => {
                const childPath = path.length === 0 ? [childKey] : [...path, childKey];
                const childNode = this.buildTree(childValue, childPath, childKey, depth + 1);
                fragment.appendChild(childNode);
            });
            
            children.appendChild(fragment);
            wrapper.appendChild(children);
        }

        return wrapper;
    }

    toggleNode(nodeId, wrapper, obj, path, key, depth) {
        if (this.expandedNodes.has(nodeId)) {
            this.expandedNodes.delete(nodeId);
            // Remove children
            const children = wrapper.querySelector('.tree-children');
            if (children) children.remove();
            // Update toggle icon
            const toggle = wrapper.querySelector('.tree-toggle');
            if (toggle) toggle.textContent = '▶';
        } else {
            this.expandedNodes.add(nodeId);
            // Add children
            const children = document.createElement('div');
            children.className = 'tree-children';
            
            const entries = Array.isArray(obj)
                ? obj.map((v, i) => [i, v])
                : Object.entries(obj);

            const fragment = document.createDocumentFragment();
            entries.forEach(([childKey, childValue]) => {
                const childPath = path.length === 0 ? [childKey] : [...path, childKey];
                const childNode = this.buildTree(childValue, childPath, childKey, depth + 1);
                fragment.appendChild(childNode);
            });
            
            children.appendChild(fragment);
            wrapper.appendChild(children);
            
            // Update toggle icon
            const toggle = wrapper.querySelector('.tree-toggle');
            if (toggle) toggle.textContent = '▼';
        }
    }

    getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        return 'unknown';
    }

    formatValue(value, type) {
        if (type === 'string') return `"${value}"`;
        if (type === 'null') return 'null';
        return String(value);
    }

    expandAll() {
        // Expand all nodes (use with caution on large trees)
        const expandRecursive = (obj, path = []) => {
            const nodeId = path.join('.');
            this.expandedNodes.add(nodeId);
            
            if (obj && typeof obj === 'object') {
                const entries = Array.isArray(obj)
                    ? obj.map((v, i) => [i, v])
                    : Object.entries(obj);
                
                entries.forEach(([key, value]) => {
                    expandRecursive(value, [...path, key]);
                });
            }
        };
        
        this.expandedNodes.clear();
        this.expandedNodes.add('root');
    }

    collapseAll() {
        this.expandedNodes.clear();
        this.expandedNodes.add('root');
    }
}

/**
 * Prettier View Visualizer
 * Syntax-highlighted formatted JSON
 */
class PrettierVisualizer extends BaseVisualizer {
    render(data, container) {
        container.innerHTML = '';
        container.className = 'prettier-view';
        
        const pre = document.createElement('pre');
        pre.className = 'prettier-pre';
        
        const code = document.createElement('code');
        code.className = 'prettier-code';
        
        const formatted = this.formatJSON(data, 0);
        code.innerHTML = formatted;
        
        pre.appendChild(code);
        container.appendChild(pre);
        
        // Add click handlers for keys
        this.addClickHandlers(container, data);
    }

    formatJSON(obj, depth = 0, path = []) {
        const indent = '  '.repeat(depth);
        const type = this.getType(obj);
        
        if (type === 'null') {
            return `<span class="json-null">null</span>`;
        }
        
        if (type === 'boolean') {
            return `<span class="json-boolean">${obj}</span>`;
        }
        
        if (type === 'number') {
            return `<span class="json-number">${obj}</span>`;
        }
        
        if (type === 'string') {
            return `<span class="json-string">"${this.escapeHtml(obj)}"</span>`;
        }
        
        if (type === 'array') {
            if (obj.length === 0) return '[]';
            
            let html = '[\n';
            obj.forEach((item, index) => {
                const itemPath = [...path, index];
                html += indent + '  ';
                html += this.formatJSON(item, depth + 1, itemPath);
                if (index < obj.length - 1) html += ',';
                html += '\n';
            });
            html += indent + ']';
            return html;
        }
        
        if (type === 'object') {
            const keys = Object.keys(obj);
            if (keys.length === 0) return '{}';
            
            let html = '{\n';
            keys.forEach((key, index) => {
                const itemPath = [...path, key];
                const pathStr = JSON.stringify(itemPath);
                html += indent + '  ';
                html += `<span class="json-key clickable" data-path='${pathStr}' data-key="${this.escapeHtml(key)}">"${this.escapeHtml(key)}"</span>: `;
                html += this.formatJSON(obj[key], depth + 1, itemPath);
                if (index < keys.length - 1) html += ',';
                html += '\n';
            });
            html += indent + '}';
            return html;
        }
        
        return String(obj);
    }

    addClickHandlers(container, data) {
        const clickableKeys = container.querySelectorAll('.json-key.clickable');
        clickableKeys.forEach(keyElement => {
            keyElement.addEventListener('click', () => {
                const path = JSON.parse(keyElement.dataset.path);
                const key = keyElement.dataset.key;
                const value = this.getValueAtPath(data, path);
                
                if (this.clickCallback) {
                    this.clickCallback(path, value, key);
                }
            });
        });
    }

    getValueAtPath(obj, path) {
        let current = obj;
        for (const key of path) {
            current = current[key];
        }
        return current;
    }

    getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'string') return 'string';
        return 'unknown';
    }

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
}

/**
 * Graph View Visualizer
 * Force-directed graph layout
 */
class GraphVisualizer extends BaseVisualizer {
    constructor() {
        super();
        this.expandedNodes = new Set(['root']);
        this.isFullscreen = false;
        this.panOffset = { x: 0, y: 0 };
        this.scale = 1;
    }

    render(data, container) {
        // Store fullscreen state before clearing
        const wasFullscreen = this.isFullscreen;
        const currentSvgHeight = container.querySelector('svg')?.getAttribute('height');
        
        container.innerHTML = '';
        container.className = 'graph-view';
        
        // Restore fullscreen class if it was active
        if (wasFullscreen) {
            container.classList.add('graph-fullscreen');
        }
        
        // Store data for re-rendering
        this.currentData = data;
        this.currentContainer = container;
        
        // Add fullscreen button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'graph-fullscreen-btn';
        fullscreenBtn.textContent = wasFullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen';
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen(container));
        container.appendChild(fullscreenBtn);
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', wasFullscreen ? '100vh' : '600');
        svg.style.background = 'var(--bg-tertiary)';
        svg.id = 'graph-svg';
        
        // Add pan/zoom support
        this.addPanZoomSupport(svg);
        
        const nodes = this.extractNodesLazy(data);
        const links = this.extractLinksLazy(data);
        
        this.layoutGraph(nodes, links, svg);
        
        container.appendChild(svg);
    }

    extractNodesLazy(data, path = [], nodes = [], depth = 0) {
        const nodeId = path.length === 0 ? 'root' : path.join('.');
        const type = this.getType(data);
        const isExpanded = this.expandedNodes.has(nodeId);
        
        nodes.push({
            id: nodeId,
            label: path.length > 0 ? path[path.length - 1] : 'root',
            value: data,
            type: type,
            path: path,
            isExpandable: type === 'object' || type === 'array',
            isExpanded: isExpanded
        });
        
        // Only expand if node is expanded and depth < 5 for performance
        if ((type === 'object' || type === 'array') && isExpanded && depth < 5) {
            const entries = Array.isArray(data)
                ? data.map((v, i) => [i, v])
                : Object.entries(data);
            
            entries.forEach(([key, value]) => {
                const childPath = path.length === 0 ? [key] : [...path, key];
                this.extractNodesLazy(value, childPath, nodes, depth + 1);
            });
        }
        
        return nodes;
    }

    extractLinksLazy(data, path = [], links = [], depth = 0) {
        const type = this.getType(data);
        const nodeId = path.length === 0 ? 'root' : path.join('.');
        const isExpanded = this.expandedNodes.has(nodeId);
        
        if ((type === 'object' || type === 'array') && isExpanded && depth < 5) {
            const parentId = nodeId;
            const entries = Array.isArray(data)
                ? data.map((v, i) => [i, v])
                : Object.entries(data);
            
            entries.forEach(([key, value]) => {
                const childPath = path.length === 0 ? [key] : [...path, key];
                const childId = childPath.join('.');
                
                links.push({
                    source: parentId,
                    target: childId
                });
                
                this.extractLinksLazy(value, childPath, links, depth + 1);
            });
        }
        
        return links;
    }

    addPanZoomSupport(svg) {
        let isPanning = false;
        let startPoint = { x: 0, y: 0 };
        let rafId = null;
        
        svg.addEventListener('mousedown', (e) => {
            // Allow panning unless clicking on a node circle or text
            const isNode = e.target.closest('g[data-node-id]');
            if (!isNode) {
                isPanning = true;
                startPoint = { x: e.clientX - this.panOffset.x, y: e.clientY - this.panOffset.y };
                svg.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        
        svg.addEventListener('mousemove', (e) => {
            if (isPanning) {
                if (rafId) cancelAnimationFrame(rafId);
                
                rafId = requestAnimationFrame(() => {
                    this.panOffset.x = e.clientX - startPoint.x;
                    this.panOffset.y = e.clientY - startPoint.y;
                    this.updateTransform(svg);
                });
            }
        });
        
        svg.addEventListener('mouseup', () => {
            if (isPanning) {
                if (rafId) cancelAnimationFrame(rafId);
                isPanning = false;
                svg.style.cursor = 'grab';
            }
        });
        
        svg.addEventListener('mouseleave', () => {
            if (isPanning) {
                if (rafId) cancelAnimationFrame(rafId);
                isPanning = false;
                svg.style.cursor = 'default';
            }
        });
        
        // Zoom with mouse wheel
        svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.scale *= delta;
            this.scale = Math.max(0.1, Math.min(5, this.scale));
            this.updateTransform(svg);
        });
        
        // Touch support
        let lastTouchDistance = 0;
        svg.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            }
        });
        
        svg.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                if (lastTouchDistance > 0) {
                    const delta = distance / lastTouchDistance;
                    this.scale *= delta;
                    this.scale = Math.max(0.1, Math.min(5, this.scale));
                    this.updateTransform(svg);
                }
                
                lastTouchDistance = distance;
            }
        });
        
        svg.style.cursor = 'grab';
    }

    updateTransform(svg) {
        const g = svg.querySelector('#graph-main-group');
        if (g) {
            g.setAttribute('transform', `translate(${this.panOffset.x}, ${this.panOffset.y}) scale(${this.scale})`);
        }
    }

    toggleFullscreen(container) {
        if (!this.isFullscreen) {
            container.classList.add('graph-fullscreen');
            const svg = container.querySelector('svg');
            svg.setAttribute('height', '100vh');
            this.isFullscreen = true;
            container.querySelector('.graph-fullscreen-btn').textContent = '✕ Exit Fullscreen';
        } else {
            container.classList.remove('graph-fullscreen');
            const svg = container.querySelector('svg');
            svg.setAttribute('height', '600');
            this.isFullscreen = false;
            container.querySelector('.graph-fullscreen-btn').textContent = '⛶ Fullscreen';
        }
    }



    addColorLegend(svg) {
        const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        legendGroup.setAttribute('id', 'color-legend');
        legendGroup.setAttribute('transform', 'translate(20, 20)');
        legendGroup.style.pointerEvents = 'none'; // Don't block pan/zoom
        
        const legend = [
            { color: '#667eea', label: 'Object' },
            { color: '#f093fb', label: 'Array' },
            { color: '#4facfe', label: 'String' },
            { color: '#43e97b', label: 'Number' },
            { color: '#fa709a', label: 'Boolean' },
            { color: '#cbd5e1', label: 'Null' }
        ];
        
        // Background
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', '-5');
        bg.setAttribute('y', '-5');
        bg.setAttribute('width', '110');
        bg.setAttribute('height', legend.length * 22 + 10);
        bg.setAttribute('fill', 'var(--bg-secondary)');
        bg.setAttribute('opacity', '0.95');
        bg.setAttribute('rx', '5');
        legendGroup.appendChild(bg);
        
        legend.forEach((item, index) => {
            const y = index * 22;
            
            // Color circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '8');
            circle.setAttribute('cy', y + 8);
            circle.setAttribute('r', '6');
            circle.setAttribute('fill', item.color);
            legendGroup.appendChild(circle);
            
            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '20');
            text.setAttribute('y', y + 12);
            text.setAttribute('fill', 'var(--text-primary)');
            text.setAttribute('font-size', '11');
            text.textContent = item.label;
            legendGroup.appendChild(text);
        });
        
        svg.appendChild(legendGroup);
    }

    layoutGraph(nodes, links, svg) {
        const width = svg.clientWidth || 800;
        const height = svg.clientHeight || 600;
        
        // Create main group for pan/zoom
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('id', 'graph-main-group');
        
        // Build tree structure
        const nodeMap = new Map();
        nodes.forEach(node => {
            nodeMap.set(node.id, { 
                ...node, 
                children: [],
                depth: 0,
                x: 0,
                y: 0,
                isDraggable: false // Double-click to enable
            });
        });
        
        // Establish parent-child relationships
        links.forEach(link => {
            const parent = nodeMap.get(link.source);
            const child = nodeMap.get(link.target);
            if (parent && child) {
                parent.children.push(child);
            }
        });
        
        // Calculate depths and assign to layers
        const root = nodeMap.get('root');
        const layers = [];
        
        if (root) {
            const assignDepth = (node, depth = 0) => {
                node.depth = depth;
                if (!layers[depth]) layers[depth] = [];
                layers[depth].push(node);
                
                node.children.forEach(child => assignDepth(child, depth + 1));
            };
            assignDepth(root);
        }
        
        // Calculate positions with proper spacing
        const maxDepth = layers.length - 1;
        const horizontalSpacing = Math.max(150, width / (maxDepth + 2));
        
        layers.forEach((layer, depth) => {
            const layerHeight = Math.max(100, height / (layer.length + 1));
            
            layer.forEach((node, index) => {
                node.x = 80 + (depth * horizontalSpacing);
                node.y = 50 + ((index + 1) * layerHeight);
            });
        });
        
        // Draw links
        const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        linksGroup.setAttribute('id', 'links-group');
        
        links.forEach(link => {
            const source = nodeMap.get(link.source);
            const target = nodeMap.get(link.target);
            
            if (source && target && source.x && target.x) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('class', `link-${link.source}-${link.target}`);
                path.setAttribute('data-source', link.source);
                path.setAttribute('data-target', link.target);
                
                const midX = (source.x + target.x) / 2;
                const d = `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;
                path.setAttribute('d', d);
                path.setAttribute('stroke', 'var(--accent-primary)');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('fill', 'none');
                path.setAttribute('opacity', '0.5');
                linksGroup.appendChild(path);
            }
        });
        
        g.appendChild(linksGroup);
        
        // Draw nodes with drag capability
        nodeMap.forEach(node => {
            if (!node.x || !node.y) return;
            
            const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            nodeGroup.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            nodeGroup.setAttribute('data-node-id', node.id);
            nodeGroup.style.cursor = 'pointer';
            
            // Circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', '20');
            circle.setAttribute('fill', this.getNodeColor(node.type));
            circle.setAttribute('stroke', 'var(--accent-primary)');
            circle.setAttribute('stroke-width', '2');
            circle.style.transition = 'all 0.2s';
            
            // Expand/collapse indicator
            if (node.isExpandable) {
                const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                indicator.setAttribute('text-anchor', 'middle');
                indicator.setAttribute('dy', '5');
                indicator.setAttribute('fill', 'white');
                indicator.setAttribute('font-size', '14');
                indicator.setAttribute('font-weight', 'bold');
                indicator.textContent = node.isExpanded ? '−' : '+';
                indicator.style.pointerEvents = 'none';
                nodeGroup.appendChild(indicator);
            }
            
            // Label - positioned to the right of the circle
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '28');
            text.setAttribute('y', '5');
            text.setAttribute('fill', 'var(--text-primary)');
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', '500');
            text.style.pointerEvents = 'none';
            text.textContent = String(node.label).substring(0, 20);
            
            nodeGroup.appendChild(circle);
            nodeGroup.appendChild(text);
            
            // Hover effects
            nodeGroup.addEventListener('mouseenter', () => {
                circle.setAttribute('r', '24');
                circle.setAttribute('stroke-width', '3');
            });
            
            nodeGroup.addEventListener('mouseleave', () => {
                circle.setAttribute('r', '20');
                circle.setAttribute('stroke-width', '2');
            });
            
            // Node dragging
            let isDragging = false;
            let dragStart = { x: 0, y: 0 };
            let dragRafId = null;
            
            nodeGroup.addEventListener('mousedown', (e) => {
                if (node.isDraggable) {
                    isDragging = true;
                    const transform = nodeGroup.getAttribute('transform');
                    const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
                    if (match) {
                        dragStart.x = e.clientX - parseFloat(match[1]);
                        dragStart.y = e.clientY - parseFloat(match[2]);
                    }
                    e.stopPropagation();
                }
            });
            
            svg.addEventListener('mousemove', (e) => {
                if (isDragging && node.isDraggable) {
                    if (dragRafId) cancelAnimationFrame(dragRafId);
                    
                    dragRafId = requestAnimationFrame(() => {
                        const newX = e.clientX - dragStart.x;
                        const newY = e.clientY - dragStart.y;
                        nodeGroup.setAttribute('transform', `translate(${newX}, ${newY})`);
                        node.x = newX;
                        node.y = newY;
                        
                        // Update connected links
                        this.updateNodeLinks(node.id, newX, newY, linksGroup);
                    });
                }
            });
            
            svg.addEventListener('mouseup', () => {
                if (isDragging) {
                    if (dragRafId) cancelAnimationFrame(dragRafId);
                    isDragging = false;
                }
            });
            
            // Double-click to toggle draggable
            let clickCount = 0;
            let clickTimer = null;
            
            nodeGroup.addEventListener('click', (e) => {
                clickCount++;
                
                if (clickCount === 1) {
                    clickTimer = setTimeout(() => {
                        // Single click - expand/collapse or show code
                        if (node.isExpandable) {
                            if (this.expandedNodes.has(node.id)) {
                                this.expandedNodes.delete(node.id);
                            } else {
                                this.expandedNodes.add(node.id);
                            }
                            this.render(this.currentData, this.currentContainer);
                        } else {
                            if (this.clickCallback) {
                                this.clickCallback(node.path, node.value, node.label);
                            }
                        }
                        clickCount = 0;
                    }, 250);
                } else if (clickCount === 2) {
                    // Double click - toggle draggable
                    clearTimeout(clickTimer);
                    node.isDraggable = !node.isDraggable;
                    circle.setAttribute('stroke', node.isDraggable ? '#fbbf24' : 'var(--accent-primary)');
                    circle.setAttribute('stroke-width', node.isDraggable ? '3' : '2');
                    nodeGroup.style.cursor = node.isDraggable ? 'move' : 'pointer';
                    clickCount = 0;
                }
                
                e.stopPropagation();
            });
            
            g.appendChild(nodeGroup);
        });
        
        svg.appendChild(g);
        
        // Add legend AFTER graph group so it doesn't get transformed
        this.addColorLegend(svg);
    }

    updateNodeLinks(nodeId, newX, newY, linksGroup) {
        // Update all links connected to this node
        const links = linksGroup.querySelectorAll('path');
        links.forEach(link => {
            const source = link.getAttribute('data-source');
            const target = link.getAttribute('data-target');
            
            if (source === nodeId || target === nodeId) {
                const sourceNode = source === nodeId ? 
                    { x: newX, y: newY } : 
                    this.getNodePosition(source, linksGroup.parentNode);
                const targetNode = target === nodeId ? 
                    { x: newX, y: newY } : 
                    this.getNodePosition(target, linksGroup.parentNode);
                
                if (sourceNode && targetNode) {
                    const midX = (sourceNode.x + targetNode.x) / 2;
                    const d = `M ${sourceNode.x} ${sourceNode.y} C ${midX} ${sourceNode.y}, ${midX} ${targetNode.y}, ${targetNode.x} ${targetNode.y}`;
                    link.setAttribute('d', d);
                }
            }
        });
    }

    getNodePosition(nodeId, graphGroup) {
        const nodeGroup = graphGroup.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeGroup) {
            const transform = nodeGroup.getAttribute('transform');
            const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
            if (match) {
                return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
            }
        }
        return null;
    }

    getNodeColor(type) {
        const colors = {
            'object': '#667eea',
            'array': '#f093fb',
            'string': '#4facfe',
            'number': '#43e97b',
            'boolean': '#fa709a',
            'null': '#cbd5e1'
        };
        return colors[type] || '#94a3b8';
    }

    getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }
}

/**
 * Table Visualizer
 * Displays JSON data in a sortable, filterable table
 */
class TableVisualizer extends BaseVisualizer {
    constructor() {
        super();
        this.sortColumn = 'path';
        this.sortDirection = 'asc';
        this.filterText = '';
        this.tableMode = 'auto'; // 'auto', 'grid', or 'flat'
        this.expandedCells = new Set(); // Track expanded nested objects
    }

    /**
     * Detect the best table mode for the data
     */
    detectTableMode(data) {
        if (this.tableMode !== 'auto') {
            return this.tableMode;
        }

        // If data is an array of objects, use grid mode
        if (Array.isArray(data) && data.length > 0) {
            const firstItem = data[0];
            if (typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)) {
                return 'grid';
            }
        }

        // If data is a single object, use grid mode with one row
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            return 'grid';
        }

        // Otherwise, use flat mode
        return 'flat';
    }

    /**
     * Extract all unique column names from array of objects
     */
    extractColumns(data) {
        const columnsSet = new Set();
        
        const items = Array.isArray(data) ? data : [data];
        
        items.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach(key => columnsSet.add(key));
            }
        });

        return Array.from(columnsSet);
    }

    render(data, container) {
        container.innerHTML = '';
        container.className = 'table-view';
        
        const mode = this.detectTableMode(data);
        
        if (mode === 'grid') {
            this.renderGridTable(data, container);
        } else {
            this.renderFlatTable(data, container);
        }
    }

    /**
     * Render grid-based table for arrays of objects
     */
    renderGridTable(data, container) {
        const items = Array.isArray(data) ? data : [data];
        const columns = this.extractColumns(data);
        
        // Create controls
        const controls = document.createElement('div');
        controls.className = 'table-controls';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Filter rows...';
        searchInput.className = 'table-search';
        searchInput.addEventListener('input', (e) => {
            this.filterText = e.target.value.toLowerCase();
            this.renderGridTableBody(items, columns, tableBody);
        });
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'table-download-btn';
        downloadBtn.innerHTML = '📥 Download CSV';
        downloadBtn.addEventListener('click', () => {
            this.showCsvExportModal(items, columns);
        });
        
        controls.appendChild(searchInput);
        controls.appendChild(downloadBtn);
        container.appendChild(controls);
        
        // Create table
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        
        const table = document.createElement('table');
        table.className = 'json-grid-table';
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            th.className = 'sortable';
            
            if (this.sortColumn === col) {
                th.classList.add('sorted');
                th.textContent += this.sortDirection === 'asc' ? ' ▲' : ' ▼';
            }
            
            th.addEventListener('click', () => {
                if (this.sortColumn === col) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = col;
                    this.sortDirection = 'asc';
                }
                this.render(data, container);
            });
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tableBody = document.createElement('tbody');
        table.appendChild(tableBody);
        
        tableWrapper.appendChild(table);
        container.appendChild(tableWrapper);
        
        // Render table body
        this.renderGridTableBody(items, columns, tableBody);
    }

    /**
     * Render grid table body with filtering and sorting
     */
    renderGridTableBody(items, columns, tbody) {
        tbody.innerHTML = '';
        
        // Filter items
        let filteredItems = items;
        if (this.filterText) {
            filteredItems = items.filter(item => {
                return columns.some(col => {
                    const value = item[col];
                    return String(value).toLowerCase().includes(this.filterText);
                });
            });
        }
        
        // Sort items
        if (this.sortColumn && columns.includes(this.sortColumn)) {
            filteredItems = [...filteredItems].sort((a, b) => {
                const aVal = a[this.sortColumn];
                const bVal = b[this.sortColumn];
                
                // Handle null/undefined
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;
                
                // Type-aware comparison
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                }
                
                const aStr = String(aVal);
                const bStr = String(bVal);
                
                if (aStr < bStr) return this.sortDirection === 'asc' ? -1 : 1;
                if (aStr > bStr) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        // Render rows
        filteredItems.forEach((item, rowIndex) => {
            const tr = document.createElement('tr');
            
            columns.forEach(col => {
                const td = document.createElement('td');
                const value = item[col];
                const type = this.getType(value);
                
                td.className = `cell-${type}`;
                
                // Append td to tr FIRST, before any modifications
                tr.appendChild(td);
                
                if (type === 'object' || type === 'array') {
                    // Expandable cell - this will replace td in place
                    this.renderExpandableCell(td, value, type, rowIndex, col);
                } else {
                    // Regular cell
                    td.textContent = this.formatCellValue(value, type);
                    
                    // Add click handler
                    td.style.cursor = 'pointer';
                    td.addEventListener('click', () => {
                        if (this.clickCallback) {
                            this.clickCallback([col], value, col);
                        }
                    });
                }
            });
            
            tbody.appendChild(tr);
        });
        
        // Show count
        const existingCount = tbody.parentElement.parentElement.querySelector('.table-count');
        if (existingCount) {
            existingCount.remove();
        }
        
        const count = document.createElement('div');
        count.className = 'table-count';
        count.textContent = `Showing ${filteredItems.length} of ${items.length} rows`;
        tbody.parentElement.parentElement.insertBefore(count, tbody.parentElement);
    }

    /**
     * Render expandable cell for nested objects/arrays
     */
    renderExpandableCell(td, value, type, rowIndex, colName) {
        const cellId = `${rowIndex}-${colName}`;
        const isExpanded = this.expandedCells.has(cellId);
        
        // Clear the cell content and remove old event listeners
        td.innerHTML = '';
        td.className = `cell-${type} expandable-cell`;
        td.style.cursor = 'pointer';
        
        // Remove all old event listeners by cloning and replacing
        const newTd = td.cloneNode(false); // Clone without children
        
        if (!isExpanded) {
            // Collapsed view
            const expandBtn = document.createElement('span');
            expandBtn.className = 'expand-btn';
            expandBtn.textContent = '+';
            
            const label = document.createElement('span');
            if (type === 'array') {
                label.textContent = ` Array (${value.length})`;
            } else {
                label.textContent = ` Object (${Object.keys(value).length})`;
            }
            
            newTd.appendChild(expandBtn);
            newTd.appendChild(label);
            
            newTd.addEventListener('click', () => {
                this.expandedCells.add(cellId);
                this.renderExpandableCell(newTd, value, type, rowIndex, colName);
            });
        } else {
            // Expanded view - show as nested table
            const collapseBtn = document.createElement('span');
            collapseBtn.className = 'expand-btn';
            collapseBtn.textContent = '−';
            
            newTd.appendChild(collapseBtn);
            
            const content = document.createElement('div');
            content.className = 'expanded-content';
            
            // Create nested table
            const nestedTable = this.createNestedTable(value, type);
            content.appendChild(nestedTable);
            
            newTd.appendChild(content);
            
            newTd.addEventListener('click', (e) => {
                // Only collapse if clicking the button, not the content
                if (e.target === newTd || e.target.classList.contains('expand-btn')) {
                    this.expandedCells.delete(cellId);
                    this.renderExpandableCell(newTd, value, type, rowIndex, colName);
                }
            });
        }
        
        // Replace the old td with the new one
        td.parentNode.replaceChild(newTd, td);
    }

    /**
     * Create a nested table for displaying object/array contents
     */
    createNestedTable(value, type) {
        const table = document.createElement('table');
        table.className = 'nested-table';
        
        if (type === 'array') {
            // For arrays, show index and value
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            const indexHeader = document.createElement('th');
            indexHeader.textContent = 'Index';
            headerRow.appendChild(indexHeader);
            
            const valueHeader = document.createElement('th');
            valueHeader.textContent = 'Value';
            headerRow.appendChild(valueHeader);
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            value.forEach((item, index) => {
                const row = document.createElement('tr');
                
                const indexCell = document.createElement('td');
                indexCell.textContent = index;
                indexCell.className = 'nested-index-cell';
                row.appendChild(indexCell);
                
                const valueCell = document.createElement('td');
                valueCell.className = 'nested-value-cell';
                this.renderNestedValue(valueCell, item);
                row.appendChild(valueCell);
                
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
        } else {
            // For objects, show key and value
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            const keyHeader = document.createElement('th');
            keyHeader.textContent = 'Property';
            headerRow.appendChild(keyHeader);
            
            const valueHeader = document.createElement('th');
            valueHeader.textContent = 'Value';
            headerRow.appendChild(valueHeader);
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            Object.entries(value).forEach(([key, val]) => {
                const row = document.createElement('tr');
                
                const keyCell = document.createElement('td');
                keyCell.textContent = key;
                keyCell.className = 'nested-key-cell';
                row.appendChild(keyCell);
                
                const valueCell = document.createElement('td');
                valueCell.className = 'nested-value-cell';
                this.renderNestedValue(valueCell, val);
                row.appendChild(valueCell);
                
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
        }
        
        return table;
    }

    /**
     * Render a value in a nested table cell
     */
    renderNestedValue(cell, value) {
        const valueType = this.getType(value);
        
        if (valueType === 'object' || valueType === 'array') {
            // Show compact representation for nested objects/arrays
            const compact = document.createElement('span');
            compact.className = 'nested-compact';
            if (valueType === 'array') {
                compact.textContent = `Array (${value.length})`;
            } else {
                compact.textContent = `Object (${Object.keys(value).length})`;
            }
            cell.appendChild(compact);
        } else {
            // Show the actual value
            cell.textContent = this.formatCellValue(value, valueType);
            cell.className += ` cell-${valueType}`;
        }
    }

    /**
     * Format cell value for display
     */
    formatCellValue(value, type) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (type === 'string') return value;
        if (type === 'number') {
            // Format numbers with commas
            return value.toLocaleString();
        }
        if (type === 'boolean') return value ? '✓' : '✗';
        return String(value);
    }

    /**
     * Show CSV export modal
     */
    showCsvExportModal(items, columns) {
        const modal = document.getElementById('csvExportModal');
        const closeBtn = document.getElementById('closeCsvModal');
        const cancelBtn = document.getElementById('cancelCsvExport');
        const confirmBtn = document.getElementById('confirmCsvExport');
        
        if (!modal) return;
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Close handlers
        const closeModal = () => {
            modal.classList.add('hidden');
            cleanup();
        };
        
        const cleanup = () => {
            closeBtn.removeEventListener('click', closeModal);
            cancelBtn.removeEventListener('click', closeModal);
            confirmBtn.removeEventListener('click', handleConfirm);
            modal.removeEventListener('click', overlayClick);
        };
        
        const overlayClick = (e) => {
            if (e.target === modal) closeModal();
        };
        
        const handleConfirm = () => {
            // Get selected format
            const format = document.querySelector('input[name="csvFormat"]:checked').value;
            this.downloadAsCSV(items, columns, format);
            closeModal();
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', handleConfirm);
        modal.addEventListener('click', overlayClick);
    }

    /**
     * Download table data as CSV
     */
    downloadAsCSV(items, columns, format = 'default') {
        let csvContent = '';
        
        if (format === 'flatten') {
            // Flatten all items
            const flattenedItems = items.map(item => this.flattenObject(item));
            
            // Extract all unique keys from flattened items
            const allKeys = new Set();
            flattenedItems.forEach(item => {
                Object.keys(item).forEach(key => allKeys.add(key));
            });
            const flattenedColumns = Array.from(allKeys).sort();
            
            // Create header
            const header = flattenedColumns.map(col => this.escapeCSV(col)).join(',');
            
            // Create rows
            const rows = flattenedItems.map(item => {
                return flattenedColumns.map(col => {
                    return this.escapeCSV(String(item[col] ?? ''));
                }).join(',');
            });
            
            csvContent = [header, ...rows].join('\n');
        } else {
            // Default behavior (nested objects as JSON strings)
            // Create CSV header
            const header = columns.map(col => this.escapeCSV(col)).join(',');
            
            // Create CSV rows
            const rows = items.map(item => {
                return columns.map(col => {
                    const value = item[col];
                    const type = this.getType(value);
                    
                    if (type === 'object' || type === 'array') {
                        // For nested objects/arrays, use JSON representation
                        return this.escapeCSV(JSON.stringify(value));
                    } else {
                        // For primitive values, use the formatted value
                        return this.escapeCSV(String(value ?? ''));
                    }
                }).join(',');
            });
            
            csvContent = [header, ...rows].join('\n');
        }
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `table-export-${format}-${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Recursively flatten an object
     */
    flattenObject(obj, prefix = '') {
        return Object.keys(obj).reduce((acc, key) => {
            const pre = prefix.length ? prefix + '.' : '';
            const value = obj[key];
            const type = this.getType(value);
            
            if (type === 'object' && value !== null && Object.keys(value).length > 0) {
                // Recursively flatten objects
                Object.assign(acc, this.flattenObject(value, pre + key));
            } else if (type === 'array' && value.length > 0) {
                // For arrays, keep them as JSON strings or flatten based on requirement
                // Here we'll default to JSON string for arrays to avoid explosion of columns
                // unless it's an array of primitives, but simple JSON string is safer for CSV
                acc[pre + key] = JSON.stringify(value);
            } else {
                acc[pre + key] = value;
            }
            
            return acc;
        }, {});
    }

    /**
     * Escape CSV values (handle quotes, commas, newlines)
     */
    escapeCSV(value) {
        if (value == null) return '';
        
        const stringValue = String(value);
        
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
    }

    /**
     * Render flat table (original implementation)
     */
    renderFlatTable(data, container) {
        // Extract all key-value pairs
        const rows = this.extractRows(data);
        
        // Create controls
        const controls = document.createElement('div');
        controls.className = 'table-controls';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Filter by key or value...';
        searchInput.className = 'table-search';
        searchInput.addEventListener('input', (e) => {
            this.filterText = e.target.value.toLowerCase();
            this.renderTable(rows, tableBody);
        });
        
        controls.appendChild(searchInput);
        container.appendChild(controls);
        
        // Create table
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        
        const table = document.createElement('table');
        table.className = 'json-table';
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const columns = [
            { key: 'path', label: 'Path' },
            { key: 'key', label: 'Key' },
            { key: 'value', label: 'Value' },
            { key: 'type', label: 'Type' }
        ];
        
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.label;
            th.className = 'sortable';
            
            if (this.sortColumn === col.key) {
                th.classList.add('sorted');
                th.textContent += this.sortDirection === 'asc' ? ' ▲' : ' ▼';
            }
            
            th.addEventListener('click', () => {
                if (this.sortColumn === col.key) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = col.key;
                    this.sortDirection = 'asc';
                }
                this.render(data, container);
            });
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tableBody = document.createElement('tbody');
        table.appendChild(tableBody);
        
        // Append to DOM first before rendering rows
        tableWrapper.appendChild(table);
        container.appendChild(tableWrapper);
        
        // Now render the table rows (after table is in DOM)
        this.renderTable(rows, tableBody);
    }

    renderTable(rows, tbody) {
        tbody.innerHTML = '';
        
        // Filter rows
        let filteredRows = rows;
        if (this.filterText) {
            filteredRows = rows.filter(row => 
                row.key.toLowerCase().includes(this.filterText) ||
                String(row.value).toLowerCase().includes(this.filterText) ||
                row.path.join('.').toLowerCase().includes(this.filterText)
            );
        }
        
        // Sort rows
        filteredRows.sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];
            
            if (this.sortColumn === 'path') {
                aVal = a.path.join('.');
                bVal = b.path.join('.');
            }
            
            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        // Render rows
        filteredRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = `type-${row.type}`;
            
            // Path
            const pathTd = document.createElement('td');
            pathTd.className = 'path-cell';
            pathTd.textContent = row.path.join('.');
            tr.appendChild(pathTd);
            
            // Key
            const keyTd = document.createElement('td');
            keyTd.className = 'key-cell';
            keyTd.textContent = row.key;
            keyTd.style.cursor = 'pointer';
            keyTd.addEventListener('click', () => {
                if (this.clickCallback) {
                    this.clickCallback(row.path, row.value, row.key);
                }
            });
            tr.appendChild(keyTd);
            
            // Value
            const valueTd = document.createElement('td');
            valueTd.className = 'value-cell';
            valueTd.textContent = this.formatValue(row.value, row.type);
            tr.appendChild(valueTd);
            
            // Type
            const typeTd = document.createElement('td');
            typeTd.className = 'type-cell';
            const typeBadge = document.createElement('span');
            typeBadge.className = `type-badge type-badge-${row.type}`;
            typeBadge.textContent = row.type;
            typeTd.appendChild(typeBadge);
            tr.appendChild(typeTd);
            
            tbody.appendChild(tr);
        });
        
        // Show count - remove existing first
        const existingCount = tbody.parentElement.parentElement.querySelector('.table-count');
        if (existingCount) {
            existingCount.remove();
        }
        
        const count = document.createElement('div');
        count.className = 'table-count';
        count.textContent = `Showing ${filteredRows.length} of ${rows.length} items`;
        tbody.parentElement.parentElement.insertBefore(count, tbody.parentElement);
    }

    extractRows(obj, path = [], rows = []) {
        const type = this.getType(obj);
        
        if (type === 'object') {
            Object.entries(obj).forEach(([key, value]) => {
                const newPath = [...path, key];
                rows.push({
                    path: newPath,
                    key: key,
                    value: value,
                    type: this.getType(value)
                });
                
                if (typeof value === 'object' && value !== null) {
                    this.extractRows(value, newPath, rows);
                }
            });
        } else if (type === 'array') {
            obj.forEach((value, index) => {
                const newPath = [...path, index];
                rows.push({
                    path: newPath,
                    key: String(index),
                    value: value,
                    type: this.getType(value)
                });
                
                if (typeof value === 'object' && value !== null) {
                    this.extractRows(value, newPath, rows);
                }
            });
        }
        
        return rows;
    }

    formatValue(value, type) {
        if (type === 'object') return `{${Object.keys(value).length} keys}`;
        if (type === 'array') return `[${value.length} items]`;
        if (type === 'string') return `"${value}"`;
        if (type === 'null') return 'null';
        return String(value);
    }

    getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'string') return 'string';
        return 'unknown';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TreeVisualizer, PrettierVisualizer, GraphVisualizer, TableVisualizer };
}
