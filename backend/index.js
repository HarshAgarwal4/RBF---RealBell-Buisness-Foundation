import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import mongoose from 'mongoose';
import { isLoggedIn } from './middlewares/Auth.js';
import { organizationRoutes } from './App/routes/organization.js';
import { connectRoutes } from './App/routes/connect.js';
import { communityRoutes } from './App/routes/community.js';

const app = express();

app.use(cookieParser())
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))
app.use(express.json());
app.use(isLoggedIn)

app.get('/', (req, res) => {
    res.send("Hello World");
})
app.use('/' , organizationRoutes)
app.use('/connect', connectRoutes)
app.use('/community', communityRoutes)

mongoose.connect(process.env.DB_URL, {
    dbName: "RBF"
}).then(() => {
    console.log("Connected to MongoDB Atlas")
    app.listen(process.env.PORT, () => {
        console.log("Server is running on port", process.env.PORT);
    })
})
