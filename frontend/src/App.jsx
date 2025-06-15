import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./context/AuthContext.jsx";

function App() {
  return (
    <BrowserRouter>
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
</BrowserRouter>
  );
}

export default App;
