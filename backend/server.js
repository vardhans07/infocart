const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer configuration for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, gif) are allowed"));
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["master", "user"], default: "user" },
});
const User = mongoose.model("User", userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String },
});
const Product = mongoose.model("Product", productSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, default: 1 },
    }],
});
const Cart = mongoose.model("Cart", cartSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
    }],
    totalAmount: { type: Number, required: true },
    paymentId: { type: String },
    orderId: { type: String, required: true },
    status: { type: String, default: "pending" },
    createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model("Order", orderSchema);

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        console.log('Auth middleware: No token provided');
        return res.status(401).json({ message: "No token provided" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Auth middleware: Token decoded:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware: Invalid token:', error.message);
        res.status(401).json({ message: "Invalid token", error: error.message });
    }
};

// Middleware to check master role
const masterMiddleware = async (req, res, next) => {
    try {
        console.log("masterMiddleware: req.user:", req.user);
        const user = await User.findById(req.user.id);
        console.log("masterMiddleware: User from DB:", user);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role !== "master") {
            return res.status(403).json({ message: "Access denied. Master only." });
        }
        next();
    } catch (error) {
        console.error("masterMiddleware error:", error);
        res.status(500).json({ message: "Server error in master middleware", error: error.message });
    }
};

// Routes
app.post("/api/register", async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Username already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role: role || "user" });
        await user.save();
        res.status(201).json({ message: "User registered" });
    } catch (error) {
        console.error("Register error:", error);
        res.status(400).json({ message: "Error registering user", error: error.message });
    }
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log("Login: Token generated for user:", { id: user._id, role: user.role });
        res.json({ token, role: user.role, username: user.username });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

app.get("/api/user", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('username role');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ username: user.username, role: user.role });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ message: "Error fetching user", error: error.message });
    }
});

app.post("/api/products", authMiddleware, masterMiddleware, upload.single("image"), async (req, res) => {
    const { name, price, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    try {
        if (!name || !price || !description) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const product = new Product({ name, price: parseFloat(price), description, image });
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error("Add product error:", error);
        res.status(400).json({ message: "Error adding product", error: error.message });
    }
});

app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
});

app.delete("/api/products/:id", authMiddleware, masterMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        await Product.deleteOne({ _id: id });
        // Remove product from all carts
        await Cart.updateMany(
            { "items.productId": id },
            { $pull: { items: { productId: id } } }
        );
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(400).json({ message: "Error deleting product", error: error.message });
    }
});

app.post("/api/cart", authMiddleware, async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            cart = new Cart({ userId: req.user.id, items: [] });
        }
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, quantity });
        }
        await cart.save();
        res.json(cart);
    } catch (error) {
        console.error("Add to cart error:", error);
        res.status(400).json({ message: "Error adding to cart", error: error.message });
    }
});

app.delete("/api/cart/remove", authMiddleware, async (req, res) => {
   const { productId } = req.body;
     try {
      let cart = await Cart.findOne({ userId: req.user.id });
             if (!cart) {
           return res.status(404).json({ message: "Cart not found" });
		    }
         cart.items = cart.items.filter(item => item.productId.toString() !== productId);
		    await cart.save();
		 // Now populate for client
		 const populatedCart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
		  res.json(populatedCart);
		 } catch (error) {
		 // ...
		 }
});


app.get("/api/cart", authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
        res.json(cart || { items: [] });
    } catch (error) {
        console.error("Get cart error:", error);
        res.status(500).json({ message: "Error fetching cart", error: error.message });
    }
});

app.post("/api/create-order", authMiddleware, async (req, res) => {
    const { amount, currency, receipt } = req.body;
    const options = {
        amount: amount * 100, // Convert to paise
        currency,
        receipt,
    };
    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Create order error:", error);
        res.status(500).json({ message: "Error creating order", error: error.message });
    }
});

app.post("/api/orders", authMiddleware, async (req, res) => {
    const { items, totalAmount, paymentId, orderId } = req.body;
    try {
        const order = new Order({
            userId: req.user.id,
            items,
            totalAmount,
            paymentId,
            orderId,
            status: "completed",
        });
        await order.save();
        await Cart.findOneAndUpdate({ userId: req.user.id }, { items: [] });
        res.json(order);
    } catch (error) {
        console.error("Save order error:", error);
        res.status(400).json({ message: "Error saving order", error: error.message });
    }
});

app.get("/api/orders", authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).populate("items.productId");
        res.json(orders);
    } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));