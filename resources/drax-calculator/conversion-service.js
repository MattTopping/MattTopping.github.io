function onLoad() {
    getJsonDbForWindow()
        .then(() => setupTableFilters())
        .then(() => populatePlateWeightTable())
        .catch(err => console.error(err));
}

async function getJsonDbForWindow() {
    // Fetch current JSON
    const jsonDbFilePath = 'https://matthewtopping.com.au/resources/drax-calculator/conversion-db.json';
    return fetch(jsonDbFilePath)
        .then(db => db.json())
        .then(jsonDb => window.jsonDb = jsonDb)
        .catch(err => console.error(err));
}

function setupTableFilters() {
    // Setup filter inputs and their event listeners
    console.log("Setting up table filters...");
}

function populatePlateWeightTable(searchString = null, seriesFilter = null) {
    // Ensure the JSON database is loaded
    if (!window.jsonDb) {
        console.error("JSON database not loaded. Call getJsonDbForWindow() first.");
        return; // Stop execution if JSON DB is not loaded
    }

    // ID container to place weight info into
    const plateWeightTable = document.getElementById("tbody--plate-weights");

    // Clear existing table rows
    plateWeightTable.innerHTML = "";

    // TODO: Apply search filter if provided

    // For each machine in each series, calculate plate weight and place on screen
    window.jsonDb.series.forEach(series => {
        series.machines.forEach(machine => {
            if(!machine.totalStackWeight) return; //Do nothing with this machine if the total stack weight is not defined

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

function convertSeriesToSingleChar(seriesName) {
    switch(seriesName) {
        case "Infinity":
            return "&#8734;";
        case "Alpha":
            return "&#945;";
    }
    return seriesName.charAt(0).toUpperCase();
}

function calculatePlateWeight(machineDetails) {
    var numOfStacks = machineDetails.numOfStacks ?? 1;
    var numOfPlates = machineDetails.numOfPlates ?? 1;
    var pulleyRatio = machineDetails.pulleyRatio ?? 1;

    return machineDetails.totalStackWeight / numOfStacks / numOfPlates / pulleyRatio;
}

function setMachineContext(machine){
    const plateWeightInput = document.getElementById("input--plate-weight");
    const machineNameInput = document.getElementById("input--machine-name");

    plateWeightInput.value = calculatePlateWeight(machine);
    machineNameInput.value = machine.machineName;
}