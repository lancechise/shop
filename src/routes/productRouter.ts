// require the express module
import express from "express";
import Product from "../models/Product";
import { getClient } from "../db";
import { ObjectId } from "mongodb";

export const productRouter = express.Router();

const errorResponse = (error: any, res: any) => {
  console.error("FAIL", error);
  res.status(500).json({ message: "Internal Server Error" });
};



productRouter.get("/products", async (req, res) => {
  {
    let maxPrice: number | null = Number(req.query["max-price"]);
    if (isNaN(maxPrice)) {
      maxPrice = null;
    }
    const includes: string | null = (req.query.includes as string) || null;
    let limit: number | null = Number(req.query.limit);
    if (isNaN(limit)) {
      limit = null;
    }

     const query: any = {};
    if (maxPrice) {
      query.price = { $lte: maxPrice };
    }
    if (includes) {
      query.name = new RegExp(`${includes}`, "i");
    }

    const client = await getClient();
    const cursor = client.db().collection<Product>("products").find(query);
    if (limit) {
      cursor.limit(limit);
    }
    const result = await cursor.toArray();
    res.status(200).json(result);
  } catch (err) {
    errorResponse(err, res);
  }
});


productRouter.get("/products/:id", async (req, res) => {
   {
    const _id = new ObjectId(req.params.id);
    const client = await getClient();
    const result = await client
      .db()
      .collection<Product>("products")
      .findOne({ _id: _id });
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "Not Found" });
    }
  } catch (err) {
    errorResponse(err, res);
  }
});

productRouter.post("/products", async (req, res) => {
   {
    const product: Product = req.body as Product;
    const client = await getClient();
    await client.db().collection<Product>("products").insertOne(product);
    res.status(201).json(product);
  } catch (err) {
    errorResponse(err, res);
  }
});

productRouter.delete("/products/:id", async (req, res) => {
   {
    const _id = new ObjectId(req.params.id);
    const client = await getClient();
    const result = await client
      .db()
      .collection<Product>("products")
      .deleteOne({ _id: _id });
    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Not Found" });
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    errorResponse(err, res);
  }
});

productRouter.put("/products/:id", async (req, res) => {
  try {
    const updatedProduct: Product = req.body as Product;
    delete updatedProduct._id;
    const _id = new ObjectId(req.params.id);
    const client = await getClient();
    const result = await client
      .db()
      .collection<Product>("products")
      .replaceOne({ _id: _id }, updatedProduct);
    if (result.modifiedCount === 0) {
      res.status(404).json({ message: "Product not found" });
    } else {
      updatedProduct._id = _id;
      res.status(200).json(updatedProduct);
    }
  } catch (err) {
    errorResponse(err, res);
  }
});

export default productRouter;