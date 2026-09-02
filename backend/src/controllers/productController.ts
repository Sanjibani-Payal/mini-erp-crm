import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, lowStockOnly } = req.query;

    const whereClause: any = {};

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
      ];
    }

    if (category && typeof category === 'string' && category !== 'ALL') {
      whereClause.category = category;
    }

    let products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    if (lowStockOnly === 'true') {
      products = products.filter((p) => p.currentStock <= p.minStockAlert);
    }

    return res.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch product details', error: error.message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;

    if (!name || !sku || !category || unitPrice === undefined || currentStock === undefined) {
      return res.status(400).json({
        message: 'Name, SKU, Category, Unit Price, and Initial Stock are required',
      });
    }

    // Check SKU unique
    const existingSku = await prisma.product.findUnique({ where: { sku: sku.trim() } });
    if (existingSku) {
      return res.status(400).json({ message: `SKU '${sku}' already exists in inventory.` });
    }

    const initialQty = parseInt(currentStock, 10);
    const price = parseFloat(unitPrice);
    const minAlert = minStockAlert ? parseInt(minStockAlert, 10) : 5;

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category: category.trim(),
        unitPrice: price,
        currentStock: initialQty,
        minStockAlert: minAlert,
        location: location || null,
        movements: initialQty > 0
          ? {
              create: [
                {
                  quantityChanged: initialQty,
                  movementType: 'IN',
                  reason: 'Initial stock intake upon product creation',
                  createdBy: req.user?.name || 'Warehouse Staff',
                },
              ],
            }
          : undefined,
      },
    });

    return res.status(201).json(product);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, unitPrice, minStockAlert, location } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : existing.unitPrice,
        minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert, 10) : existing.minStockAlert,
        location,
      },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

export const adjustStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantityChanged, movementType, reason } = req.body;

    if (!quantityChanged || !movementType || !reason) {
      return res.status(400).json({
        message: 'Quantity Changed, Movement Type (IN/OUT), and Reason are required',
      });
    }

    const qty = Math.abs(parseInt(quantityChanged, 10));
    const type = movementType.toUpperCase();

    if (type !== 'IN' && type !== 'OUT') {
      return res.status(400).json({ message: "Movement type must be 'IN' or 'OUT'" });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (type === 'OUT' && product.currentStock < qty) {
      return res.status(400).json({
        message: `Insufficient stock! Current stock is ${product.currentStock}, requested reduction is ${qty}. Stock cannot go negative.`,
      });
    }

    const newStock = type === 'IN' ? product.currentStock + qty : product.currentStock - qty;

    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { currentStock: newStock },
      }),
      prisma.stockMovement.create({
        data: {
          productId: id,
          quantityChanged: qty,
          movementType: type,
          reason: reason.trim(),
          createdBy: req.user?.name || 'System',
        },
      }),
    ]);

    return res.json({ product: updatedProduct, movement });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to adjust stock', error: error.message });
  }
};

export const getStockMovements = async (req: AuthRequest, res: Response) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: {
          select: { name: true, sku: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json(movements);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch stock movements', error: error.message });
  }
};
