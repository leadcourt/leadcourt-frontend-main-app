import { doc, getDoc, setDoc } from "firebase/firestore"; 
import { db } from "../../config/firebaseConfig";


const setPersonalInformation = async (payload: any) => {
    
    return await setDoc(doc(db, "Personal_Info", payload.id), payload)}


const getPersonalInformation = async (payload: any) => {
    const docRef = doc(db, "Personal_Info", payload)
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        
        return docSnap.data();
    } else {
        return {}
    }
}

 
export {
    setPersonalInformation,
    getPersonalInformation,
}