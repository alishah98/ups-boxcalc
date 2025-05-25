// Box definitions
const boxSizes = [
  { name: "6C", dimensions: [6, 6, 6] },
  { name: "8C", dimensions: [8, 8, 8] },
  { name: "10C", dimensions: [10, 10, 10] },
  { name: "12C", dimensions: [12, 12, 12] },
  { name: "14C", dimensions: [14, 14, 14] },
  { name: "16C", dimensions: [16, 16, 16] },
  { name: "18C", dimensions: [18, 18, 18] },
  { name: "20C", dimensions: [20, 20, 20] },
  { name: "22C", dimensions: [22, 22, 22] },
  { name: "24C", dimensions: [24, 24, 24] },
  { name: "25.75C", dimensions: [25.75, 25.75, 25.75] },
  { name: "12126", dimensions: [12, 12, 6] },
  { name: "16164 UPS", dimensions: [16, 16, 4] },
  { name: "J-10", dimensions: [9, 7, 4] },
  { name: "J-12", dimensions: [10, 7, 5] },
  { name: "J-15", dimensions: [14, 11, 6] },
  { name: "17118 UPS", dimensions: [17, 11, 8] },
  { name: "J-22", dimensions: [20, 15, 9] },
  { name: "J-57", dimensions: [26, 18, 13] },
  { name: "151210 UPS", dimensions: [15, 12, 10] },
  { name: "201212 UPS", dimensions: [20, 12, 12] },
  { name: "84C", dimensions: [24, 13, 16] },
  { name: "202012 UPS", dimensions: [20, 20, 12] },
  { name: "MED WREATH", dimensions: [20, 6, 20] },
  { name: "24186 UPS", dimensions: [24, 18, 6] },
  { name: "LG WREATH", dimensions: [24, 6, 24] },
  { name: "30246 UPS", dimensions: [30, 24, 6] },
  { name: "30 MIRROR", dimensions: [30, 6, 30] },
  { name: "42 MIRROR", dimensions: [42, 6, 36] },
  { name: "48 MIRROR", dimensions: [48, 5, 36] },
  { name: "UPS-1", dimensions: [20, 20, 25] },
  { name: "UPS-2", dimensions: [24, 17, 24] },
  { name: "UPS-3", dimensions: [33, 18, 18] },
  { name: "UPS-4", dimensions: [22, 18, 12] },
  { name: "UMBRELLA-4", dimensions: [4, 4, 60] },
  { name: "SKI HALF", dimensions: [9, 6, 38] },
  { name: "SKI BOTH", dimensions: [9, 6, 84] },
  { name: "6648", dimensions: [6, 6, 48] },
  { name: "LAMP", dimensions: [13, 13, 40] },
  { name: "151548 UPS", dimensions: [15, 15, 48] },
  { name: "TV DW", dimensions: [27, 20, 18] },
  { name: "VCR DW", dimensions: [20, 20, 12] },
  { name: "SUITCASE", dimensions: [24, 10, 31] },
  { name: "GUITAR", dimensions: [20, 8, 50] },
  { name: "GOLF BOX", dimensions: [14, 14, 53] },
  { name: "241818UPS", dimensions: [24, 18, 18] },
  { name: "242416 UPS", dimensions: [24, 24, 16] },
  { name: "WARDROBE", dimensions: [24, 21, 46] },
  { name: "BB-130", dimensions: [34, 22, 24] },
  { name: "SNOWBOARD", dimensions: [8, 16, 65] },
  { name: "BIKE", dimensions: [54.5, 7.75, 27.5] },
  { name: "SHIRT B", dimensions: [18, 14, 4] },
  { name: "CHAIR", dimensions: [30, 29, 34] }
];

// Function to validate box definitions
function validateBoxDefinitions(boxes) {
  return boxes.every(box => 
    box.name && 
    Array.isArray(box.dimensions) && 
    box.dimensions.length === 3 && 
    box.dimensions.every(dim => typeof dim === 'number' && dim > 0)
  );
}

// Function to save box definitions to localStorage
function saveBoxDefinitions(boxes) {
  if (validateBoxDefinitions(boxes)) {
    localStorage.setItem('boxDefinitions', JSON.stringify(boxes));
    return true;
  }
  return false;
}

// Function to load box definitions from localStorage
function loadBoxDefinitions() {
  const savedBoxes = localStorage.getItem('boxDefinitions');
  if (savedBoxes) {
    const boxes = JSON.parse(savedBoxes);
    if (validateBoxDefinitions(boxes)) {
      return boxes;
    }
  }
  return boxSizes; // Return default boxes if no valid saved boxes
}

// Export functions and default box definitions
export { boxSizes, saveBoxDefinitions, loadBoxDefinitions, validateBoxDefinitions }; 