/*
* Place all business logic which realted to JSOn processing in here.
* */


/**
 * Strip down data that needed.
 * @param data
 */
function fetchCarparkNamePair (data){


    let carParkNamePair = new Map();

    for (let i of data){
        //console.log(i.park_Id, " ", i.name)
        carParkNamePair.set(i.park_Id, i.name)
    }

    return carParkNamePair;
}


/**
 * Fetch
 * @param data
 */
function fetchvacancyData (data){

    let vacancies = new Map ();
    for (let i of data){
         // console.log(i.park_Id, " ", i.privateCar[0].vacancy, " ", i.privateCar[0].lastupdate)
        vacancies.set(i.park_Id, {
            "space" : i.privateCar[0].vacancy,
            "ts" : i.privateCar[0].lastupdate
        })
    }

    return vacancies;
}


function groupData (carparkname, vacancy){

    let re = new Array();
    for (let [key, value] of vacancy) {
        re.push({
            "name" : carparkname.get(key),
            "vacancy" : value.space,
            "ts" : value.ts
        })
    }
    return re;
}


module.exports = {
    fetchCarparkNamePair: fetchCarparkNamePair,
    fetchvacancyData : fetchvacancyData,
    groupData : groupData
}

