import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import authPlugin from "./plugins/auth-plugin.js";
import { AuthzError } from "./authz/policies.js";
import profilesRoutes from "./routes/profiles.js";
import offeringsRoutes from "./routes/offerings.js";

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean),
});

// Health check must stay public — Cloud Run's readiness probe hits this
// before any auth context exists.
fastify.get("/health", { config: { public: true } }, async () => ({ status: "ok" }));

await fastify.register(authPlugin);
await fastify.register(profilesRoutes);
await fastify.register(offeringsRoutes);

fastify.setErrorHandler((err, _request, reply) => {
  if (err instanceof AuthzError) {
    reply.code(err.statusCode).send({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    reply.code(400).send({ error: "Validation failed", details: err.issues });
    return;
  }
  fastify.log.error(err);
  reply.code(500).send({ error: "Internal server error" });
});

const port = Number(process.env.PORT ?? 8080);
await fastify.listen({ host: "0.0.0.0", port });
