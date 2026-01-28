import express from "express";
import cors from "cors";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

async function main() {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const PORT = 3001;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch(console.error);
