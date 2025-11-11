import express, { Request, Response } from "express";
import { router } from "./routes/v1";
import helmet from "helmet";
import cors from "cors";
import { startScheduleJobs } from "./services/schedulerServices";

const app = express();
app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "'data:'", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use("/api/v1", router);
startScheduleJobs();

app.listen(process.env.PORT || 8000);
