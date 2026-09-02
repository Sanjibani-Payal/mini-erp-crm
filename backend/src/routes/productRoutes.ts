import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getStockMovements,
} from '../controllers/productController';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

// Read: All authenticated roles
router.get('/', getProducts);
router.get('/stock-movements', getStockMovements);
router.get('/:id', getProductById);

// Create / Edit Products: Admin, Warehouse
router.post('/', requireRoles(['ADMIN', 'WAREHOUSE']), createProduct);
router.put('/:id', requireRoles(['ADMIN', 'WAREHOUSE']), updateProduct);

// Adjust stock: Admin, Warehouse
router.post('/:id/adjust-stock', requireRoles(['ADMIN', 'WAREHOUSE']), adjustStock);

export default router;
