import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

// 1. Create context
const AuthContext = createContext();

// 2. Hook to access context
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Auth Provider
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    console.log("👤 Firebase auth user:", user);
    setCurrentUser(user);
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        console.log("📄 Firestore user doc:", userDoc.data());

        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("❌ Error fetching user role:", err);
        setRole(null);
      }
    } else {
      setRole(null);
    }
    setLoading(false);
  });

  return () => unsubscribe();
}, []);
  return (
    <AuthContext.Provider value={{ currentUser, role }}>
      {loading ? (
  <div className="flex justify-center items-center min-h-screen text-gray-500">
    Initializing user session...
  </div>
) : children}

    </AuthContext.Provider>
  );
}
