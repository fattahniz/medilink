import { storage } from "./storage.js";
import { hashPassword, comparePassword, generateToken, authMiddleware, userOnly, pharmacyOnly } from "./auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

export async function registerRoutes(httpServer, app) {
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  }, (await import("express")).default.static(uploadDir));

  app.post("/api/auth/register/user", async (req, res) => {
    try {
      const { full_name, email, password, phone, address, city } = req.body;

      if (!full_name || !email || !password) {
        return res.status(400).json({ message: "Full name, email, and password are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser({
        full_name,
        email,
        password_hash: hashPassword(password),
        phone: phone || null,
        address: address || null,
        city: city || null,
        status: "active",
      });

      const token = generateToken({ id: user.user_id, email: user.email, role: "user" });

      res.status(201).json({
        message: "Registration successful",
        token,
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          city: user.city,
        },
      });
    } catch (error) {
      console.error("User registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/register/pharmacy", async (req, res) => {
    try {
      const { pharmacy_name, owner_name, email, password, phone, city, latitude, longitude, address, opening_hours, license_no } = req.body;

      if (!pharmacy_name || !email || !password) {
        return res.status(400).json({ message: "Pharmacy name, email, and password are required" });
      }

      const existingPharmacy = await storage.getPharmacyByEmail(email);
      if (existingPharmacy) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const pharmacy = await storage.createPharmacy({
        pharmacy_name,
        owner_name: owner_name || null,
        email,
        password_hash: hashPassword(password),
        phone: phone || null,
        city: city || null,
        latitude: latitude || null,
        longitude: longitude || null,
        address: address || null,
        opening_hours: opening_hours || null,
        license_no: license_no || null,
        status: "active",
      });

      const token = generateToken({ id: pharmacy.pharmacy_id, email: pharmacy.email, role: "pharmacy" });

      res.status(201).json({
        message: "Registration successful",
        token,
        pharmacy: {
          pharmacy_id: pharmacy.pharmacy_id,
          pharmacy_name: pharmacy.pharmacy_name,
          email: pharmacy.email,
          city: pharmacy.city,
        },
      });
    } catch (error) {
      console.error("Pharmacy registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login/user", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !comparePassword(password, user.password_hash)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ message: "Account is inactive" });
      }

      const token = generateToken({ id: user.user_id, email: user.email, role: "user" });

      res.json({
        message: "Login successful",
        token,
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          city: user.city,
        },
      });
    } catch (error) {
      console.error("User login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/login/pharmacy", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const pharmacy = await storage.getPharmacyByEmail(email);
      if (!pharmacy || !comparePassword(password, pharmacy.password_hash)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (pharmacy.status !== "active") {
        return res.status(403).json({ message: "Account is inactive" });
      }

      const token = generateToken({ id: pharmacy.pharmacy_id, email: pharmacy.email, role: "pharmacy" });

      res.json({
        message: "Login successful",
        token,
        pharmacy: {
          pharmacy_id: pharmacy.pharmacy_id,
          pharmacy_name: pharmacy.pharmacy_name,
          email: pharmacy.email,
          city: pharmacy.city,
          latitude: pharmacy.latitude,
          longitude: pharmacy.longitude,
        },
      });
    } catch (error) {
      console.error("Pharmacy login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      if (req.user.role === "user") {
        const user = await storage.getUserById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({
          role: "user",
          user: {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            city: user.city,
          },
        });
      } else {
        const pharmacy = await storage.getPharmacyById(req.user.id);
        if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });
        res.json({
          role: "pharmacy",
          pharmacy: {
            pharmacy_id: pharmacy.pharmacy_id,
            pharmacy_name: pharmacy.pharmacy_name,
            email: pharmacy.email,
            city: pharmacy.city,
            latitude: pharmacy.latitude,
            longitude: pharmacy.longitude,
          },
        });
      }
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  app.post("/api/orders", authMiddleware, userOnly, upload.single("prescription"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Prescription image is required" });
      }

      const { description, radius_km, latitude, longitude } = req.body;

      const order = await storage.createOrder({
        user_id: req.user.id,
        image_url: `/uploads/${req.file.filename}`,
        description: description || null,
        radius_km: radius_km || "5.00",
        latitude: latitude || null,
        longitude: longitude || null,
        status: "pending",
      });

      if (latitude && longitude && radius_km) {
        const nearbyPharmacies = await storage.getNearbyPharmacies(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(radius_km)
        );

        for (const pharmacy of nearbyPharmacies) {
          await storage.createNotification({
            sender_id: req.user.id,
            sender_type: "user",
            receiver_id: pharmacy.pharmacy_id,
            receiver_type: "pharmacy",
            type: "order",
            message: `New prescription request within ${radius_km}km of your location`,
          });
        }
      }

      res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders", authMiddleware, userOnly, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUserId(req.user.id);
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.get("/api/orders/:orderId", authMiddleware, async (req, res) => {
    try {
      const order = await storage.getOrderById(parseInt(req.params.orderId));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Failed to get order" });
    }
  });

  app.get("/api/orders/:orderId/bids", authMiddleware, async (req, res) => {
    try {
      const bids = await storage.getBidsByOrderId(parseInt(req.params.orderId));
      res.json(bids);
    } catch (error) {
      console.error("Get bids error:", error);
      res.status(500).json({ message: "Failed to get bids" });
    }
  });

  app.patch("/api/orders/:orderId/cancel", authMiddleware, userOnly, async (req, res) => {
    try {
      const order = await storage.getOrderById(parseInt(req.params.orderId));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.user_id !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      if (order.status === "completed" || order.status === "cancelled") {
        return res.status(400).json({ message: "Cannot cancel this order" });
      }

      const updated = await storage.updateOrderStatus(order.order_id, "cancelled");
      res.json({ message: "Order cancelled", order: updated });
    } catch (error) {
      console.error("Cancel order error:", error);
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  app.get("/api/pharmacy/orders", authMiddleware, pharmacyOnly, async (req, res) => {
    try {
      const orders = await storage.getOrdersForPharmacy(req.user.id);
      res.json(orders);
    } catch (error) {
      console.error("Get pharmacy orders error:", error);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.post("/api/bids", authMiddleware, pharmacyOnly, async (req, res) => {
    try {
      const { order_id, price, message } = req.body;

      if (!order_id || !price) {
        return res.status(400).json({ message: "Order ID and price are required" });
      }

      const order = await storage.getOrderById(parseInt(order_id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.status === "completed" || order.status === "cancelled") {
        return res.status(400).json({ message: "Cannot bid on this order" });
      }

      const bid = await storage.createBid({
        order_id: parseInt(order_id),
        pharmacy_id: req.user.id,
        price: price.toString(),
        message: message || null,
      });

      const pharmacy = await storage.getPharmacyById(req.user.id);
      await storage.createNotification({
        sender_id: req.user.id,
        sender_type: "pharmacy",
        receiver_id: order.user_id,
        receiver_type: "user",
        type: "bid",
        message: `${pharmacy.pharmacy_name} placed a bid of Rs. ${price}`,
      });

      res.status(201).json({ message: "Bid placed successfully", bid });
    } catch (error) {
      console.error("Create bid error:", error);
      res.status(500).json({ message: "Failed to place bid" });
    }
  });

  app.get("/api/pharmacy/bids", authMiddleware, pharmacyOnly, async (req, res) => {
    try {
      const bids = await storage.getBidsByPharmacyId(req.user.id);
      res.json(bids);
    } catch (error) {
      console.error("Get pharmacy bids error:", error);
      res.status(500).json({ message: "Failed to get bids" });
    }
  });

  app.patch("/api/bids/:bidId/accept", authMiddleware, userOnly, async (req, res) => {
    try {
      const bidId = parseInt(req.params.bidId);
      const bids = await storage.getBidsByOrderId(0);
      
      const bid = await storage.acceptBid(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      await storage.createNotification({
        sender_id: req.user.id,
        sender_type: "user",
        receiver_id: bid.pharmacy_id,
        receiver_type: "pharmacy",
        type: "bid",
        message: "Your bid has been accepted! Customer will visit soon.",
      });

      res.json({ message: "Bid accepted", bid });
    } catch (error) {
      console.error("Accept bid error:", error);
      res.status(500).json({ message: "Failed to accept bid" });
    }
  });

  app.patch("/api/bids/:bidId/reject", authMiddleware, userOnly, async (req, res) => {
    try {
      const bid = await storage.updateBidStatus(parseInt(req.params.bidId), "rejected");
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      await storage.createNotification({
        sender_id: req.user.id,
        sender_type: "user",
        receiver_id: bid.pharmacy_id,
        receiver_type: "pharmacy",
        type: "bid",
        message: "Your bid was rejected.",
      });

      res.json({ message: "Bid rejected", bid });
    } catch (error) {
      console.error("Reject bid error:", error);
      res.status(500).json({ message: "Failed to reject bid" });
    }
  });

  app.get("/api/notifications", authMiddleware, async (req, res) => {
    try {
      const receiverType = req.user.role === "user" ? "user" : "pharmacy";
      const notifications = await storage.getNotifications(req.user.id, receiverType);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.get("/api/notifications/unread-count", authMiddleware, async (req, res) => {
    try {
      const receiverType = req.user.role === "user" ? "user" : "pharmacy";
      const count = await storage.getUnreadNotificationCount(req.user.id, receiverType);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  app.patch("/api/notifications/:notificationId/read", authMiddleware, async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(parseInt(req.params.notificationId));
      res.json(notification);
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", authMiddleware, async (req, res) => {
    try {
      const receiverType = req.user.role === "user" ? "user" : "pharmacy";
      await storage.markAllNotificationsRead(req.user.id, receiverType);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  return httpServer;
}
