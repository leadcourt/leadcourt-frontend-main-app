import * as yup from "yup";

const passwordRule = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/;

const registerUserValidation = yup
  .object()
  .shape({
    displayName: yup.string().required("Name is Required"),
    email: yup
      .string()
      .email("Please enter a valid email")
      .required("Email is Required"),
    password: yup
      .string()
      .min(5)
      .max(25)
      .matches(
        passwordRule,
        "Password must contain at least one number, one lowercase letter, and one uppercase letter"
      )
      .required("Password is Required"),
    password2: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords must match")
      .required("Required"),
  })
  .strict(true);

// Define the login validation schema
const loginUserValidation = yup.object().shape({
  email: yup.string().email("Please enter a valid email").required("Required"),
  password: yup
    .string()
    .min(5)
    .max(25)
    .matches(
      passwordRule,
      "Password must contain at least one number, one lowercase letter, and one uppercase letter"
    )
    .required("Required"),
});

// Define the ForgotPassword validation schema
const forgotPasswordValidation = yup.object().shape({
  email: yup.string().email("Please enter a valid email").required("Required"),
});

// Define the ForgotPassword validation schema
const verificationValidation = yup.object().shape({
  otp: yup.number().required("Required"),
});

// Define the ForgotPassword validation schema
const resetPasswordValidation = yup.object().shape({
  oldPassword: yup.string().required("Required"),

  newPassword: yup
    .string()
    .min(8)
    .max(25)
    .matches(
      passwordRule,
      "Password must contain at least one number, one lowercase letter, and one uppercase letter"
    )
    .required("Required"),

  newPasswordAgain: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords must match")
    .required("Required"),
});


const paymentInIndiaValidation = yup.object().shape({
  
  fullName: yup.string().required("First name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  mobile: yup.string().required("Mobile number is required"),
  subscriptionType: yup.string().required("Subscription type is required"),
  amount: yup.number().required("Amount is required"), 
})
 

export {
  loginUserValidation,
  registerUserValidation,
  forgotPasswordValidation,
  verificationValidation,
  resetPasswordValidation,
  paymentInIndiaValidation,
};
