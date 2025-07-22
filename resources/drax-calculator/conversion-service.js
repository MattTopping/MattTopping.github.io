async function buildConversionForm(){
    // Fetch current JSON
    const jsonDbFilePath = 'https://matthewtopping.com.au/resources/drax-calculator/conversion-db.json';
    var jsonDb = await fetch(jsonDbFilePath)
        .then(db => db.json())
        .catch(err => console.error(err))

    // ID container to place weight info into
    const plateWeightContainer = document.getElementById("container--plate-weights");

    // For each machine in each series, calculate plate weight and place on screen
    jsonDb.series.forEach(series => {
        series.machines.forEach(machine => {
            if(!machine.totalStackWeight) return; //Do nothing with this machine if the total stack weight is not defined

            var numOfStacks = machine.numOfStacks ?? 1;
            var numOfPlates = machine.numOfPlates ?? 1;
            var pulleyRatio = machine.pulleyRatio ?? 1;

            var weightPerPlate = machine.totalStackWeight / numOfStacks / numOfPlates / pulleyRatio;

            const para = document.createElement("p");
            const node = document.createTextNode(`${series.seriesName} | ${machine.machineName} | Plate weight: ${weightPerPlate}kg`);
            para.appendChild(node);
            plateWeightContainer.appendChild(para);
            plateWeightContainer.appendChild(node);

            console.log(`${machine.machineName} plate weight is ${weightPerPlate}kg`);
        });
    });
}