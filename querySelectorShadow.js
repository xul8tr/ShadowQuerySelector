/**
 * [Usage]
 * document.querySelectorAll(':shadow .some-class')
 * document.querySelectorAll(':shadow .some-class, :shadow .another-class')
 */


/**
 * Enhanced query selector that searches through shadow DOM trees
 * @param {string} selector - CSS selector to search for
 * @param {Element|Document} root - Starting point for the search (default: document)
 * @returns {Element|null} - First matching element or null
 */
function querySelectorShadow(selector, root = document) {
    // First, try regular querySelector
    let element = root.querySelector(selector);
    if (element) return element;
    
    // If not found, search through shadow roots
    const allElements = root.querySelectorAll('*');
    
    for (const el of allElements) {
        // Check if element has a shadow root
        if (el.shadowRoot) {
            // Recursively search within the shadow root
            element = querySelectorShadow(selector, el.shadowRoot);
            if (element) return element;
        }
    }
    
    return null;
}

/**
 * Alternative implementation using a more performant tree walker
 * @param {string} selector - CSS selector to search for
 * @param {Element|Document} root - Starting point for the search
 * @returns {Array<Element>} - Array of all matching elements
 */
function querySelectorAllShadowOptimized(selector, root = document) {
    const results = [];
    const pending = [root];
    
    while (pending.length > 0) {
        const current = pending.shift();
        
        // Check current node for matches
        if (current !== root && current.matches && current.matches(selector)) {
            results.push(current);
        }
        
        // Add shadow root if it exists
        if (current.shadowRoot) {
            pending.push(current.shadowRoot);
        }
        
        // Add children
        if (current.children) {
            pending.push(...current.children);
        }
    }
    
    return results;
}

/**
 * Utility function to find closest ancestor (including shadow DOM boundaries)
 * @param {Element} element - Starting element
 * @param {string} selector - CSS selector to match
 * @returns {Element|null} - Closest matching ancestor or null
 */
function closestShadow(element, selector) {
    while (element) {
        if (element.matches && element.matches(selector)) {
            return element;
        }
        
        // Check parent
        element = element.parentElement;
        
        // If no parent, check if we're in a shadow root
        if (!element && element.getRootNode() instanceof ShadowRoot) {
            element = element.getRootNode().host;
        }
    }
    
    return null;
}

/**
 * Enhanced query selector all that searches through shadow DOM trees
 * @param {string} selector - CSS selector to search for
 * @param {Element|Document} root - Starting point for the search (default: document)
 * @returns {Array<Element>} - Array of all matching elements
 */
function querySelectorAllShadow(selector, root = document) {
    const results = [];
    
    // Add regular querySelectorAll results
    results.push(...root.querySelectorAll(selector));
    
    // Search through all elements for shadow roots
    const allElements = root.querySelectorAll('*');
    
    for (const el of allElements) {
        // Check if element has a shadow root
        if (el.shadowRoot) {
            // Recursively search within the shadow root
            results.push(...querySelectorAllShadow(selector, el.shadowRoot));
        }
    }
    
    return results;
}

/**
 * Override native querySelector and querySelectorAll methods
 * This adds :shadow pseudo-selector support for shadow DOM traversal
 */
(function() {
    // Store original methods
    const originalQuerySelector = Element.prototype.querySelector;
    const originalQuerySelectorAll = Element.prototype.querySelectorAll;
    const originalDocQuerySelector = Document.prototype.querySelector;
    const originalDocQuerySelectorAll = Document.prototype.querySelectorAll;
    
    // Helper function to check if selector needs shadow search
    function needsShadowSearch(selector) {
        return selector.includes(':shadow') || selector.includes('>>>');
    }
    
    // Helper function to clean selector
    function cleanSelector(selector) {
        return selector.replace(/:shadow\s*/g, '').replace(/>>>\s*/g, '').trim();
    }
    
    // Override Element.prototype.querySelector
    Element.prototype.querySelector = function(selector) {
        if (needsShadowSearch(selector)) {
            return querySelectorShadow(cleanSelector(selector), this);
        }
        return originalQuerySelector.call(this, selector);
    };
    
    // Override Element.prototype.querySelectorAll
    Element.prototype.querySelectorAll = function(selector) {
        if (needsShadowSearch(selector)) {
            return querySelectorAllShadowOptimized(cleanSelector(selector), this);
        }
        return originalQuerySelectorAll.call(this, selector);
    };
    
    // Override Document.prototype.querySelector
    Document.prototype.querySelector = function(selector) {
        if (needsShadowSearch(selector)) {
            return querySelectorShadow(cleanSelector(selector), this);
        }
        return originalDocQuerySelector.call(this, selector);
    };
    
    // Override Document.prototype.querySelectorAll
    Document.prototype.querySelectorAll = function(selector) {
        if (needsShadowSearch(selector)) {
            return querySelectorAllShadowOptimized(cleanSelector(selector), this);
        }
        return originalDocQuerySelectorAll.call(this, selector);
    };
})();
