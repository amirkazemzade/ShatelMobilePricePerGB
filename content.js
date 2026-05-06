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
  
  const gbRegex = /([\d.]+)\s*(گیگ|گیگابایت|gig|gb)/i;
  const mbRegex = /([\d.]+)\s*(مگ|مگابایت|meg|mb)/i;

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
 
  if (packageBox.getAttribute('data-pack-type') === 'voice' ||
      packageBox.getAttribute('data-type-filter') === 'voice') {
    return;
  }

  const priceElement = packageBox.querySelector(PRICE_SELECTOR);
  const sizeElement = packageBox.querySelector(SIZE_SELECTOR);

  if (!priceElement || !sizeElement) return;

  const price = cleanPriceValue(priceElement.textContent);
  const size = getSizeInGB(sizeElement.textContent);

  if (size <= 0 || price <= 0) return;

  const pricePerGB = price / size;
  packageBox.setAttribute('data-ppg', pricePerGB); 

  const formattedPricePerGB = Math.round(pricePerGB).toLocaleString('en-US');

  const newParam = document.createElement('div');
  newParam.className = 'price-per-gb-extension';
  newParam.innerHTML = `
    <span style="font-weight: 600;">هر گیگ:</span>
    <span style="font-weight: 800; color: #007bff; margin-right: 5px;">${formattedPricePerGB}</span>
    تومان
  `;

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

function sortPackagesByValue() {
  let sortedCount = 0;

  // 1. Sort swiper carousels (best-seller section)
  const swiperWrappers = document.querySelectorAll('.swiper-wrapper');
  swiperWrappers.forEach(wrapper => {
    const slides = Array.from(wrapper.children).filter(child => 
      child.classList.contains('swiper-slide') && 
      child.querySelector(PACKAGE_CONTAINER_SELECTOR)
    );

    if (slides.length > 0) {
      slides.sort((a, b) => {
        const pkgA = a.querySelector(PACKAGE_CONTAINER_SELECTOR);
        const pkgB = b.querySelector(PACKAGE_CONTAINER_SELECTOR);
        const ppgA = parseFloat(pkgA?.getAttribute('data-ppg')) || 99999999;
        const ppgB = parseFloat(pkgB?.getAttribute('data-ppg')) || 99999999;
        return ppgA - ppgB;
      });

      slides.forEach(slide => wrapper.appendChild(slide));
      sortedCount += slides.length;
    }
  });

  // 2. Sort grid layout (#package-card-list)
  const gridContainer = document.getElementById('package-card-list');
  if (gridContainer) {
    const packages = Array.from(gridContainer.querySelectorAll(PACKAGE_CONTAINER_SELECTOR));
    
    if (packages.length > 0) {
      packages.sort((a, b) => {
        const ppgA = parseFloat(a.getAttribute('data-ppg')) || 99999999;
        const ppgB = parseFloat(b.getAttribute('data-ppg')) || 99999999;
        return ppgA - ppgB;
      });

      packages.forEach(pkg => gridContainer.appendChild(pkg));
      sortedCount += packages.length;
    }
  }

  const btn = document.getElementById('ppg-sort-btn');
  if(btn) {
      const originalText = btn.textContent;
      btn.textContent = `مرتب شد! (${sortedCount} sorted)`;
      setTimeout(() => btn.textContent = originalText, 2000);
  }
}

function addSortButton() {
  if (document.getElementById('ppg-sort-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'ppg-sort-btn';
  btn.textContent = "Sort by Value (ارزان‌ترین)";
  btn.onclick = sortPackagesByValue;
  document.body.appendChild(btn);
}

function observePackages() {
  const processAllPackages = () => {
    const packageBoxes = document.querySelectorAll(PACKAGE_CONTAINER_SELECTOR);
    packageBoxes.forEach(processPackage);
    addSortButton();
  };

  processAllPackages();

  const observer = new MutationObserver(function(mutations) {
    let shouldProcess = false;
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldProcess = true;
      }
    });
    if (shouldProcess) {
      processAllPackages();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observePackages);
} else {
  observePackages();
}

window.addEventListener('load', observePackages);
