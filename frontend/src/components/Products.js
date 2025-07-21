import { useState, useEffect } from "react";
import axios from "axios";

function Products({ token, role, setCartRefresh }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products");
        console.log("Products: Fetched products:", response.data);
        setProducts(response.data);
      } catch (error) {
        console.error("Products: Error fetching products:", error);
        setError(error.response?.data?.message || "Error fetching products");
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    if (!token) {
      alert("Please log in to add items to cart");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:5000/api/cart",
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Products: Added to cart:", response.data);
      alert("Product added to cart!");
    } catch (error) {
      console.error("Products: Error adding to cart:", error);
      setError(error.response?.data?.message || "Error adding to cart");
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await axios.delete(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Products: Product deleted:", response.data);
      setProducts(products.filter((product) => product._id !== productId));
      setCartRefresh((prev) => prev + 1); // Trigger cart refresh
      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Products: Error deleting product:", error);
      setError(error.response?.data?.message || "Error deleting product");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Products</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            {product.image && (
              <img
                src={`http://localhost:5000${product.image}`}
                alt={product.name}
                className="w-full h-48 object-cover rounded mb-4 transform hover:scale-105 transition-transform duration-300"
              />
            )}
            <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
            <p className="text-gray-600">₹{product.price}</p>
            <p className="text-gray-600">{product.description}</p>
            <button
              onClick={() => handleAddToCart(product._id)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-300 mt-4 w-full"
            >
              Add to Cart
            </button>
            {role === "master" && (
              <button
                onClick={() => handleRemoveProduct(product._id)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-300 mt-2 w-full"
              >
                Remove Product
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;