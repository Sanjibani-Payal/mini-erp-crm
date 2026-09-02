import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUpNote,
} from '../controllers/customerController';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware';

const router = Router();

// Require token for all customer routes
router.use(authenticateToken);

// Read: Admin, Sales, Accounts
router.get('/', requireRoles(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomers);
router.get('/:id', requireRoles(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomerById);

// Create / Edit: Admin, Sales
router.post('/', requireRoles(['ADMIN', 'SALES']), createCustomer);
router.put('/:id', requireRoles(['ADMIN', 'SALES']), updateCustomer);
router.post('/:id/notes', requireRoles(['ADMIN', 'SALES', 'ACCOUNTS']), addFollowUpNote);

export default router;
