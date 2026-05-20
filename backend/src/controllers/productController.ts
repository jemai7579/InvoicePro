import { Request, Response } from 'express';
import prisma from '../prisma';

const parseOptionalNumber = (value: any) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const validateProductPayload = (body: any, partial = false) => {
  const name = typeof body.name === 'string' ? body.name.trim() : body.name;
  if (!partial && !name) {
    return { error: 'Name is required' };
  }
  if (body.name !== undefined && !name) {
    return { error: 'Name cannot be empty' };
  }

  const priceHT = parseOptionalNumber(body.priceHT);
  if (!partial && priceHT === undefined) {
    return { error: 'Price is required' };
  }
  if (priceHT === null || (priceHT !== undefined && priceHT < 0)) {
    return { error: 'Price must be a valid positive number' };
  }

  const tvaRate = parseOptionalNumber(body.tvaRate);
  if (tvaRate === null || (tvaRate !== undefined && (tvaRate < 0 || tvaRate > 100))) {
    return { error: 'TVA rate must be between 0 and 100' };
  }

  return {
    data: {
      ...(body.code !== undefined ? { code: body.code || null } : {}),
      ...(body.category !== undefined ? { category: body.category || null } : {}),
      ...(body.name !== undefined ? { name } : {}),
      ...(body.description !== undefined ? { description: body.description || null } : {}),
      ...(priceHT !== undefined ? { priceHT } : {}),
      ...(tvaRate !== undefined ? { tvaRate } : {}),
    },
  };
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { companyId: (req as any).company.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const validation = validateProductPayload(req.body);
    if (validation.error || !validation.data) {
      return res.status(400).json({ message: validation.error });
    }

    const product = await prisma.product.create({
      data: {
        companyId: (req as any).company.id,
        code: validation.data.code ?? null,
        category: validation.data.category ?? null,
        name: validation.data.name,
        description: validation.data.description ?? null,
        priceHT: validation.data.priceHT as number,
        tvaRate: validation.data.tvaRate ?? 19
      }
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const validation = validateProductPayload(req.body, true);
    if (validation.error || !validation.data) {
      return res.status(400).json({ message: validation.error });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id as string },
      data: validation.data
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id: req.params.id as string }
    });

    res.status(200).json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
