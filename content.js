// --- CONFIGURATION: CUSTOMIZED SELECTORS FOR YOUR WEBSITE ---
const PACKAGE_CONTAINER_SELECTOR = '.card-templ-wrapper';
const PRICE_SELECTOR = '.card-price .fa-number';
const SIZE_SELECTOR = '.card-description h6';
// --- END CONFIGURATION ---

const FARSI_NUMERAL_MAP = {
  '۰': 0, '۱': 1, '۲': 2, '۳': 3, '۴': 4,
  '۵': 5, '۶': 6, '۷': 7, '۸': 8, '۹': 9
};

function toEnglishDigits(str) {
  if (!str) return '';
  return str.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, function(match) {
    return FARSI_NUMERAL_MAP[match];
  });
}

function cleanPriceValue(text) {
  if (!text) return 0;
  let englishText = toEnglishDigits(text);
  let cleanedText = englishText.replace(/[^0-9.]/g, '');
  return parseFloat(cleanedText) || 0;
}

function getSizeInGB(text) {
  if (!text) return 0;
  let englishText = toEnglishDigits(text);
  
  // Regex to find number attached to unit (GB/MB)
  const gbRegex = /([\d.]+)\s*(گیگ|gig|gb)/i;
  const mbRegex = /([\d.]+)\s*(مگ|meg|mb)/i;

  let gbMatch = englishText.match(gbRegex);
  if (gbMatch) return parseFloat(gbMatch[1]);

  let mbMatch = englishText.match(mbRegex);
  if (mbMatch) return parseFloat(mbMatch[1]) / 1024;

  const allNumbers = englishText.match(/(\d+\.?\d*)/g);
  if (allNumbers && allNumbers.length > 0) {
      const val = parseFloat(allNumbers[allNumbers.length - 1]);
      return val > 100 ? val / 1024 : val;
  }
  return 0;
}

function processPackage(packageBox) {
  if (packageBox.querySelector('.price-per-gb-extension')) return;

  const priceElement = packageBox.querySelector(PRICE_SELECTOR);
  const sizeElement = packageBox.querySelector(SIZE_SELECTOR);

  if (!priceElement || !sizeElement) return;

  const price = cleanPriceValue(priceElement.textContent);
  const size = getSizeInGB(sizeElement.textContent);

  if (size <= 0 || price <= 0) return;

  const pricePerGB = price / size;
  
  // --- NEW: Store the value on the element for sorting later ---
  packageBox.setAttribute('data-ppg', pricePerGB); 

  const formattedPricePerGB = Math.round(pricePerGB).toLocaleString('en-US');

  const newParam = document.createElement('div');
  newParam.className = 'price-per-gb-extension';
  newParam.innerHTML = `
    <span style="font-weight: 600;">هر گیگ:</span>
    <span style="font-weight: 800; color: #007bff; margin-right: 5px;">${formattedPricePerGB}</span>
    تومان
  `;

  // Inject styles if not present
  if (!document.getElementById('price-per-gb-style')) {
    const style = document.createElement('style');
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
      /* Sort Button Style */
      #ppg-sort-btn {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 9999;
        padding: 12px 20px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 50px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: inherit;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s, background-color 0.2s;
      }
      #ppg-sort-btn:hover {
        background-color: #0056b3;
        transform: scale(1.05);
      }
      #ppg-sort-btn:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);
  }

  const cardTemplate = packageBox.querySelector('.card-template');
  if (cardTemplate) {
      const buyCredit = cardTemplate.querySelector('.card-buy-credit');
      if (buyCredit) cardTemplate.insertBefore(newParam, buyCredit);
      else cardTemplate.appendChild(newParam);
  } else {
      packageBox.appendChild(newParam);
  }
}

/**
 * --- NEW: Function to Sort Packages ---
 */
function sortPackagesByValue() {
  // 1. Identify all parent containers that hold packages
  // We do this by finding all packages, then getting their unique parents
  const allPackages = document.querySelectorAll(PACKAGE_CONTAINER_SELECTOR);
  const parents = new Set();
  
  allPackages.forEach(pkg => {
    if (pkg.parentElement) {
      parents.add(pkg.parentElement);
    }
  });

  // 2. Sort children within each parent
  parents.forEach(parent => {
    // Get only the children that are actually package boxes
    const children = Array.from(parent.children).filter(child => 
      child.matches(PACKAGE_CONTAINER_SELECTOR)
    );

    // Sort based on the 'data-ppg' attribute we added earlier
    children.sort((a, b) => {
      const ppgA = parseFloat(a.getAttribute('data-ppg')) || 99999999; // Default to high if missing
      const ppgB = parseFloat(b.getAttribute('data-ppg')) || 99999999;
      return ppgA - ppgB; // Ascending order (Cheapest first)
    });

    // Re-append in correct order
    children.forEach(child => parent.appendChild(child));
  });

  // Visual feedback
  const btn = document.getElementById('ppg-sort-btn');
  if(btn) {
      const originalText = btn.textContent;
      btn.textContent = "مرتب شد! (Sorted)";
      setTimeout(() => btn.textContent = originalText, 2000);
  }
}

/**
 * --- NEW: Add Floating Button ---
 */
function addSortButton() {
  if (document.getElementById('ppg-sort-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'ppg-sort-btn';
  btn.textContent = "Sort by Value (ارزان‌ترین)";
  btn.onclick = sortPackagesByValue;
  document.body.appendChild(btn);
}

function observePackages() {
  const packageBoxes = document.querySelectorAll(PACKAGE_CONTAINER_SELECTOR);
  packageBoxes.forEach(processPackage);
  
  // Add the button once initially
  addSortButton();

  const observer = new MutationObserver(function(mutations) {
    let shouldAddButton = false;
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.matches(PACKAGE_CONTAINER_SELECTOR)) {
              processPackage(node);
            } else {
              node.querySelectorAll(PACKAGE_CONTAINER_SELECTOR).forEach(processPackage);
            }
            shouldAddButton = true;
          }
        });
      }
    });
    // Ensure button exists if new content loaded completely wiped the body
    if (shouldAddButton) addSortButton();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

window.addEventListener('load', observePackages);
