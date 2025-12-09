import axios from 'axios';

const baseUrl = import.meta.env.VITE_BE_URL + '/collaboration'
// const baseUrl = 'https://dev.kyoto-creative.online/api/collaboration'


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

const removeCollaboration = async (collab_id:string) => {
    return await axios.delete(`${baseUrl}/delete/${collab_id}`);  

}


// ============= Collaborations dashboard api================ 

const getCollabCreditBalance = async () => {
    return await axios.get(`${baseUrl}/credits/total`, )
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
    removeCollaboration,
    getCollabCreditBalance,
    getAllDash

}