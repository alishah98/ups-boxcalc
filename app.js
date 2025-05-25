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
  const length = parseFloat(lengthInput.value) + cushion;
  const width = parseFloat(widthInput.value) + cushion;
  const height = parseFloat(heightInput.value) + cushion;

  const closestBox = getClosestBox(length, width, height);

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
            
          case 'csv':
            const csvData = e.target.result.split('\n');
            boxes = csvData.slice(1).map(row => {
              const [name, length, width, height] = row.split(',').map(item => item.trim());
              return {
                name,
                dimensions: [parseFloat(length), parseFloat(width), parseFloat(height)]
              };
            }).filter(box => box.name && !isNaN(box.dimensions[0]));
            break;
            
          case 'xlsx':
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            boxes = jsonData.map(row => ({
              name: row.Name || row.name,
              dimensions: [
                parseFloat(row.Length || row.length),
                parseFloat(row.Width || row.width),
                parseFloat(row.Height || row.height)
              ]
            }));
            break;
            
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

    const data = await response.json();
    if (response.ok) {
      GITHUB_CONFIG.gistId = data.id;
      localStorage.setItem('boxDefinitionsGistId', data.id);
      githubStatus.textContent = 'Successfully saved to GitHub!';
    } else {
      throw new Error(data.message || 'Failed to save to GitHub');
    }
  } catch (error) {
    githubStatus.textContent = `Error: ${error.message}`;
    console.error('GitHub save error:', error);
  }
};

const loadFromGithub = async () => {
  if (!GITHUB_CONFIG.token) {
    const token = prompt('Please enter your GitHub Personal Access Token:');
    if (!token) return;
    GITHUB_CONFIG.token = token;
    localStorage.setItem('githubToken', token);
  }

  if (!GITHUB_CONFIG.gistId) {
    githubStatus.textContent = 'No saved gist found. Please save to GitHub first.';
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

    const data = await response.json();
    if (response.ok) {
      const content = data.files['box-definitions.json'].content;
      const boxes = JSON.parse(content);
      
      if (validateBoxDefinitions(boxes)) {
        currentBoxSizes = boxes;
        saveBoxDefinitions(boxes);
        githubStatus.textContent = 'Successfully loaded from GitHub!';
      } else {
        throw new Error('Invalid box definitions format in GitHub gist');
      }
    } else {
      throw new Error(data.message || 'Failed to load from GitHub');
    }
  } catch (error) {
    githubStatus.textContent = `Error: ${error.message}`;
    console.error('GitHub load error:', error);
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