import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
} from '../controllers/challanController';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

// Read: Admin, Sales, Warehouse, Accounts
router.get('/', requireRoles(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getChallans);
router.get('/:id', requireRoles(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getChallanById);

// Create Challan: Admin, Sales
router.post('/', requireRoles(['ADMIN', 'SALES']), createChallan);

// Update Status (Confirm / Cancel): Admin, Sales, Warehouse
router.patch('/:id/status', requireRoles(['ADMIN', 'SALES', 'WAREHOUSE']), updateChallanStatus);

export default router;
