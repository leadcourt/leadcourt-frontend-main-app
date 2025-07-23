
import axios from "axios"; 

const loadCountry = async () => {
    return await axios.get("./data/countries.json") 
}
 
const loadState = async () => {
    return await axios.get("./data/state.json") 
}

const loadDesignationGroup = async () => {
    return await axios.get("./data/designation_groups.json") 
}

export {
    loadCountry,
    loadState,
    loadDesignationGroup,
}