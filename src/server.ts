import { ApolloServer } from "apollo-server";
import { resolvers } from "./resolvers";
import { makeExecutableSchema } from "graphql-tools";
import fs from "fs";
import path from "path";

const typeDefs = fs.readFileSync(
  path.join(__dirname, "schema.graphql"),
  "utf-8"
);

const schema = makeExecutableSchema({ typeDefs, resolvers });

async function start() {
  const server = new ApolloServer({ schema });
  const { url } = await server.listen({ port: 4000 });
  console.log(`Server ready at ${url}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
