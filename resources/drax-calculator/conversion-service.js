// Debounce Time (ms)
const debounceTime = 750; 

// Table Targets
const clearContextButtonId = "btn--clear-context";
const clearSearchButtonId = "btn--clear-search";

// Elements
const machineNameInputId = "span--machine-name";

// Inputs
const searchInputId = "input--search";
const plateWeighInputtId = "input--plate-weight";
const numOfPlatesInputId = "input--plate-number";
const totalWeightInputId = "input--total-weight";

// Loads table from JSON file and sets up inputs with debouncing
function onLoad() {
    getJsonDbForWindow()
        .then(() => setupDebounce(document.getElementById(searchInputId), (searchTerm) => populatePlateWeightTable(searchTerm)))
        .then(() => setupDebounce(document.getElementById(numOfPlatesInputId), (plateNum) => setWeightTotal(plateNum)))
        .then(() => setupDebounce(document.getElementById(totalWeightInputId), (weightNum) => setNumOfPlates(weightNum)))
        .then(() => populatePlateWeightTable())
        .catch(err => console.error(err));
}

// Fetches current JSON config
async function getJsonDbForWindow() {
    // Fetch current JSON
    const jsonDbFilePath = 'https://matthewtopping.com.au/resources/drax-calculator/conversion-db.json';
    return fetch(jsonDbFilePath)
        .then(db => db.json())
        .then(jsonDb => window.jsonDb = jsonDb)
        .catch(err => console.error(err));
}

// Populates the machine table with all rows 
// OPTIONAL: Search term to filter out rows based on machine name
function populatePlateWeightTable(searchString = null) {
    // Ensure the JSON database is loaded
    if (!window.jsonDb) {
        console.error("JSON database not loaded. Call getJsonDbForWindow() first.");
        return; // Stop execution if JSON DB is not loaded
    }

    // Fetch and clear the table body
    const plateWeightTable = document.getElementById("tbody--plate-weights");
    plateWeightTable.innerHTML = "";

    // Flatten all machines across series, keep reference to series
    const allMachines = window.jsonDb.series.flatMap(series =>
        series.machines.map(machine => ({
            ...machine,
            _seriesName: series.seriesName
        }))
    );

    // Filter out machines without totalStackWeight and by search string
    const filteredMachines = allMachines.filter(machine => {
        if (!machine.totalStackWeight) return false;
        if (searchString && machine.machineName && !machine.machineName.toLowerCase().includes(searchString.toLowerCase())) return false;
        return true;
    });

    // Sort alphabetically by machineName
    filteredMachines.sort((a, b) => {
        if (!a.machineName || !b.machineName) return 0;
        return a.machineName.localeCompare(b.machineName);
    });

    // Render table rows
    filteredMachines.forEach(machine => plateWeightTable.appendChild(createMachineTableRow(machine)));
}

// Converts series names into a single char. Saves space in table.
function convertSeriesToSingleChar(seriesName) {
    switch(seriesName) {
        case "Infinity":
            return "&#8734;";
        case "Alpha":
            return "&#945;";
    }
    return seriesName.charAt(0).toUpperCase();
}

// Calculates the weight per plate based on all available datapoints for a machine
function calculatePlateWeight(machineDetails) {
    var numOfStacks = machineDetails.numOfStacks ?? 1;
    var numOfPlates = machineDetails.numOfPlates ?? 1;
    var pulleyRatio = machineDetails.pulleyRatio ?? 1;

    const result = machineDetails.totalStackWeight / numOfStacks / numOfPlates / pulleyRatio;
    return Math.round(result * 100) / 100; // Round to 2 decimal places
}

// Calculates and sets the total weight field
function setWeightTotal(numberOfPlates){
    const weightPerPlateElement = document.getElementById(plateWeighInputtId);
    const totalWeightElement = document.getElementById(totalWeightInputId);

    if(!numberOfPlates) {
        totalWeightElement.value = null;
        return; // Exit early if no plates are specified
    }

    if(weightPerPlateElement.value && totalWeightElement) {
        const result = weightPerPlateElement.value * numberOfPlates;
        totalWeightElement.value = Math.round(result * 100) / 100; // Round to 2 decimal places
    }
}

// Calculates and sets the number of plates 
function setNumOfPlates(totalWeight){
    const weightPerPlateElement = document.getElementById(plateWeighInputtId);
    const numOfPlatesElement = document.getElementById(numOfPlatesInputId);

    if(!totalWeight) {
        numOfPlatesElement.value = null;
        return; // Exit early if no total weight is specified
    }

    if(weightPerPlateElement.value && numOfPlatesElement) {
        const result = totalWeight / weightPerPlateElement.value;
        numOfPlatesElement.value = Math.round(result * 100) / 100; // Round to 2 decimal places
    }
}

// Set UI state based on the selected machine
function setMachineContext(machine){
    const plateWeightInput = document.getElementById(plateWeighInputtId);
    plateWeightInput.value = calculatePlateWeight(machine);

    var machinePrefix = document.getElementById(machineNameInputId)
    if(machinePrefix){
        machinePrefix.innerHTML = machine.machineName;
    }
    else {
        machinePrefix = document.createElement("span");
        machinePrefix.id = machineNameInputId;
        machinePrefix.className = "input-group-text input-group--max-50";
        machinePrefix.innerHTML = machine.machineName;
        plateWeightInput.parentNode.insertBefore(machinePrefix, plateWeightInput);
    }

    var clearSuffix = document.getElementById(clearContextButtonId);
    if(!clearSuffix){
        const clearButton = document.createElement("button");
        clearButton.id = clearContextButtonId;
        clearButton.className = "btn btn-danger";
        clearButton.onclick = () => clearMachineContext();

        const trashIcon = document.createElement("i");
        trashIcon.className = "fas fa-trash";

        clearButton.appendChild(trashIcon);
        plateWeightInput.parentNode.append(clearButton);
    }

    clearElementValueById(numOfPlatesInputId);
    clearElementValueById(totalWeightInputId);

    // Enable numOfPlates and totalWeight fields
    setInputStateById(numOfPlatesInputId, true);
    setInputStateById(totalWeightInputId, true);
}

// Removes the current machine from the UI state
function clearMachineContext(){
    clearElementValueById(plateWeighInputtId);
    clearElementValueById(numOfPlatesInputId);
    clearElementValueById(totalWeightInputId);

    // Disable numOfPlates and totalWeight fields
    setInputStateById(numOfPlatesInputId, false);
    setInputStateById(totalWeightInputId, false);

    removeElementById(machineNameInputId);
    removeElementById(clearContextButtonId);
}

// Clears the search box and reload table unfiltered
function clearSearchContext(){
    const searchInput = document.getElementById(searchInputId);
    searchInput.value = null;
    populatePlateWeightTable();
}

// Sets up search debouncing
function setupDebounce(element, callback) {
    // Setup filter inputs and their event listeners
    var timeout = null;

    element.addEventListener("keyup", () => {
        // Set loading state
        toggleInputLoading(element.id, true);
        clearTimeout(timeout);

        // Use a timeout to debounce the input
        timeout = setTimeout(() => {
            callback(element.value);
            toggleInputLoading(element.id, false);
        }, debounceTime);
    });
}

// Helper to set an element's value to null by ID
function clearElementValueById(id) {
    const el = document.getElementById(id);
    if (el) el.value = null;
}

// Helper to remove an element by ID
function removeElementById(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// Helper to toggle the enabled state of an input by ID
function setInputStateById(id, isEnabled) {
    const el = document.getElementById(id);
    if (el) el.disabled = !isEnabled;
}

// Helper to create a table row for a machine
function createMachineTableRow(machine) {
    const tableRow = document.createElement("tr");

    // Create series cell
    const seriesCell = document.createElement("td");
    seriesCell.className = "font--default";
    seriesCell.innerHTML = convertSeriesToSingleChar(machine._seriesName);
    seriesCell.ariaLabel = machine._seriesName; // Set aria-label for accessibility

    // Create machine cell
    const machineCell = document.createElement("th");
    machineCell.scope = "row";
    machineCell.textContent = machine.machineName;
    machineCell.ariaLabel = machine.machineName; // Set aria-label for accessibility

    // Create weight cell
    var plateWeight = calculatePlateWeight(machine);
    const weightCell = document.createElement("td");
    weightCell.textContent = `${plateWeight}kg`;
    weightCell.ariaLabel = plateWeight; // Set aria-label for accessibility

    // Create set button cell
    const setCell = document.createElement("td");
    const setButton = document.createElement("button");
    setButton.type = "button";
    setButton.className = "btn btn-primary";
    setButton.textContent = "Set";
    setButton.ariaLabel = `Set plate weight calculator to ${machine.machineName}`;
    setButton.onclick = () => setMachineContext(machine);
    setCell.appendChild(setButton);

    // Append cells to the row
    tableRow.appendChild(seriesCell);
    tableRow.appendChild(machineCell);
    tableRow.appendChild(weightCell);
    tableRow.appendChild(setCell);

    return tableRow;
}

function toggleInputLoading (inputId, isLoading){
    const spinner = document.querySelector(`span[for="${inputId}"]`);
    const icon = document.querySelector(`i[for="${inputId}"]`);

    if(isLoading){
        icon.classList.add('d-none');
        spinner.classList.remove('d-none');
    } else {
        icon.classList.remove('d-none');
        spinner.classList.add('d-none');
    }
}