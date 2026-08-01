const Product = require("../models/Product");

// GET PRODUCTS
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching products");
    }
};

// ADD PRODUCT
exports.addProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error adding product");
    }
};