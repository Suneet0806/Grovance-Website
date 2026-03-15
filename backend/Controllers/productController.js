const pool = require("../db");

exports.getProducts = async (req,res)=>{
    try{
        const result = await pool.query("SELECT * FROM products");
        res.json(result.rows);
    }catch(err){
        res.status(500).send(err);
    }
};

exports.addProduct = async (req,res)=>{
    const {title,price,category,description,college,sellername,sellerphone} = req.body;

    try{
        const result = await pool.query(
            "INSERT INTO products(title,price,category,description,college,sellername,sellerphone) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
            [title,price,category,description,college,sellername,sellerphone]
        );

        res.json(result.rows[0]);
    }catch(err){
        res.status(500).send(err);
    }
};