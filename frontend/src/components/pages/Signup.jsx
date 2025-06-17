import React, { useState } from "react";
import {  Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";

export default function Signup() {
  //const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        where("isRegistered", "==", false)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("Unauthorized or already registered.");
        return;
      }

      const preApprovedDoc = snapshot.docs[0];
      const role = preApprovedDoc.data().role;

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, "users", userCred.user.uid);

      await setDoc(userDocRef, {
        uid: userCred.user.uid,
        email: userCred.user.email,
        isRegistered: true,
        role,
      }, { merge: true });

      await userCred.user.getIdToken(true);
      window.location.href = "/dashboard";

    } catch (err) {
      console.error("Signup error:", err);
      setError("Signup failed. Please try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        where("isRegistered", "==", false)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("This Google account is not pre-approved.");
        await signOut(auth);
        return;
      }

      const preApprovedDoc = snapshot.docs[0];
      const role = preApprovedDoc.data().role;

      const userDocRef = doc(db, "users", result.user.uid);
      await setDoc(userDocRef, {
        uid: result.user.uid,
        email: result.user.email,
        isRegistered: true,
        role,
      });

      // Delete pre-approved entry to avoid duplicates
      await deleteDoc(preApprovedDoc.ref);

      await result.user.getIdToken(true);
      window.location.href = "/dashboard";


    } catch (err) {
      console.error("Google sign-up error:", err);
      setError("Google sign-in failed.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white px-4">
      <div className="flex flex-col items-center mb-6">
        <img src="../../../public/SE Logo.png" alt="Logo" className="h-10" />
      </div>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create an Account</h2>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            className="cursor-pointer w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold transition"
          >
            Sign Up
          </button>
        </form>

        <div className="my-6 flex items-center justify-between">
          <div className="border-t w-full border-gray-200" />
          <span className="text-gray-400 mx-4 text-sm">OR</span>
          <div className="border-t w-full border-gray-200" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="cursor-pointer flex items-center justify-center gap-3 w-full border border-gray-300 py-2 rounded-md hover:bg-gray-50 transition"
        >
          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5" />
          <span className="text-sm font-medium text-gray-700">Continue with Google</span>
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-600 font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
