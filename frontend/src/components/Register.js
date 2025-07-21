import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Register({ setToken, setRole: setGlobalRole }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // Only user role is allowed for registration
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/register", { username, password, role: "user" });
      const response = await axios.post("http://localhost:5000/api/login", { username, password });
      setToken(response.data.token);
      setGlobalRole && setGlobalRole("user");
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", "user");
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "Error registering");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          {/* Role selection removed: only user registration allowed */}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Register
          </button>
          {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
        </form>
        <p className="mt-4 text-gray-600 text-center">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;