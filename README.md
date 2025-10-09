# **📊 Price Per GB Value Extension**

## **Value Calculator for Internet Packages**

This simple, single-script browser extension is designed to help users quickly and accurately compare the true value of data packages offered by internet service providers (ISPs).

Since packages often vary greatly in total price and size, this extension standardizes the comparison by calculating and displaying the **Price per Gigabyte (GB)** directly within each package card on the website.

## **🛠️ Getting Started**

### **1\. Clone the Repository**

First, clone the repository files to your local machine.

```
git clone https://github.com/amirkazemzade/ShatelMobilePricePerGB.git
```

### **2\. File Structure**

The cloned repository contains the following structure:

ShatelMobilePricePerGB/  
├── manifest.json  
└── content.js

### **3\. Configuration (Editing content.js)**

**This is the most critical step.** Before loading, you must ensure the CSS selectors in content.js match the structure of your provider's website.

The current file is configured based on the HTML provided in our chat:

// content.js configuration snippet  
const PACKAGE\_CONTAINER\_SELECTOR \= '.card-templ-wrapper';  
const PRICE\_SELECTOR \= '.card-price .fa-number';  
const SIZE\_SELECTOR \= '.card-description h6';

If the extension fails to display the value, you may need to **update these three selectors** by inspecting the elements on the target webpage.

### **4\. Installation**

#### **A. Chrome / Microsoft Edge / Brave (Chromium-based)**

1. Open your browser and navigate to the extensions management page: chrome://extensions/  
2. Enable **Developer mode** using the toggle switch in the top-right corner.  
3. Click the **Load unpacked** button.  
4. Select the **ShatelMobilePricePerGB** folder created after cloning.  
5. The extension will now be active. Navigate to your ISP's packages page and refresh to see the new metric\!

#### **B. Mozilla Firefox**

1. Open your browser and navigate to the debugging page: about:debugging\#/runtime/this-firefox  
2. Click the **Load Temporary Add-on...** button.  
3. Navigate into the **ShatelMobilePricePerGB** folder and select the manifest.json file.  
4. The extension will load immediately. (Note: Firefox unloads temporary extensions when the browser closes, but it's great for testing.)
