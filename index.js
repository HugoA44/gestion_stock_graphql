var express = require("express");
var { graphqlHTTP } = require("express-graphql");
var { buildSchema } = require("graphql");
const { default: fetch } = require("node-fetch");

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type Product {
    id: ID!
    name: String
    code: String
    stock: String
  }
  type Query {
    products: [Product]
    product_by_id(id: ID!): Product
  }
  type Mutation {
    insert_product(id: ID!, stock: Int!): Product
    increment_product(id: ID!, quantity: Int!): Product
    }
`);

var root = {
  products: async () => {
    const products_api =
      "https://world.openfoodfacts.org/api/v2/search?fields=id,code,product_name";
    const stock_api = "http://localhost:8080/api/products";

    const products_response = await fetch(products_api);
    const stock_response = await fetch(stock_api);

    const products_data = await products_response.json();
    const stock_data = await stock_response.json();

    return products_data.products.map((p) => {
      return {
        id: p.id,
        name: p.product_name,
        code: p.code,
        stock:
          stock_data.find((s) => Number(s.id) === Number(p.id))?.stock || 0,
      };
    });
  },
  product_by_id: async ({ id }) => {
    const product_api = `https://world.openfoodfacts.org/api/v2/search?fields=id,code,product_name&code=${id}`;
    const stock_api = `http://localhost:8080/api/products/${id}`;

    const product_response = await fetch(product_api);
    const stock_response = await fetch(stock_api);

    const product_data = await product_response.json();
    const stock_data = await stock_response.json();
    return {
      id: product_data.products[0].id,
      name: product_data.products[0].product_name,
      code: product_data.products[0].code,
      stock: stock_data.stock || 0,
    };
  },
  insert_product: async ({ id, stock }) => {
    const product_api = `https://world.openfoodfacts.org/api/v2/search?fields=id,code,product_name&code=${id}`;
    const stock_api = `http://localhost:8080/api/products`;

    const product_response = await fetch(product_api);
    const stock_response = await fetch(stock_api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
        stock: stock,
      }),
    });

    const product_data = await product_response.json();
    const stock_data = await stock_response.json();
    return {
      id: stock_data.id,
      name: product_data.products[0].product_name,
      code: product_data.products[0].code,
      stock: stock_data.stock,
    };
  },
  increment_product: async ({ id, quantity }) => {
    const product_api = `https://world.openfoodfacts.org/api/v2/search?fields=id,code,product_name&code=${id}`;
    const stock_api = `http://localhost:8080/api/stock/inc/${id}`;

    const product_response = await fetch(product_api);
    const stock_response = await fetch(stock_api, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity: quantity,
      }),
    });

    const product_data = await product_response.json();
    const stock_data = await stock_response.json();
    console.log(stock_data);
    return {
      id: stock_data.id,
      name: product_data.products[0].product_name,
      code: product_data.products[0].code,
      stock: stock_data.stock,
    };
  },
};

var app = express();
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);
app.listen(4000, () => {
  console.log("Running a GraphQL API server at localhost:4000/graphql");
});
