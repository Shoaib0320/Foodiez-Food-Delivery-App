import {
  auth,
  createUserWithEmailAndPassword,
  db,
  doc,
  setDoc
} from "./firebase.js";

const register = async (event) => {
  event.preventDefault(); // Prevent form from submitting normally

  const fullName = document.getElementById("fullName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const phoneNumber = document.getElementById("phoneNumber").value;
  const address = document.getElementById("address").value;

  console.log("User Email: " + email, "User Password: " + password);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User Credential: ", userCredential);
    console.log("User: ", user);

    // Store additional user details in Firestore
    await setDoc(doc(db, "users", user.uid), {
      fullName: fullName,
      email: email,
      phoneNumber: phoneNumber,
      address: address,
    });

    console.log("User written with ID: ", user.uid);
    alert('Registration Success');

    // Redirect to another page after successful registration
    window.location.href = "index.html";

  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    document.getElementById('signupError').innerText = errorMessage , errorCode;
    console.error('Error signing up:', error);
  }
};

const registerBtn = document.getElementById("registerBtn");
registerBtn.addEventListener("click", register);
