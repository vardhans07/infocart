import { useState, useEffect } from "react";
import axios from "axios";

function Orders({ token }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders", error);
      }
    };
    if (token) fetchOrders();
  }, [token]);

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold mb-6 text-center">Order History</h2>
      {orders.length === 0 ? (
        <p className="text-center text-gray-600">No orders found</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <p className="text-lg font-semibold">Order ID: {order.orderId}</p>
              <p className="text-gray-600">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-gray-600">Total: ₹{order.totalAmount}</p>
              <p className="text-gray-600">Status: {order.status}</p>
              <h3 className="text-lg font-bold mt-4">Items:</h3>
              <ul className="list-disc pl-5">
                {order.items.map((item) => (
                  <li key={item.productId._id}>
                    {item.productId.name} - ₹{item.price} x {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;