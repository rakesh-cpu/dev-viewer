/**
 * Panel Resize Handler
 * Allows users to resize panels by dragging the resize handles
 */

class ResizeHandler {
    constructor() {
        this.resizeHandle1 = document.getElementById('resizeHandle');
        this.resizeHandle2 = document.getElementById('resizeHandle2');
        this.inputPanel = document.querySelector('.json-input-panel');
        this.viewerPanel = document.querySelector('.json-viewer-panel');
        this.codePanel = document.querySelector('.json-code-panel');
        this.isResizing = false;
        this.activeHandle = null;
        this.startX = 0;
        this.startWidth = 0;
        this.startWidth2 = 0;
        
        this.init();
    }

    init() {
        if (!this.resizeHandle1 || !this.inputPanel || !this.viewerPanel) return;

        // Handle 1: Between input and visualization
        this.resizeHandle1.addEventListener('mousedown', (e) => {
            this.startResize(e, 1);
        });

        // Handle 2: Between visualization and code helper
        if (this.resizeHandle2 && this.codePanel) {
            this.resizeHandle2.addEventListener('mousedown', (e) => {
                this.startResize(e, 2);
            });
        }

        document.addEventListener('mousemove', (e) => {
            this.resize(e);
        });

        document.addEventListener('mouseup', () => {
            this.stopResize();
        });
    }

    startResize(e, handleNumber) {
        this.isResizing = true;
        this.activeHandle = handleNumber;
        this.startX = e.clientX;
        
        if (handleNumber === 1) {
            this.startWidth = this.inputPanel.offsetWidth;
        } else if (handleNumber === 2) {
            this.startWidth = this.viewerPanel.offsetWidth;
            this.startWidth2 = this.codePanel.offsetWidth;
        }
        
        // Add resizing class for visual feedback
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    resize(e) {
        if (!this.isResizing) return;

        const delta = e.clientX - this.startX;
        
        if (this.activeHandle === 1) {
            // Resize input panel - allow full range
            const newWidth = this.startWidth + delta;
            const containerWidth = this.inputPanel.parentElement.offsetWidth;
            const percentage = (newWidth / containerWidth) * 100;
            
            // Allow full range from 5% to 95% (small buffer for usability)
            if (percentage >= 5 && percentage <= 95) {
                this.inputPanel.style.width = `${percentage}%`;
            }
        } else if (this.activeHandle === 2) {
            // Resize visualization and code panels - allow full range
            const newViewerWidth = this.startWidth + delta;
            const newCodeWidth = this.startWidth2 - delta;
            
            // Allow very small minimum widths (50px) for maximum flexibility
            if (newViewerWidth >= 50 && newCodeWidth >= 50) {
                this.viewerPanel.style.width = `${newViewerWidth}px`;
                this.codePanel.style.width = `${newCodeWidth}px`;
            }
        }
    }

    stopResize() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        this.activeHandle = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ResizeHandler();
    });
} else {
    new ResizeHandler();
}
