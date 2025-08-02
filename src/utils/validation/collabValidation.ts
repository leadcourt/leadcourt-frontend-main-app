import * as yup from "yup";

// const passwordRule = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/;



// Define the ForgotPassword validation schema
const addCollaborationValidation = yup.object().shape({
  email: yup.string().email("Please enter a valid email").required("Required"),
  role: yup.string(),
  // message: yup.string()
});

export {
    addCollaborationValidation
}