import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar";
import Products from "./components/Products";
import AddProduct from "./components/AddProduct";
import Cart from "./components/Cart";
import Orders from "./components/Orders";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [username, setUsername] = useState(null);
  const [cartRefresh, setCartRefresh] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await axios.get("http://localhost:5000/api/user", {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("App: Fetched user:", response.data);
          setUsername(response.data.username);
          setRole(response.data.role);
          localStorage.setItem("role", response.data.role);
        } catch (error) {
          console.error("App: Error fetching user:", error);
          setToken(null);
          setRole(null);
          setUsername(null);
          localStorage.removeItem("token");
          localStorage.removeItem("role");
        }
      }
    };
    fetchUser();
  }, [token]);

  return (
    <Router>
      <Navbar token={token} setToken={setToken} setRole={setRole} username={username} />
      <Routes>
        <Route path="/" element={<Products token={token} role={role} setCartRefresh={setCartRefresh} />} />
        <Route path="/add-product" element={<AddProduct token={token} role={role} />} />
        <Route path="/cart" element={<Cart token={token} cartRefresh={cartRefresh} />} />
        <Route path="/orders" element={<Orders token={token} />} />
        <Route path="/login" element={<Login setToken={setToken} setRole={setRole} />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;