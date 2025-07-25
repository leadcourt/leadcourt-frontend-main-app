import axios from 'axios';

// const baseUrl = import.meta.env.VITE_BE_URL
const baseUrl = 'https://dev.kyoto-creative.online/api/collaboration'


const getAllInvitations = async ( ) => {
    return await axios.get(`${baseUrl}/invitations`);
}

const getAcceptedInvitations = async ( ) => {
    return await axios.get(`${baseUrl}/acceptedInvitations`);
}

const inviteUser = async (payload: any ) => {
    return await axios.post(`${baseUrl}/invite`, payload);
}

const replyInvite = async (payload: any ) => {
    return await axios.post(`${baseUrl}/invitations/respond`, payload);
}

const getAllSentInvitations = async () => {
    return await axios.get(`${baseUrl}/sentInvites`);  
}


// ============= Collaborations dashboard api================ 

const getCollabCreditBalance = async (collabID: any) => {
    return await axios.get(`${baseUrl}/${collabID}/credits/total`, )
}

const getAllDash = async () => {
    // return await axios.post(`${baseUrl}/dashboard/dashboard`, )
    return
}


export {
    getAllInvitations,
    getAcceptedInvitations,
    inviteUser,
    replyInvite,
    getAllSentInvitations,

    getCollabCreditBalance,
    getAllDash

}