import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import atmRoutes from './routes/atmRoutes.js';
import accountRoutes from './routes/accountRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (if needed for frontend)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`\n${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Connect to database
connectDB();

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/atm', atmRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'ATM Banking System API',
    endpoints: {
      health: 'GET /',
      accounts: {
        create: 'POST /api/accounts',
        getAll: 'GET /api/accounts',
        getOne: 'GET /api/accounts/:cardNo',
        delete: 'DELETE /api/accounts/:cardNo'
      },
      atm: {
        transaction: 'POST /api/atm/transaction',
        status: 'GET /api/atm/status',
        emergencyRelease: 'POST /api/atm/emergency-release'
      }
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    status: 'ERROR',
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      'POST /api/accounts',
      'GET /api/accounts',
      'GET /api/accounts/:cardNo',
      'DELETE /api/accounts/:cardNo',
      'POST /api/atm/transaction',
      'GET /api/atm/status',
      'POST /api/atm/emergency-release'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    status: 'ERROR',
    message: 'Internal server error',
    error: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 ATM Banking System Server Started');
  console.log('='.repeat(60));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/`);
  console.log('='.repeat(60) + '\n');
});

export default app;