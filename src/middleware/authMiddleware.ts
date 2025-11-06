import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  // Bearer <token> so the [1] tells we are taking the token from this
  const token = authHeader.split(" ")[1];

  try {
    const jwtsecret = process.env.JWT_SECRET;
    if (!jwtsecret) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }
    const decoded = jwt.verify(token, jwtsecret);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
