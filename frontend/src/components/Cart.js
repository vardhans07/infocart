import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Cart({ token, cartRefresh }) {
  const [cart, setCart] = useState({ items: [] });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Cart: Fetched cart:", response.data);
        setCart(response.data || { items: [] });
      } catch (error) {
        console.error("Cart: Error fetching cart:", error);
        setError(error.response?.data?.message || "Error fetching cart");
      }
    };
    if (token) fetchCart();
  }, [token, cartRefresh]);

  const handleRemove = async (productId) => {
    try {
      const response = await axios.delete("http://localhost:5000/api/cart/remove", {
        headers: { Authorization: `Bearer ${token}` },
        data: { productId },
      });
      console.log("Cart: Item removed:", response.data);
      setCart(response.data || { items: [] });
    } catch (error) {
      console.error("Cart: Error removing item:", error);
      setError(error.response?.data?.message || "Error removing item");
    }
  };

  const handleCheckout = async () => {
    if (!cart.items.length) {
      alert("Cart is empty!");
      return;
    }

    const totalAmount = cart.items.reduce(
      (total, item) => total + (item.productId?.price || 0) * item.quantity,
      0
    );

    try {
      const response = await axios.post(
        "http://localhost:5000/api/create-order",
        {
          amount: totalAmount,
          currency: "INR",
          receipt: `receipt_cart_${Date.now()}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const options = {
        key: "your_razorpay_key_id",
        amount: response.data.amount,
        currency: response.data.currency,
        name: "Infocart",
        description: "Cart Purchase",
        order_id: response.data.id,
        handler: async function (response) {
          try {
            const orderResponse = await axios.post(
              "http://localhost:5000/api/orders",
              {
                items: cart.items.map((item) => ({
                  productId: item.productId?._id,
                  quantity: item.quantity,
                  price: item.productId?.price || 0,
                })),
                totalAmount,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Cart: Order saved:", orderResponse.data);
            alert(`Payment successful! Order ID: ${orderResponse.data._id}`);
            setCart({ items: [] });
            navigate("/orders");
          } catch (error) {
            console.error("Cart: Error saving order:", error);
            alert(error.response?.data?.message || "Error saving order");
          }
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#2563eb",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        alert("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (error) {
      console.error("Cart: Error initiating payment:", error);
      alert(error.response?.data?.message || "Error initiating payment");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Your Cart</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {cart.items.length === 0 ? (
        <p className="text-center text-gray-600">Your cart is empty</p>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          {cart.items.map((item) => (
            <div key={item.productId?._id || item._id} className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300">
              <div className="flex items-center">
                {item.productId?.image && (
                  <img
                    src={`http://localhost:5000${item.productId.image}`}
                    alt={item.productId.name || "Product"}
                    className="w-16 h-16 object-cover rounded mr-4"
                  />
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{item.productId?.name || "Unknown Product"}</h3>
                  <p className="text-gray-600">
                    ₹{item.productId?.price || 0} x {item.quantity}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <p className="text-lg font-semibold text-gray-800 mr-4">
                  ₹{(item.productId?.price || 0) * item.quantity}
                </p>
                <button
                  onClick={() => handleRemove(item.productId?._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors duration-300"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center mt-6">
            <p className="text-xl font-bold text-gray-800">
              Total: ₹
              {cart.items.reduce(
                (total, item) => total + (item.productId?.price || 0) * item.quantity,
                0
              )}
            </p>
            <button
              onClick={handleCheckout}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors duration-300"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;