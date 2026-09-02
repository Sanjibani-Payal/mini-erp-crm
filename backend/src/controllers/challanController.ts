import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// Helper to generate unique Challan Number
const generateChallanNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.challan.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `CH-${dateStr}-${sequence}`;
};

export const getChallans = async (req: AuthRequest, res: Response) => {
  try {
    const { status, customerId, search } = req.query;

    const whereClause: any = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    }

    if (customerId && typeof customerId === 'string' && customerId !== 'ALL') {
      whereClause.customerId = customerId;
    }

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { challanNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
      ];
    }

    const challans = await prisma.challan.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, name: true, businessName: true, mobile: true, email: true },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(challans);
  } catch (error: any) {
    console.error('Error fetching challans:', error);
    return res.status(500).json({ message: 'Failed to fetch sales challans', error: error.message });
  }
};

export const getChallanById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!challan) {
      return res.status(404).json({ message: 'Sales Challan not found' });
    }

    return res.json(challan);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch challan details', error: error.message });
  }
};

export const createChallan = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, items, status } = req.body;
    // items is array of { productId: string, quantity: number }
    // status: 'Draft' | 'Confirmed'

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Customer ID and at least one item with quantity are required',
      });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const challanStatus = status === 'Confirmed' ? 'Confirmed' : 'Draft';

    // Fetch product details for all requested items
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate products existence and stock availability if Confirmed
    let totalQuantity = 0;
    let totalAmount = 0;
    const challanItemsData: any[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product ID '${item.productId}' not found` });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: `Invalid quantity for product ${product.name}` });
      }

      if (challanStatus === 'Confirmed' && product.currentStock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Current available stock: ${product.currentStock}, requested quantity: ${qty}. Stock cannot go negative.`,
        });
      }

      const subtotal = product.unitPrice * qty;
      totalQuantity += qty;
      totalAmount += subtotal;

      challanItemsData.push({
        productId: product.id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: qty,
        subtotal,
      });
    }

    const challanNumber = await generateChallanNumber();

    // Execute in transaction
    const newChallan = await prisma.$transaction(async (tx) => {
      // 1. Create Challan
      const created = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          totalAmount,
          status: challanStatus,
          createdBy: req.user?.name || 'Sales Staff',
          items: {
            create: challanItemsData,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // 2. If Confirmed, reduce stock and record OUT movements
      if (challanStatus === 'Confirmed') {
        for (const item of challanItemsData) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan ${challanNumber} Confirmed`,
              createdBy: req.user?.name || 'Sales Staff',
            },
          });
        }
      }

      return created;
    });

    return res.status(201).json(newChallan);
  } catch (error: any) {
    console.error('Error creating sales challan:', error);
    return res.status(500).json({ message: 'Failed to create sales challan', error: error.message });
  }
};

export const updateChallanStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Confirmed' | 'Cancelled'

    if (!status || (status !== 'Confirmed' && status !== 'Cancelled')) {
      return res.status(400).json({ message: "Status must be 'Confirmed' or 'Cancelled'" });
    }

    const existingChallan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingChallan) {
      return res.status(404).json({ message: 'Sales Challan not found' });
    }

    if (existingChallan.status === status) {
      return res.status(400).json({ message: `Challan is already in status '${status}'` });
    }

    if (existingChallan.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cancelled challans cannot be re-processed.' });
    }

    if (existingChallan.status === 'Confirmed' && status === 'Cancelled') {
      // Revert stock (Optional bonus handling: put stock back IN)
      const updated = await prisma.$transaction(async (tx) => {
        for (const item of existingChallan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'IN',
              reason: `Reversal for Cancelled Challan ${existingChallan.challanNumber}`,
              createdBy: req.user?.name || 'System',
            },
          });
        }

        return tx.challan.update({
          where: { id },
          data: { status: 'Cancelled' },
          include: { customer: true, items: true },
        });
      });

      return res.json(updated);
    }

    if (existingChallan.status === 'Draft' && status === 'Confirmed') {
      // Validate stock for all items
      const productIds = existingChallan.items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of existingChallan.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productNameSnapshot} no longer exists` });
        }
        if (product.currentStock < item.quantity) {
          return res.status(400).json({
            message: `Cannot confirm challan! Insufficient stock for '${product.name}' (SKU: ${product.sku}). Current stock: ${product.currentStock}, required: ${item.quantity}.`,
          });
        }
      }

      // Execute transaction: deduct stock and update status
      const updated = await prisma.$transaction(async (tx) => {
        for (const item of existingChallan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan ${existingChallan.challanNumber} Confirmed`,
              createdBy: req.user?.name || 'Sales Staff',
            },
          });
        }

        return tx.challan.update({
          where: { id },
          data: { status: 'Confirmed' },
          include: { customer: true, items: true },
        });
      });

      return res.json(updated);
    }

    const simpleUpdated = await prisma.challan.update({
      where: { id },
      data: { status },
      include: { customer: true, items: true },
    });

    return res.json(simpleUpdated);
  } catch (error: any) {
    console.error('Error updating challan status:', error);
    return res.status(500).json({ message: 'Failed to update challan status', error: error.message });
  }
};
