import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "medilink-secret-key";
const JWT_EXPIRES_IN = "7d";

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  
  req.user = decoded;
  next();
}

export function userOnly(req, res, next) {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Access denied. Users only." });
  }
  next();
}

export function pharmacyOnly(req, res, next) {
  if (req.user.role !== "pharmacy") {
    return res.status(403).json({ message: "Access denied. Pharmacies only." });
  }
  next();
}
