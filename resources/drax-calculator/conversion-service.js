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

    // ID container to place weight info into
    const plateWeightTable = document.getElementById("tbody--plate-weights");

    // Clear existing table rows
    plateWeightTable.innerHTML = "";

    // For each machine in each series, calculate plate weight and place on screen
    // TODO: Flatten all machines across series and sort alphabetically
    window.jsonDb.series.forEach(series => {
        series.machines.forEach(machine => {
            if(!machine.totalStackWeight) return; //Do nothing with this machine if the total stack weight is not defined
            if(searchString && machine.machineName && !machine.machineName.toLowerCase().includes(searchString.toLowerCase())) return;

            const tableRow = document.createElement("tr");

            // Create series cell
            const seriesCell = document.createElement("td");
            seriesCell.className = "font--default";
            seriesCell.innerHTML = convertSeriesToSingleChar(series.seriesName);
            seriesCell.ariaLabel = series.seriesName; // Set aria-label for accessibility

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

            // Append the row to the plate weight container
            plateWeightTable.appendChild(tableRow);
        });
    });
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

    return machineDetails.totalStackWeight / numOfStacks / numOfPlates / pulleyRatio;
}

// Calculates and sets the total weight field
function setWeightTotal(numberOfPlates){
    const weightPerPlateElement = document.getElementById(plateWeighInputtId);
    const totalWeightElement = document.getElementById(totalWeightInputId);
 
    if(weightPerPlateElement.value && totalWeightElement) totalWeightElement.value = weightPerPlateElement.value * numberOfPlates;
    else return; // TODO: Alert user to set context?
}

// Calculates and sets the number of plates 
function setNumOfPlates(totalWeight){
    const weightPerPlateElement = document.getElementById(plateWeighInputtId);
    const numOfPlatesElement = document.getElementById(numOfPlatesInputId);
 
    if(weightPerPlateElement.value && numOfPlatesElement) numOfPlatesElement.value = totalWeight / weightPerPlateElement.value;
    else return; // TODO: Alert user to set context?
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

    const numOfPlatesInput = document.getElementById(numOfPlatesInputId);
    numOfPlatesInput.value = null;

    const totalWeightInput = document.getElementById(totalWeightInputId);
    totalWeightInput.value = null;
}

// Removes the current machine from the UI state
function clearMachineContext(){
    const plateWeightInput = document.getElementById(plateWeighInputtId);
    plateWeightInput.value = null;

    const machinePrefix = document.getElementById(machineNameInputId);
    machinePrefix.remove();

    const clearSuffix = document.getElementById(clearContextButtonId);
    clearSuffix.remove();

    const numOfPlatesInput = document.getElementById(numOfPlatesInputId);
    numOfPlatesInput.value = null;

    const totalWeightInput = document.getElementById(totalWeightInputId);
    totalWeightInput.value = null;
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
    var timeout = null
    element.addEventListener("keyup", () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(element.value), debounceTime);
    });
}