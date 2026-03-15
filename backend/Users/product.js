const router = require("express").Router();
const { getProducts, addProduct } = require("../controllers/productController");

router.get("/", getProducts);
router.post("/", addProduct);

module.exports = router;