"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getProducts = async (req, res) => {
    try {
        const products = await prisma_1.default.product.findMany({
            where: { companyId: req.company.id },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(products);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const product = await prisma_1.default.product.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const { code, name, description, priceHT, tvaRate } = req.body;
        if (!name || priceHT === undefined) {
            return res.status(400).json({ message: 'Name and price are required' });
        }
        const product = await prisma_1.default.product.create({
            data: {
                companyId: req.company.id,
                code,
                name,
                description,
                priceHT,
                tvaRate: tvaRate || 19
            }
        });
        res.status(201).json(product);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const product = await prisma_1.default.product.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const { code, name, description, priceHT, tvaRate } = req.body;
        const updatedProduct = await prisma_1.default.product.update({
            where: { id: req.params.id },
            data: { code, name, description, priceHT, tvaRate }
        });
        res.status(200).json(updatedProduct);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const product = await prisma_1.default.product.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        await prisma_1.default.product.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: 'Product removed' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteProduct = deleteProduct;
