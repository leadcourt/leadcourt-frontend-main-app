import { toast } from "react-toastify";
import { getDataPhoneAndEmail } from "./data";
 

const showPhoneAndEmail = async (type: string, row: any, user: any ) => {
  const payload = {
    row_ids: [...row],
    type: type,
    userId: user?.id,
  };


  try {
    const res = await getDataPhoneAndEmail(payload)
 
    return res

  } catch {

    toast.error("Error occured");
  }
 
};

export { showPhoneAndEmail };
