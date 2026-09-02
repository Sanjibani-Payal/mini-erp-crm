# Mini ERP + CRM Operations Portal

A complete, production-ready Full Stack ERP and CRM Operations Portal designed for wholesale and distribution companies. This system manages customer leads, product stock inventory with low-stock alerts, stock movement logs, and sales challans with automatic inventory deduction and stock validation.

---

## 🔑 Test Login Credentials

The system includes 4 role-based accounts seeded into the database out-of-the-box:

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `Password123!` | Full unrestricted access across all modules |
| **Sales** | `sales@company.com` | `Password123!` | Manage Customer CRM, add follow-ups & create Sales Challans |
| **Warehouse** | `warehouse@company.com` | `Password123!` | Manage Products, adjust stock levels & view movement logs |
| **Accounts** | `accounts@company.com` | `Password123!` | View Customers, view Sales Challans & financial reports |

> 💡 **Quick Switcher in UI**: The frontend portal includes a 1-click **Quick Switcher** bar at the top of the screen so reviewers can switch between roles instantly without typing credentials!

---

## 🏗️ Architecture & Business Logic Highlights

### Tech Stack
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, JWT, BcryptJS.
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, React Router DOM.
- **Database**: PostgreSQL (Cloud via Neon/Render) / SQLite (Zero-config local dev).

### Core Business Logic Implemented
1. **Role-Based Access Control (RBAC)**: Enforced via Express JWT middleware and frontend UI guards.
2. **Customer CRM**: Complete lifecycle management (`Lead`, `Active`, `Inactive`) with timestamped follow-up note histories.
3. **Stock Movement Audit Trail**: Every stock change (manual adjustment or sales challan confirmation) records a immutable `StockMovement` entry (`IN` or `OUT`) tracking quantity, reason, staff user, and timestamp.
4. **Sales Challan & Negative Stock Guard**:
   - Challans can be created as `Draft` or `Confirmed`.
   - When a challan is `Confirmed`, product stock is automatically decremented.
   - **Stock Guard**: If requested quantity exceeds available stock, the API blocks the request with HTTP 400 error detailing the exact stock shortfall.
   - **Item Price Snapshot**: Challan items store price and SKU snapshots at the time of order so future product catalog price updates do not retroactively modify historical financial records.

---

## ⚡ Local Setup Guide (Run in 2 Minutes)

### Prerequisites
- Node.js (v18+ recommended)
- Git

### 1. Run Backend Server
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev
```
*Backend API will run at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)*.

### 2. Run Frontend Portal
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend application will open at `http://localhost:3000`*.

---

## 📬 Postman Collection Usage

1. Open Postman and click **Import**.
2. Select the `postman_collection.json` file located in the root of this project repository.
3. Environment variables:
   - `baseUrl`: `http://localhost:5000`
   - `token`: Automatically populated upon calling the **Login** endpoints in the collection!

---

## 🚀 Step-by-Step Deployment Guide (For Beginners)

Follow this step-by-step guide to deploy the entire project online for free in ~10 minutes using **GitHub + Neon + Render + Vercel**.

### Step 1: Push Code to GitHub
1. Create a free account on [GitHub.com](https://github.com).
2. Create a new public repository named `mini-erp-crm`.
3. Push your project code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Mini ERP CRM assignment"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/mini-erp-crm.git
   git push -u origin main
   ```

---

### Step 2: Set Up Free PostgreSQL Database on Neon.tech
1. Go to [Neon.tech](https://neon.tech) and sign up for a free account.
2. Click **Create Project** and name it `mini-erp-db`.
3. Copy your PostgreSQL Connection String URL (it looks like `postgresql://alex:abc123xyz@ep-cool-db.us-east-2.aws.neon.tech/neondb?sslmode=require`).
4. In your `backend/prisma/schema.prisma` file, change line 6 to:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Commit and push this change to GitHub:
   ```bash
   git add .
   git commit -m "Switch Prisma provider to PostgreSQL for Neon cloud"
   git push
   ```

---

### Step 3: Deploy Backend API on Render.com
1. Go to [Render.com](https://render.com) and create a free account.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `mini-erp-crm`.
4. Configure service settings:
   - **Name**: `mini-erp-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push && npx ts-node prisma/seed.ts && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: *(Paste your Neon connection string from Step 2)*
   - `JWT_SECRET`: `mini_erp_crm_super_secret_jwt_key_2026`
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
6. Click **Create Web Service**.
7. Once deployed, copy your Live Backend URL (e.g. `https://mini-erp-backend.onrender.com`).

---

### Step 4: Deploy Frontend Portal on Vercel
1. Go to [Vercel.com](https://vercel.com) and sign up for a free account using your GitHub login.
2. Click **Add New...** -> **Project**.
3. Import your `mini-erp-crm` GitHub repository.
4. Configure framework settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
5. Expand **Environment Variables** and add:
   - `VITE_API_URL`: `https://mini-erp-backend.onrender.com/api` *(Replace with your live Render backend URL from Step 3)*
6. Click **Deploy**.
7. In ~1 minute, your site will be live at `https://mini-erp-crm.vercel.app`!

---

## 📌 Known Limitations & Future Enhancements

1. **PDF Generation**: Invoices & Challan PDFs can be exported using `jspdf` or `html2pdf.js` in a future release.
2. **S3 Image Upload**: Product images can be integrated with AWS S3 or Cloudinary.
3. **Advanced Filtering**: Date range pickers for financial reporting over multi-year periods.
