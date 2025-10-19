import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import atmRoutes from './routes/atmRoutes.js';
import { connectDB } from './config/db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/atm', atmRoutes);

export default app;
