// --- CONFIGURATION: CUSTOMIZED SELECTORS FOR YOUR WEBSITE ---
// 1. Selector for the main container of an individual package box
const PACKAGE_CONTAINER_SELECTOR = '.card-templ-wrapper';
// 2. Selector for the element containing the price
const PRICE_SELECTOR = '.card-price .fa-number';
// 3. Selector for the element containing the package size (GB/MB)
const SIZE_SELECTOR = '.card-description h6';
// --- END CONFIGURATION ---

// Farsi/Arabic number mapping for cleanup
const FARSI_NUMERAL_MAP = {
  '۰': 0, '۱': 1, '۲': 2, '۳': 3, '۴': 4,
  '۵': 5, '۶': 6, '۷': 7, '۸': 8, '۹': 9
};

/**
 * Cleans and converts a text string (which might contain Farsi numerals,
 * commas, currency signs, or unit names) into a usable number for PRICE.
 * @param {string} text - The raw text content of the price element.
 * @returns {number} The cleaned numerical value.
 */
function cleanPriceValue(text) {
  if (!text) return 0;

  // 1. Convert Farsi/Arabic numerals to English numerals
  let englishText = text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, function(match) {
    return FARSI_NUMERAL_MAP[match];
  });

  // 2. Remove non-numeric characters (toman, commas)
  let cleanedText = englishText.replace(/[^0-9.]/g, '');

  // 3. Parse and return the number
  return parseFloat(cleanedText) || 0;
}

/**
 * Extracts the size value and converts it to Gigabytes (GB),
 * handling both Megabyte (مگابایت) and Gigabyte (گیگابایت) units.
 * @param {string} text - The raw text content of the size element.
 * @returns {number} The standardized size in GB.
 */
function getSizeInGB(text) {
  if (!text) return 0;

  // 1. Convert Farsi/Arabic numerals to English numerals
  let englishText = text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, function(match) {
    return FARSI_NUMERAL_MAP[match];
  });

  // 2. Extract the numeric part (assumes number comes before the unit)
  const numericMatch = englishText.match(/(\d+\.?\d*)/); 
  const value = numericMatch ? parseFloat(numericMatch[1]) : 0;

  // 3. Determine the unit and scale
  // Check for Megabyte (مگابایت) or common abbreviations
  if (englishText.includes('مگابایت') || englishText.includes('MB') || englishText.includes('مگ')) {
    // Convert MB to GB (1 GB = 1024 MB)
    return value / 1024;
  }
  
  // Assume GB if 'مگابایت' is not present
  return value;
}

/**
 * Calculates the price per unit and injects it into the package box.
 * @param {HTMLElement} packageBox - The main container element for the package.
 */
function processPackage(packageBox) {
  // Check if the parameter has already been added to avoid duplicates
  if (packageBox.querySelector('.price-per-gb-extension')) {
      return;
  }

  const priceElement = packageBox.querySelector(PRICE_SELECTOR);
  const sizeElement = packageBox.querySelector(SIZE_SELECTOR);

  if (!priceElement || !sizeElement) {
    // Skip if we can't find both price and size elements
    console.error('Could not find price or size elements in package box:', packageBox);
    return;
  }

  const price = cleanPriceValue(priceElement.textContent);
  // Use the new function to get standardized size in GB
  const size = getSizeInGB(sizeElement.textContent); 

  if (size === 0 || price === 0) {
    console.warn('Skipping package due to zero price or size:', packageBox);
    return;
  }

  // Calculate the Price per Gigabyte
  const pricePerGB = price / size;
  
  // 1. Round to the nearest integer
  const roundedPricePerGB = Math.round(pricePerGB);
  
  // 2. Format with thousands separator (e.g., 1234 -> 1,234)
  const formattedPricePerGB = roundedPricePerGB.toLocaleString('en-US', {
    maximumFractionDigits: 0
  });

  // Create the new element to display the result
  const newParam = document.createElement('div');
  newParam.className = 'price-per-gb-extension';
  newParam.innerHTML = `
    <span style="font-weight: 600;">ارزش هر گیگابایت:</span>
    <span style="font-weight: 800; color: #007bff; margin-right: 5px;">${formattedPricePerGB}</span>
    تومان
  `;

  // Inject custom styles for the new element
  let style = document.getElementById('price-per-gb-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'price-per-gb-style';
    style.textContent = `
      .price-per-gb-extension {
        text-align: center;
        padding: 10px 0;
        margin-top: 15px;
        border-top: 1px dashed #e0e0e0;
        font-size: 1rem;
        color: #333;
        direction: rtl; /* Ensure correct RTL alignment for Farsi text */
        background-color: #f9f9f9;
        border-radius: 0 0 8px 8px;
      }
      .price-per-gb-extension span:first-child {
          font-size: 0.9rem;
          color: #666;
      }
      /* Inject the new param into the card template (inner wrapper) */
      .card-templ-wrapper > .card-template {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
      }
    `;
    document.head.appendChild(style);
  }

  // Find the inner card-template to ensure the new data sits cleanly inside the styled box
  const cardTemplate = packageBox.querySelector('.card-template');
  if (cardTemplate) {
      // Find the two buy button containers to insert the new element before them
      const buyCredit = cardTemplate.querySelector('.card-buy-credit');
      if (buyCredit) {
        // Insert the new element right before the "خرید از اعتبار" button
        cardTemplate.insertBefore(newParam, buyCredit);
      } else {
        // Fallback: append to the end of the inner template
        cardTemplate.appendChild(newParam);
      }

  } else {
      // Final fallback: append to the main wrapper
      packageBox.appendChild(newParam);
  }
}


/**
 * Main function to observe and process packages.
 */
function observePackages() {
  // Find all package boxes initially
  const packageBoxes = document.querySelectorAll(PACKAGE_CONTAINER_SELECTOR);

  packageBoxes.forEach(processPackage);

  // Use a MutationObserver to watch for dynamically loaded content
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          // Check if the added node is an element node
          if (node.nodeType === 1) {
            // Check if the node matches the package container or contains one
            if (node.matches(PACKAGE_CONTAINER_SELECTOR)) {
              processPackage(node);
            } else {
              node.querySelectorAll(PACKAGE_CONTAINER_SELECTOR).forEach(processPackage);
            }
          }
        });
      }
    });
  });

  // Start observing the body for changes (packages being added)
  observer.observe(document.body, { childList: true, subtree: true });
}

// Run the main observation function after the DOM is fully loaded
window.addEventListener('load', observePackages);

