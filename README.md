# Ask2 AI Regression GraphQL API Assessment

## Contents

1. [Description](#description)  
2. [Installation](#installation)  
3. [Running the Server](#running-the-server)  
4. [Design Decisions](#design-decisions)  
5. [API Proof-of-Concept](#api-proof-of-concept)  
6. [Open Questions](#open-questions)  

## Description

This project is a GraphQL API for running asynchronous regression jobs and retrieving results once they’re complete.

---

## Installation

1. Install dependencies: ```npm install```
2. Generate GraphQL TypeScript types: ```npm run codegen```

## Running the Server

1. Development (with hot reload): ```npm run start:dev```
2. Production: ```npm run start```

Server runs at http://localhost:4000/graphql.

## Design Decisions

### TypeScript + Code Generation
I used graphql-codegen for code generation and used the generated types in `./generated/graphql` for all resolver arguments, return types and enums. It provides type safety, ensures consistency with the schema and enables compile-time checks.
I initially tried manually defining types in typescript, but manual types can easily drift from the schema and raise runtime errors. Also, maintaining two separate files manually is error-prone and duplicate work for developers.

### In-memory storage
Jobs and models are stored in Map objects rather than using database or queue because it simplifies implementation and testing.  

### Server Framework Choice
I used Apollo Server to run the GraphQL API.It integrates seamlessly with graphql-tools and provides ready to use GraphQL Playground for testing, which is really convenient to use. Other alternatives, like Express-GraphQL, Yoga or Fastify GraphQL were considered. And Apollo was chosen for it's clean setup and easy to extend for subscriptions or authentication.

## API Proof-of-Concept

### Mutation: Start Regression Job
```graphql
mutation {
  startJob(
    points: [{x: 1.0, y: 2.0}, {x: 2.0, y: 3.0}]
    modelType: LASSO
  ) {
    id
    status
  }
}
```
Response:
```json
{
  "data": {
    "startJob": {
      "id": "8ca44f6b-88f4-4920-bb3c-11b50f5f110e",
      "status": "RUNNING"
    }
  }
}
```

### Query: Get Job Status
```graphql
query {
  job(id: "8ca44f6b-88f4-4920-bb3c-11b50f5f110e") {
    id
    status
    resultModelId
  }
}
```
Response:
```json
{
  "data": {
    "job": {
      "id": "8ca44f6b-88f4-4920-bb3c-11b50f5f110e",
      "status": "COMPLETED",
      "resultModelId": "05244650-de8d-4485-9e45-96bbcb92c808"
    }
  }
}
```

### Query: Get Model
```graphql
query {
  model(id: "05244650-de8d-4485-9e45-96bbcb92c808") {
    id
    modelType
    alpha
    trainedAt
    meta
  }
}
```
Response:
```json
{
  "data": {
    "model": {
      "id": "05244650-de8d-4485-9e45-96bbcb92c808",
      "modelType": "LASSO",
      "alpha": null,
      "trainedAt": "2025-09-15T02:30:51.634Z",
      "meta": "regression fitting - 2 points"
    }
  }
}
```

### Mutation: Prediction
```graphql
mutation {
  predict(modelId: "05244650-de8d-4485-9e45-96bbcb92c808", x: 5.0)
}
```
Response:
```json
{
  "data": {
    "predict": 6
  }
}
```

## Open Questions

1. The current implementation is polling for job status. GraphQL subscriptions or WebSockets could be more efficient and provide real-time updates for clients.
2. The regression jobs are long running, so if many clients submit jobs at the same time, server could become overloaded. For scalability, instead of running jobs directly in the API request life cycle, maybe jobs could be pushed to a queue and a worker picks them up from the queue and execute asynchronously. This way, the API server remain light weight and just handles requests and also multiple worker can run in parallel, leveraging multiple CPU cores or machines.
