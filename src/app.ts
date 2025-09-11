import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import globalErrorHandler from "./app/middlewares/globalErrorhandler";
import router from "./app/routes/route";
import notFound from "./app/middlewares/notFound";




const app: Application = express();

// Middleware setup
// Allow all origins, methods, and credentials if needed
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  // Allow the request origin or fall back to a default if not present
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", ["http://localhost:3000","http://localhost:3001","https://admin.arborapackaging.com"]); 
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PATCH,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return; // Ensure the function exits after handling OPTIONS
  }

  next();
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req: Request, res: Response) => {
  res.send("Server is running!");
});

app.use("/api/v1", router);

app.use(globalErrorHandler);

app.use(notFound);



export default app;







