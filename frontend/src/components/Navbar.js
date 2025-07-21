import { Link, useNavigate } from "react-router-dom";

function Navbar({ token, setToken, setRole, username }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold tracking-wide hover:text-gray-200 transition-colors duration-300">
          Infocart
        </Link>
        <div className="flex items-center space-x-6">
          {token ? (
            <>
              <div className="flex space-x-6">
                <Link to="/" className="text-white hover:text-gray-200 transition-colors duration-300">
                  Products
                </Link>
                <Link to="/cart" className="text-white hover:text-gray-200 transition-colors duration-300">
                  Cart
                </Link>
                <Link to="/orders" className="text-white hover:text-gray-200 transition-colors duration-300">
                  Orders
                </Link>
                {username === "master" && (
                  <Link to="/add-product" className="text-white hover:text-gray-200 transition-colors duration-300">
                    Add Product
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-gray-200 transition-colors duration-300"
                >
                  Logout
                </button>
              </div>
              <span className="text-white font-semibold text-lg user-greeting ml-8">
                Welcome, {username || "User"}
              </span>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white hover:text-gray-200 transition-colors duration-300">
                Login
              </Link>
              <Link to="/register" className="text-white hover:text-gray-200 transition-colors duration-300">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;