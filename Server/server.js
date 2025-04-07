import express from 'express';
import cors from 'cors';
import connectDB from './Config/mongo.js';
import 'dotenv/config';
import userRouter from './Routes/userRoutes.js';
import imageRouter from './Routes/imageRoutes.js';

const PORT = process.env.PORT || 4000;
const app = express();

app.use(express.json())
app.use(cors())
await connectDB()


app.use('/api/user', userRouter)
app.use('/api/image', imageRouter)

app.get('/', (req, res) => {
  res.send('Hello from Imagify server! Kaise hai aap log')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})