/**
 * PantryCRM UI Touch Target Validation Script
 * 
 * This script validates that all interactive UI elements meet the 44px minimum touch target requirement.
 * It can be run in the browser console when viewing the contacts page.
 */

(function() {
    console.log('===== PantryCRM Touch Target Validation =====');
    console.log('Validating UI elements for 44px minimum touch targets...');
    
    // Configuration
    const MIN_TOUCH_TARGET = 44; // Minimum size in pixels
    const ELEMENTS_TO_CHECK = [
        'button',
        'a',
        'input',
        'select',
        'textarea',
        '.interactive',
        '[role="button"]',
        '[role="link"]',
        '[role="checkbox"]',
        '[role="radio"]',
        '[role="switch"]',
        '[role="tab"]',
        '[role="menuitem"]',
        '.button-touch',
        '.touch-target'
    ];
    
    // Results storage
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        elements: []
    };
    
    // Helper function to check if element is visible
    function isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    }
    
    // Check a single element
    function checkElement(element) {
        const rect = element.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const passed = width >= MIN_TOUCH_TARGET && height >= MIN_TOUCH_TARGET;
        
        results.total++;
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
        
        results.elements.push({
            element: element.tagName + (element.id ? '#' + element.id : '') + 
                     (element.className ? '.' + element.className.replace(/\s+/g, '.') : ''),
            width: Math.round(width),
            height: Math.round(height),
            passed: passed
        });
        
        // Highlight failing elements in red for visual inspection
        if (!passed) {
            element.style.outline = '2px solid red';
            element.setAttribute('data-touch-validation', 'failed');
            console.warn(`Touch target too small: ${element.tagName}${element.id ? '#' + element.id : ''} - ${Math.round(width)}x${Math.round(height)}px`);
        }
    }
    
    // Run the validation
    function runValidation() {
        // Reset results
        results.total = 0;
        results.passed = 0;
        results.failed = 0;
        results.elements = [];
        
        // Remove previous validation markers
        document.querySelectorAll('[data-touch-validation]').forEach(el => {
            el.style.outline = '';
            el.removeAttribute('data-touch-validation');
        });
        
        // Check all specified elements
        ELEMENTS_TO_CHECK.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                if (isVisible(element)) {
                    checkElement(element);
                }
            });
        });
        
        // Print summary
        console.log(`===== Touch Target Validation Results =====`);
        console.log(`Total elements checked: ${results.total}`);
        console.log(`Passed: ${results.passed} (${Math.round(results.passed/results.total*100)}%)`);
        console.log(`Failed: ${results.failed} (${Math.round(results.failed/results.total*100)}%)`);
        
        // Print detailed results for failing elements
        if (results.failed > 0) {
            console.log(`===== Failed Elements =====`);
            results.elements.filter(e => !e.passed).forEach(e => {
                console.log(`${e.element}: ${e.width}x${e.height}px`);
            });
        }
        
        return results;
    }
    
    // Add validation button to the page for easy re-running
    function addValidationButton() {
        const button = document.createElement('button');
        button.textContent = 'Validate Touch Targets';
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '9999';
        button.style.padding = '12px 24px';
        button.style.backgroundColor = '#3b82f6';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '8px';
        button.style.cursor = 'pointer';
        button.style.minHeight = '48px';
        button.style.minWidth = '48px';
        button.addEventListener('click', runValidation);
        document.body.appendChild(button);
    }
    
    // Run initial validation
    const initialResults = runValidation();
    
    // Add button for re-running validation
    addValidationButton();
    
    // Return results
    return initialResults;
})();