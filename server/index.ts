import express from "express";
import cors from "cors";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function main() {
  try {
    await setupAuth(app);
    registerAuthRoutes(app);
    console.log("Auth setup complete");
  } catch (error) {
    console.error("Auth setup failed:", error);
  }

  const PORT = 3001;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
