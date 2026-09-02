import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, customerType } = req.query;

    const whereClause: any = {};

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search } },
        { businessName: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    }

    if (customerType && typeof customerType === 'string' && customerType !== 'ALL') {
      whereClause.customerType = customerType;
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { challans: true, followUps: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(customers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
        },
        challans: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.json(customer);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch customer details', error: error.message });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    if (!name || !mobile || !businessName || !customerType) {
      return res.status(400).json({
        message: 'Name, Mobile, Business Name, and Customer Type are required',
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email: email || null,
        businessName,
        gstNumber: gstNumber || null,
        customerType: customerType || 'Retail',
        address: address || null,
        status: status || 'Lead',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null,
        followUps: notes
          ? {
              create: [
                {
                  note: `Initial Note: ${notes}`,
                  createdBy: req.user?.name || 'System',
                },
              ],
            }
          : undefined,
      },
      include: {
        followUps: true,
      },
    });

    return res.status(201).json(customer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ message: 'Failed to create customer', error: error.message });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        mobile,
        email,
        businessName,
        gstNumber,
        customerType,
        address,
        status,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes,
      },
    });

    return res.json(updatedCustomer);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update customer', error: error.message });
  }
};

export const addFollowUpNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const newNote = await prisma.customerNote.create({
      data: {
        customerId: id,
        note: note.trim(),
        createdBy: req.user?.name || 'Staff User',
      },
    });

    return res.status(201).json(newNote);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to add follow-up note', error: error.message });
  }
};
