"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.route('/')
    .get(authMiddleware_1.protect, productController_1.getProducts)
    .post(authMiddleware_1.protect, productController_1.createProduct);
router.route('/:id')
    .get(authMiddleware_1.protect, productController_1.getProductById)
    .put(authMiddleware_1.protect, productController_1.updateProduct)
    .delete(authMiddleware_1.protect, productController_1.deleteProduct);
exports.default = router;
