import express from 'express';
import userRoutes from './user';
import connectionRoutes from './connections';
import walletRoutes from './wallet';
import settingRoutes from './setting';

const app = express();

app.use('/users', userRoutes);
app.use('/connections', connectionRoutes);
app.use('/wallet', walletRoutes);
app.use('/setting', settingRoutes);

export default app;
