// --- CONFIGURATION: CUSTOMIZED SELECTORS FOR YOUR WEBSITE ---
// IMPORTANT: Since the site updated, verify these classes via "Inspect Element" in Chrome.
// 1. Selector for the main container of an individual package box
const PACKAGE_CONTAINER_SELECTOR = '.card-templ-wrapper';
// 2. Selector for the element containing the price
const PRICE_SELECTOR = '.card-price .fa-number';
// 3. Selector for the element containing the package size (GB/MB)
const SIZE_SELECTOR = '.card-description h6';
// --- END CONFIGURATION ---

const FARSI_NUMERAL_MAP = {
  '۰': 0, '۱': 1, '۲': 2, '۳': 3, '۴': 4,
  '۵': 5, '۶': 6, '۷': 7, '۸': 8, '۹': 9
};

/**
 * Helper to convert Farsi/Arabic string to English numeric string
 */
function toEnglishDigits(str) {
  if (!str) return '';
  return str.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, function(match) {
    return FARSI_NUMERAL_MAP[match];
  });
}

/**
 * Cleans and converts a text string into a usable number for PRICE.
 */
function cleanPriceValue(text) {
  if (!text) return 0;
  let englishText = toEnglishDigits(text);
  // Remove non-numeric characters except dots (for potential decimals, though usually price is int)
  let cleanedText = englishText.replace(/[^0-9.]/g, '');
  return parseFloat(cleanedText) || 0;
}

/**
 * Extracts the size value and converts it to Gigabytes (GB).
 * UPDATED: Uses Regex to specifically find the number associated with MB/GB
 * to avoid capturing the "duration" (e.g., "7 Days") by mistake.
 */
function getSizeInGB(text) {
  if (!text) return 0;

  // 1. Convert numerals to English
  let englishText = toEnglishDigits(text);

  // 2. Define Regex to capture (Number) followed immediately by (Unit)
  // \s* matches zero or more spaces
  // (?:...) is a non-capturing group for the alternatives
  const gbRegex = /([\d.]+)\s*(گیگ|gig|gb)/i;
  const mbRegex = /([\d.]+)\s*(مگ|meg|mb)/i;

  // 3. Check for GB first
  let gbMatch = englishText.match(gbRegex);
  if (gbMatch) {
    return parseFloat(gbMatch[1]);
  }

  // 4. Check for MB
  let mbMatch = englishText.match(mbRegex);
  if (mbMatch) {
    return parseFloat(mbMatch[1]) / 1024;
  }

  // 5. Fallback: If no unit is found, try to parse the last number in the string
  // (Assuming format is "Duration ... Size")
  const allNumbers = englishText.match(/(\d+\.?\d*)/g);
  if (allNumbers && allNumbers.length > 0) {
      // Take the last number found, hoping it's the size
      const val = parseFloat(allNumbers[allNumbers.length - 1]);
      // Heuristic: If value is > 100, assume MB, otherwise GB (Risky, but a fallback)
      return val > 100 ? val / 1024 : val;
  }

  return 0;
}

/**
 * Calculates the price per unit and injects it into the package box.
 */
function processPackage(packageBox) {
  // Prevent duplicate insertion
  if (packageBox.querySelector('.price-per-gb-extension')) {
      return;
  }

  const priceElement = packageBox.querySelector(PRICE_SELECTOR);
  const sizeElement = packageBox.querySelector(SIZE_SELECTOR);

  if (!priceElement || !sizeElement) {
    return;
  }

  const priceRaw = priceElement.textContent;
  const sizeRaw = sizeElement.textContent;

  const price = cleanPriceValue(priceRaw);
  const size = getSizeInGB(sizeRaw);

  // Debugging: Uncomment line below to check values in Console (F12) if calculation is wrong
  // console.log(`Raw: "${sizeRaw}" | Parsed GB: ${size} | Price: ${price}`);

  if (size <= 0 || price <= 0) {
    return;
  }

  // Calculate Price per Gigabyte
  const pricePerGB = price / size;
  
  // Format the output
  const roundedPricePerGB = Math.round(pricePerGB);
  const formattedPricePerGB = roundedPricePerGB.toLocaleString('en-US', {
    maximumFractionDigits: 0
  });

  // UI Element Creation
  const newParam = document.createElement('div');
  newParam.className = 'price-per-gb-extension';
  newParam.innerHTML = `
    <span style="font-weight: 600;">هر گیگ:</span>
    <span style="font-weight: 800; color: #007bff; margin-right: 5px;">${formattedPricePerGB}</span>
    تومان
  `;

  // Inject Styles
  let style = document.getElementById('price-per-gb-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'price-per-gb-style';
    style.textContent = `
      .price-per-gb-extension {
        text-align: center;
        padding: 8px 0;
        margin-top: 10px;
        border-top: 1px dashed #ddd;
        font-size: 0.95rem;
        color: #333;
        direction: rtl;
        background-color: #fafafa;
        border-radius: 0 0 8px 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 5px;
      }
      .card-templ-wrapper > .card-template {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
    `;
    document.head.appendChild(style);
  }

  // Insertion Logic
  const cardTemplate = packageBox.querySelector('.card-template');
  if (cardTemplate) {
      const buyCredit = cardTemplate.querySelector('.card-buy-credit');
      if (buyCredit) {
        cardTemplate.insertBefore(newParam, buyCredit);
      } else {
        cardTemplate.appendChild(newParam);
      }
  } else {
      packageBox.appendChild(newParam);
  }
}

/**
 * Main Observer
 */
function observePackages() {
  const packageBoxes = document.querySelectorAll(PACKAGE_CONTAINER_SELECTOR);
  packageBoxes.forEach(processPackage);

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
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

  observer.observe(document.body, { childList: true, subtree: true });
}

window.addEventListener('load', observePackages);
