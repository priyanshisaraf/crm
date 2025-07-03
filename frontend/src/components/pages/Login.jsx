import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider} from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import {
  setDoc,
  doc
} from "firebase/firestore";
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;

    // Check if user was pre-approved
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      setError("This Google account is not pre-approved.");
      return;
    }

    const preApprovedDoc = snapshot.docs[0];
    const data = preApprovedDoc.data();

    // Mark them as registered (if not already)
    if (!data.isRegistered) {
      await setDoc(preApprovedDoc.ref, {
        uid: result.user.uid,
        email: result.user.email,
        isRegistered: true,
        role: data.role,
      }, { merge: true });
    }

    // Always write final doc to users/{uid}
    const userDocRef = doc(db, "users", result.user.uid);
    await setDoc(userDocRef, {
      uid: result.user.uid,
      email: result.user.email,
      isRegistered: true,
      role: data.role,
    }, { merge: true });

    // ✅ Now safely navigate
    navigate("/dashboard");

  } catch (err) {
    console.error("Google sign-in error:", err);
    setError("Google sign-in failed. Please try again.");
  }
};


  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white px-4">
      <div className="flex flex-col items-center mb-6">
        <img src="/SE Logo.png" alt="Logo" className="h-10" />
      </div>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Log in</h2>

        {location.state?.fromSignup && (
          <p className="text-green-600 text-sm mb-4">✅ Signup successful. Please log in.</p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
            <div
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] cursor-pointer text-gray-500"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </div>
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
            Log in
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
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-purple-600 font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
