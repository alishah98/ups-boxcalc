import { boxSizes, saveBoxDefinitions, loadBoxDefinitions, validateBoxDefinitions } from './boxDefinitions.js';

// GitHub Configuration
const GITHUB_CONFIG = {
  gistId: localStorage.getItem('boxDefinitionsGistId') || null,
  token: localStorage.getItem('githubToken') || null
};

let currentBoxSizes = loadBoxDefinitions();

const recommendButton = document.getElementById("recommend-button");
const cushion0Button = document.getElementById("cushion-0");
const cushion2Button = document.getElementById("cushion-2");
const cushion4Button = document.getElementById("cushion-4");
const cushion6Button = document.getElementById("cushion-6");
const lengthInput = document.getElementById("length");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const outputSection = document.getElementById("output");
const resetButton = document.getElementById("reset-button");
const fileInput = document.getElementById("box-file-input");
const uploadButton = document.getElementById("upload-button");
const downloadJsonButton = document.getElementById("download-json");
const downloadCsvButton = document.getElementById("download-csv");
const downloadXlsxButton = document.getElementById("download-xlsx");
const saveGithubButton = document.getElementById("save-github");
const loadGithubButton = document.getElementById("load-github");
const githubStatus = document.getElementById("github-status");

const getClosestBox = (length, width, height) => {
  if (!Array.isArray(currentBoxSizes) || currentBoxSizes.length === 0) {
    console.warn("currentBoxSizes is empty or invalid.");
    return null;
  }

  let closestBox = null;
  let smallestDifference = Number.MAX_VALUE;

  for (const box of currentBoxSizes) {
    const sortedInput = [length, width, height].sort((a, b) => b - a);
    const sortedBox = box.dimensions.sort((a, b) => b - a);

    if (
      sortedBox[0] >= sortedInput[0] &&
      sortedBox[1] >= sortedInput[1] &&
      sortedBox[2] >= sortedInput[2]
    ) {
      const difference =
        Math.abs(sortedBox[0] - sortedInput[0]) +
        Math.abs(sortedBox[1] - sortedInput[1]) +
        Math.abs(sortedBox[2] - sortedInput[2]);
      if (difference < smallestDifference) {
        closestBox = box;
        smallestDifference = difference;
      }
    }
  }

  return closestBox;
};

const recommend = () => {
  const MAX_DIMENSION_VALUE = 1000; // Consistent with validateBoxDefinitions

  const lengthStr = lengthInput.value;
  const widthStr = widthInput.value;
  const heightStr = heightInput.value;

  let length, width, height;

  // Validate Length
  if (lengthStr.trim() === '') {
    outputSection.innerHTML = "Invalid input: Length cannot be empty.";
    return;
  }
  length = parseFloat(lengthStr);
  if (isNaN(length)) {
    outputSection.innerHTML = "Invalid input: Length must be a number.";
    return;
  }
  if (length <= 0) {
    outputSection.innerHTML = "Invalid input: Length must be a positive number.";
    return;
  }
  if (length > MAX_DIMENSION_VALUE) {
    outputSection.innerHTML = `Invalid input: Length must be less than or equal to ${MAX_DIMENSION_VALUE}.`;
    return;
  }

  // Validate Width
  if (widthStr.trim() === '') {
    outputSection.innerHTML = "Invalid input: Width cannot be empty.";
    return;
  }
  width = parseFloat(widthStr);
  if (isNaN(width)) {
    outputSection.innerHTML = "Invalid input: Width must be a number.";
    return;
  }
  if (width <= 0) {
    outputSection.innerHTML = "Invalid input: Width must be a positive number.";
    return;
  }
  if (width > MAX_DIMENSION_VALUE) {
    outputSection.innerHTML = `Invalid input: Width must be less than or equal to ${MAX_DIMENSION_VALUE}.`;
    return;
  }

  // Validate Height
  if (heightStr.trim() === '') {
    outputSection.innerHTML = "Invalid input: Height cannot be empty.";
    return;
  }
  height = parseFloat(heightStr);
  if (isNaN(height)) {
    outputSection.innerHTML = "Invalid input: Height must be a number.";
    return;
  }
  if (height <= 0) {
    outputSection.innerHTML = "Invalid input: Height must be a positive number.";
    return;
  }
  if (height > MAX_DIMENSION_VALUE) {
    outputSection.innerHTML = `Invalid input: Height must be less than or equal to ${MAX_DIMENSION_VALUE}.`;
    return;
  }

  // If all inputs are valid, add cushion and proceed
  const finalLength = length + cushion;
  const finalWidth = width + cushion;
  const finalHeight = height + cushion;

  const closestBox = getClosestBox(finalLength, finalWidth, finalHeight);

  if (closestBox === null) {
    outputSection.innerHTML = "No suitable box available.";
  } else {
    outputSection.innerHTML = `The closest box available is: 
    <br>${closestBox.name} (${closestBox.dimensions.join("x")})
    <br><small style="font-weight: normal; font-style: italic;font-size: 14px">(with ${cushion} inches of cushion)</small>`;
  }
};

const reset = () => {
  cushion = 0;
  lengthInput.value = "";
  widthInput.value = "";
  heightInput.value = "";
  outputSection.innerHTML = "";
};

const parseFileContent = async (file) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        let boxes = [];
        
        switch (fileExtension) {
          case 'json':
            boxes = JSON.parse(e.target.result);
            break;
            
          case 'csv': {
            const lines = e.target.result.split('\n');
            if (lines.length === 0) {
              throw new Error('CSV file is empty.');
            }

            const headerLine = lines[0].trim();
            const rawHeaders = headerLine.split(',').map(h => h.trim().toLowerCase());
            
            const columnAliases = {
              name: ['name', 'box name', 'id'],
              length: ['length', 'len', 'l'],
              width: ['width', 'wid', 'w'],
              height: ['height', 'hgt', 'h']
            };

            const essentialColumns = ['name', 'length', 'width', 'height'];
            const headerMap = {}; // Stores { canonicalName: index }

            for (const canonicalName of essentialColumns) {
              let found = false;
              for (const alias of columnAliases[canonicalName]) {
                const index = rawHeaders.indexOf(alias);
                if (index !== -1) {
                  headerMap[canonicalName] = index;
                  found = true;
                  break;
                }
              }
              if (!found) {
                throw new Error(`Invalid CSV: Missing required column for '${canonicalName}'. Expected one of: ${columnAliases[canonicalName].join(', ')}`);
              }
            }

            boxes = lines.slice(1).map((line, rowIndex) => {
              const values = line.split(',').map(v => v.trim());
              if (values.length < Math.max(...Object.values(headerMap)) + 1 && line.trim() === '') {
                // Allow empty lines at the end, but warn for malformed lines
                if (line.trim() !== '') {
                    console.warn(`Skipping CSV row ${rowIndex + 2}: Malformed row, too few columns.`);
                }
                return null; 
              }


              const name = values[headerMap.name];
              const lengthStr = values[headerMap.length];
              const widthStr = values[headerMap.width];
              const heightStr = values[headerMap.height];

              if (!name) {
                console.warn(`Skipping CSV row ${rowIndex + 2}: 'Name' is missing.`);
                return null;
              }

              const length = parseFloat(lengthStr);
              const width = parseFloat(widthStr);
              const height = parseFloat(heightStr);

              if (isNaN(length) || isNaN(width) || isNaN(height) || length <= 0 || width <= 0 || height <= 0) {
                console.warn(`Skipping CSV row ${rowIndex + 2} (Name: ${name}): Invalid or non-positive dimension(s). L: ${lengthStr}, W: ${widthStr}, H: ${heightStr}`);
                return null;
              }
              
              return { name, dimensions: [length, width, height] };
            }).filter(box => box !== null);
            break;
          }
            
          case 'xlsx': {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
              throw new Error('XLSX file contains no sheets.');
            }
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const columnAliases = {
              name: ['Name', 'name', 'Box Name', 'ID', 'id'],
              length: ['Length', 'length', 'Dim L', 'L', 'len'],
              width: ['Width', 'width', 'Dim W', 'W', 'wid'],
              height: ['Height', 'height', 'Dim H', 'H', 'hgt']
            };
            const essentialColumns = ['name', 'length', 'width', 'height'];

            const findValueByAliases = (row, aliases) => {
              for (const alias of aliases) {
                if (row[alias] !== undefined) {
                  return row[alias];
                }
              }
              return undefined;
            };

            boxes = jsonData.map((row, rowIndex) => {
              const nameValue = findValueByAliases(row, columnAliases.name);
              const lengthValue = findValueByAliases(row, columnAliases.length);
              const widthValue = findValueByAliases(row, columnAliases.width);
              const heightValue = findValueByAliases(row, columnAliases.height);

              const name = typeof nameValue === 'string' ? nameValue.trim() : (nameValue !== undefined ? String(nameValue) : undefined);
              
              if (!name) {
                console.warn(`Skipping XLSX row ${rowIndex + 1}: 'Name' is missing or invalid.`);
                return null;
              }

              // Check if any essential dimension column was not found *at all*
              if (lengthValue === undefined || widthValue === undefined || heightValue === undefined) {
                 console.warn(`Skipping XLSX row ${rowIndex + 1} (Name: ${name}): One or more dimension columns (Length, Width, Height) are missing.`);
                 return null;
              }

              const length = parseFloat(lengthValue);
              const width = parseFloat(widthValue);
              const height = parseFloat(heightValue);

              if (isNaN(length) || isNaN(width) || isNaN(height) || length <= 0 || width <= 0 || height <= 0) {
                console.warn(`Skipping XLSX row ${rowIndex + 1} (Name: ${name}): Invalid or non-positive dimension(s). L: ${lengthValue}, W: ${widthValue}, H: ${heightValue}`);
                return null;
              }
              
              return { name, dimensions: [length, width, height] };
            }).filter(box => box !== null);
            break;
          }
            
          default:
            throw new Error('Unsupported file format');
        }
        
        resolve(boxes);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    
    if (fileExtension === 'xlsx') {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  });
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const boxes = await parseFileContent(file);
    if (validateBoxDefinitions(boxes)) {
      currentBoxSizes = boxes;
      saveBoxDefinitions(boxes);
      alert('Box definitions updated successfully!');
    } else {
      alert('Invalid box definitions format. Please check your file.');
    }
  } catch (error) {
    alert('Error reading file: ' + error.message);
  }
};

const downloadAsJson = () => {
  const dataStr = JSON.stringify(currentBoxSizes, null, 2);
  downloadFile(dataStr, 'box-definitions.json', 'application/json');
};

const downloadAsCsv = () => {
  const headers = 'Name,Length,Width,Height\n';
  const csvContent = currentBoxSizes.map(box => 
    `${box.name},${box.dimensions.join(',')}`
  ).join('\n');
  downloadFile(headers + csvContent, 'box-definitions.csv', 'text/csv');
};

const downloadAsXlsx = () => {
  const worksheet = XLSX.utils.json_to_sheet(
    currentBoxSizes.map(box => ({
      Name: box.name,
      Length: box.dimensions[0],
      Width: box.dimensions[1],
      Height: box.dimensions[2]
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Box Definitions');
  XLSX.writeFile(workbook, 'box-definitions.xlsx');
};

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const saveToGithub = async () => {
  if (!GITHUB_CONFIG.token) {
    const token = prompt('Please enter your GitHub Personal Access Token:');
    if (!token) return;
    GITHUB_CONFIG.token = token;
    localStorage.setItem('githubToken', token);
  }

  try {
    githubStatus.textContent = 'Saving to GitHub...';
    const content = JSON.stringify(currentBoxSizes, null, 2);
    
    const headers = {
      'Authorization': `token ${GITHUB_CONFIG.token}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    let response;
    if (GITHUB_CONFIG.gistId) {
      // Update existing gist
      response = await fetch(`https://api.github.com/gists/${GITHUB_CONFIG.gistId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          files: {
            'box-definitions.json': {
              content
            }
          }
        })
      });
    } else {
      // Create new gist
      response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          description: 'Box Definitions for Box Calculator',
          public: false,
          files: {
            'box-definitions.json': {
              content
            }
          }
        })
      });
    }

    // Try to parse response even if not ok, as GitHub often provides error details in JSON
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If response is not JSON, data will remain undefined
      console.warn('Could not parse GitHub API response as JSON.', e);
    }

    if (response.ok) {
      GITHUB_CONFIG.gistId = data.id;
      localStorage.setItem('boxDefinitionsGistId', data.id);
      githubStatus.textContent = 'Successfully saved to GitHub!';
    } else {
      let userMessage = `Error: Failed to save to GitHub (HTTP ${response.status}).`;
      if (response.status === 401) userMessage = "Error: GitHub token is invalid or lacks required permissions.";
      else if (response.status === 403) userMessage = "Error: GitHub request forbidden. Check token, permissions, or rate limits.";
      else if (response.status === 404 && GITHUB_CONFIG.gistId) userMessage = "Error: GitHub Gist not found for update. Ensure Gist ID is correct.";
      
      if (data && data.message) {
        userMessage += ` Details: ${data.message}`;
      } else if (!data && response.statusText) {
        userMessage += ` Server response: ${response.statusText}`;
      }
      githubStatus.textContent = userMessage;
      console.error('GitHub save error details:', data || response.statusText);
    }
  } catch (error) { // Catches network errors or other issues
    githubStatus.textContent = `Error: Could not connect to GitHub or unexpected error during save. ${error.message}`;
    console.error('GitHub save connection/unexpected error:', error);
  }
};

const loadFromGithub = async () => {
  if (!GITHUB_CONFIG.token) {
    const token = prompt('Please enter your GitHub Personal Access Token:');
    if (!token) {
        githubStatus.textContent = 'GitHub token input cancelled.';
        return;
    }
    GITHUB_CONFIG.token = token;
    localStorage.setItem('githubToken', token);
  }

  if (!GITHUB_CONFIG.gistId) {
    githubStatus.textContent = 'No saved Gist ID found. Please save to GitHub first to create or specify a Gist ID.';
    return;
  }

  try {
    githubStatus.textContent = 'Loading from GitHub...';
    const response = await fetch(`https://api.github.com/gists/${GITHUB_CONFIG.gistId}`, {
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.warn('Could not parse GitHub API response as JSON during load.', e);
      // Let response.ok check handle the error display if parsing failed before response.ok check
    }

    if (response.ok) {
      if (!data.files || !data.files['box-definitions.json']) {
        githubStatus.textContent = "Error: 'box-definitions.json' not found in the loaded Gist.";
        console.error("Gist content error: 'box-definitions.json' missing.", data.files);
        return;
      }
      const content = data.files['box-definitions.json'].content;
      
      let boxes;
      try {
        boxes = JSON.parse(content);
      } catch (e) {
        githubStatus.textContent = "Error: Could not parse box definitions from the Gist. The content may be corrupted.";
        console.error('JSON parsing error from Gist:', e);
        return;
      }
      
      if (validateBoxDefinitions(boxes)) {
        currentBoxSizes = boxes;
        saveBoxDefinitions(boxes); // Save to local storage as well
        githubStatus.textContent = 'Successfully loaded from GitHub!';
      } else {
        githubStatus.textContent = "Error: Invalid box definitions loaded from GitHub. Please check the Gist content.";
        console.error('Validation error for Gist content:', boxes);
      }
    } else {
      let userMessage = `Error: Failed to load from GitHub (HTTP ${response.status}).`;
      if (response.status === 401) userMessage = "Error: GitHub token is invalid or lacks required permissions.";
      else if (response.status === 403) userMessage = "Error: GitHub request forbidden. Check token, permissions, or rate limits.";
      else if (response.status === 404) userMessage = "Error: GitHub Gist not found. Ensure the Gist ID is correct.";
      
      if (data && data.message) {
        userMessage += ` Details: ${data.message}`;
      } else if (!data && response.statusText) {
        userMessage += ` Server response: ${response.statusText}`;
      }
      githubStatus.textContent = userMessage;
      console.error('GitHub load error details:', data || response.statusText);
    }
  } catch (error) { // Catches network errors or other issues
    githubStatus.textContent = `Error: Could not connect to GitHub or unexpected error during load. ${error.message}`;
    console.error('GitHub load connection/unexpected error:', error);
  }
};

let cushion = 0;

// Event Listeners
recommendButton.addEventListener("click", recommend);
cushion0Button.addEventListener("click", () => {
  cushion = 0;
  recommend();
});
cushion2Button.addEventListener("click", () => {
  cushion = 2;
  recommend();
});
cushion4Button.addEventListener("click", () => {
  cushion = 4;
  recommend();
});
cushion6Button.addEventListener("click", () => {
  cushion = 6;
  recommend();
});
resetButton.addEventListener("click", reset);
fileInput.addEventListener("change", handleFileUpload);
downloadJsonButton.addEventListener("click", downloadAsJson);
downloadCsvButton.addEventListener("click", downloadAsCsv);
downloadXlsxButton.addEventListener("click", downloadAsXlsx);
saveGithubButton.addEventListener("click", saveToGithub);
loadGithubButton.addEventListener("click", loadFromGithub);