import { toast } from "react-toastify";
import { getDataPhoneAndEmail } from "./data";
import { collaboration_getDataPhoneAndEmail_api } from "./collaborationData";

const showPhoneAndEmail = async (type: string, row: any, user: any) => {
  const payload = {
    row_ids: [...row],
    type: type,
    userId: user?.id,
  };

  try {
    const res = await getDataPhoneAndEmail(payload);

    return res;
  } catch {
    toast.error("Error occured");
  }
};

const collaboration_showPhoneAndEmail = async (
  type: string,
  row: any,
  user: any
) => {
  const payload = {
    row_ids: [...row],
    type: type,
    userId: user?.id,
  };

  try {
    const res = await collaboration_getDataPhoneAndEmail_api(payload);

    return res;
  } catch {
    toast.error("Error occured");
  }
};

export { showPhoneAndEmail, collaboration_showPhoneAndEmail };
