import { Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import prisma from '../prisma';
import { hasAcceptedConnection } from '../services/networkService';

const PRODUCT_IMAGE_PREFIX = 'local:';
const productImageDir = () => path.resolve(process.cwd(), 'uploads/product-images');
const isLocalProductImage = (value?: string | null) => Boolean(value?.startsWith(PRODUCT_IMAGE_PREFIX));
const storageNameFromImageUrl = (value?: string | null) =>
  isLocalProductImage(value) ? String(value).slice(PRODUCT_IMAGE_PREFIX.length) : null;

const removeLocalProductImage = async (imageUrl?: string | null) => {
  const storageName = storageNameFromImageUrl(imageUrl);
  if (!storageName) return;
  const baseDir = productImageDir();
  const filePath = path.resolve(baseDir, storageName);
  if (filePath.startsWith(baseDir)) {
    await fs.remove(filePath).catch(() => {});
  }
};

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
      ...(body.unit !== undefined ? { unit: String(body.unit || '').trim() || 'unité' } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: String(body.imageUrl || '').trim() || null } : {}),
      ...(priceHT !== undefined ? { priceHT } : {}),
      ...(tvaRate !== undefined ? { tvaRate } : {}),
    },
  };
};

const assertActiveTvaRate = async (rate?: number) => {
  if (rate === undefined) return true;
  const found = await prisma.tvaRate.findFirst({ where: { rate, active: true } });
  if (found) return true;
  const configuredCount = await prisma.tvaRate.count();
  return configuredCount === 0 && [0, 7, 13, 19].includes(rate);
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
    const file = (req as any).file;
    const validation = validateProductPayload(req.body);
    if (validation.error || !validation.data) {
      if (file?.path) await fs.remove(file.path).catch(() => {});
      return res.status(400).json({ message: validation.error });
    }
    if (!(await assertActiveTvaRate(validation.data.tvaRate ?? 19))) {
      if (file?.path) await fs.remove(file.path).catch(() => {});
      return res.status(400).json({ message: 'TVA rate is not active.' });
    }

    const product = await prisma.product.create({
      data: {
        companyId: (req as any).company.id,
        code: validation.data.code ?? null,
        category: validation.data.category ?? null,
        name: validation.data.name,
        description: validation.data.description ?? null,
        priceHT: validation.data.priceHT as number,
        tvaRate: validation.data.tvaRate ?? 19,
        unit: validation.data.unit ?? 'unité',
        imageUrl: file ? `${PRODUCT_IMAGE_PREFIX}${file.filename}` : validation.data.imageUrl ?? null
      }
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file;
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
      if (file?.path) await fs.remove(file.path).catch(() => {});
      return res.status(400).json({ message: validation.error });
    }
    if (!(await assertActiveTvaRate(validation.data.tvaRate))) {
      if (file?.path) await fs.remove(file.path).catch(() => {});
      return res.status(400).json({ message: 'TVA rate is not active.' });
    }

    const shouldRemoveImage = req.body.removeImage === 'true' || req.body.removeImage === true;
    const data: any = { ...validation.data };
    if (file) {
      await removeLocalProductImage(product.imageUrl);
      data.imageUrl = `${PRODUCT_IMAGE_PREFIX}${file.filename}`;
    } else if (shouldRemoveImage) {
      await removeLocalProductImage(product.imageUrl);
      data.imageUrl = null;
    } else if (validation.data.imageUrl !== undefined && validation.data.imageUrl !== product.imageUrl) {
      await removeLocalProductImage(product.imageUrl);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id as string },
      data
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

    await removeLocalProductImage(product.imageUrl);

    await prisma.product.delete({
      where: { id: req.params.id as string }
    });

    res.status(200).json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProductImage = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const product = await prisma.product.findUnique({ where: { id: req.params.id as string } });
    if (!product || !isLocalProductImage(product.imageUrl)) {
      return res.status(404).json({ message: 'Product image not found' });
    }

    const allowed = product.companyId === companyId || await hasAcceptedConnection(companyId, product.companyId);
    if (!allowed) {
      return res.status(403).json({ message: 'Not allowed to view this product image.' });
    }

    const storageName = storageNameFromImageUrl(product.imageUrl);
    const baseDir = productImageDir();
    const filePath = path.resolve(baseDir, storageName || '');
    if (!filePath.startsWith(baseDir) || !(await fs.pathExists(filePath))) {
      return res.status(404).json({ message: 'Product image not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const importProducts = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No rows to import.' });
    }
    if (rows.length > 500) {
      return res.status(400).json({ message: 'Maximum 500 products per import.' });
    }

    const errors: Array<{ row: number; message: string }> = [];
    const validRows: any[] = [];

    rows.forEach((row: any, index: number) => {
      const validation = validateProductPayload(row);
      if (validation.error || !validation.data) {
        errors.push({ row: index + 1, message: validation.error || 'Invalid row.' });
        return;
      }
      validRows.push({
        companyId,
        code: validation.data.code ?? null,
        category: validation.data.category ?? null,
        name: validation.data.name,
        description: validation.data.description ?? null,
        priceHT: validation.data.priceHT as number,
        tvaRate: validation.data.tvaRate ?? 19,
        unit: validation.data.unit ?? 'unité',
        imageUrl: validation.data.imageUrl ?? null,
      });
    });

    const activeRates = await prisma.tvaRate.findMany({ where: { active: true }, select: { rate: true } });
    const allowedRates = activeRates.length ? activeRates.map((item) => item.rate) : [0, 7, 13, 19];
    const filteredRows = validRows.filter((row, index) => {
      if (allowedRates.includes(row.tvaRate)) return true;
      errors.push({ row: index + 1, message: 'TVA rate is not active.' });
      return false;
    });

    if (filteredRows.length) {
      await prisma.product.createMany({ data: filteredRows });
    }

    res.status(200).json({
      imported: filteredRows.length,
      skipped: rows.length - filteredRows.length,
      errors,
    });
  } catch (error) {
    console.error('Product import error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
