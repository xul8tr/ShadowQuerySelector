/**
 * [Problem]
 * When pages utilize ShadowRoot query selectors cannot query elements
 * inside any ShadowRoot elements.
 *
 * Example Without Fix:
 * URL: edge://flags/
 * Script: document.querySelectorAll('.experiment-select, .experiment-enable-disable');
 * Result: 0
 **/

/**
 * Example With Fix:
 * URL: edge://flags/
 * Script: document.querySelectorAll('.experiment-select, .experiment-enable-disable');
 * Result: > 0
 **/

/**
 * Override native querySelector and querySelectorAll methods for Document and Element
 * This adds :shadow pseudo-selector support for shadow DOM traversal
 **/

(function () {
    /**
     * Enhanced query selector that searches through shadow DOM trees
     * @param {string} selector - CSS selector to search for
     * @param {Element|Document} root - Starting point for the search (default: document)
     * @returns {Element|null} - First matching element or null
     **/
    Document.prototype.querySelectorShadow = function (selector, root = document) {
        // First, try regular querySelector
        let element = root.querySelector(selector);
        if (element)
            return element;

        // If not found, search through shadow roots
        const allElements = root.querySelectorAll('*');

        for (const el of allElements) {
            // Check if element has a shadow root
            if (el.shadowRoot) {
                // Recursively search within the shadow root
                element = this.querySelectorShadow(selector, el.shadowRoot);
                if (element)
                    return element;
            }
        }

        return null;
    }
    Element.prototype.querySelectorShadow = Document.prototype.querySelectorShadow;

    /**
     * Alternative implementation using a more performant tree walker
     * @param {string} selector - CSS selector to search for
     * @param {Element|Document} root - Starting point for the search
     * @returns {Array<Element>} - Array of all matching elements
     **/
    Document.prototype.querySelectorAllShadowOptimized = function (selector, root = document) {
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
    Element.prototype.querySelectorAllShadowOptimized = Document.prototype.querySelectorAllShadowOptimized;

    /**
     * Utility function to find closest ancestor (including shadow DOM boundaries)
     * @param {Element} element - Starting element
     * @param {string} selector - CSS selector to match
     * @returns {Element|null} - Closest matching ancestor or null
     **/
    Document.prototype.closestShadow = function (element, selector) {
        while (element) {
            if (element.matches && element.matches(selector)) {
                return element;
            }

            // Check parent
            element = element.parentElement;

            // If no parent, check if we're in a shadow root
            if (!element && element.getRootNode()instanceof ShadowRoot) {
                element = element.getRootNode().host;
            }
        }

        return null;
    }
    Element.prototype.closestShadow = Document.prototype.closestShadow;

    /**
     * Enhanced query selector all that searches through shadow DOM trees
     * @param {string} selector - CSS selector to search for
     * @param {Element|Document} root - Starting point for the search (default: document)
     * @returns {Array<Element>} - Array of all matching elements
     **/
    Document.prototype.querySelectorAllShadow = function (selector, root = document) {
        const results = [];

        // Add regular querySelectorAll results
        results.push(...root.querySelectorAll(selector));

        // Search through all elements for shadow roots
        const allElements = root.querySelectorAll('*');

        for (const el of allElements) {
            // Check if element has a shadow root
            if (el.shadowRoot) {
                // Recursively search within the shadow root
                results.push(...this.querySelectorAllShadow(selector, el.shadowRoot));
            }
        }

        return results;
    }
    Element.prototype.querySelectorAllShadow = Document.prototype.querySelectorAllShadow;

    // Override Document.prototype.querySelector
    Document.prototype.querySelector = function (selector) {
        return this.querySelectorShadow(selector, this);
    };
    Element.prototype.querySelector = Document.prototype.querySelector;

    // Override Document.prototype.querySelectorAll
    Document.prototype.querySelectorAll = function (selector) {
        return this.querySelectorAllShadowOptimized(selector, this);
    };
    Element.prototype.querySelectorAll = Document.prototype.querySelectorAll;
})();
