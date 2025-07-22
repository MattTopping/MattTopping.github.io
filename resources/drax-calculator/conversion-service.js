function buildConversionForm(){
    fetch('conversion-db.json')
        .then(db => db.json())
        .then(
            machines => {
                machines.forEach(machine => {
                    if(!machine.totalStackWeight) return; //Do nothing with this machine if the total stack weight is not defined

                    var numOfStacks = machine.numOfStacks ?? 1;
                    var numOfPlates = machine.numOfPlates ?? 1;
                    var pulleyRatio = machine.pulleyRatio ?? 1;

                    var weightPerPlate = machine.totalStackWeight / numOfStacks / numOfPlates / pulleyRatio;

                    console.log(`${machine.machineName} plate weight is ${weightPerPlate}kg`);
                });
            }
        )
        .catch(err => console.error(err) /* replace with a HTML error saying DB was not loaded */)
}