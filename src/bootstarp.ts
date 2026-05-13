import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { PORT } from './config';
import userRouter from './modules/users/users.controller';
import authRouter from './modules/auth/auth.controller';
import postRouter from './modules/posts/posts.controller';
import storyRouter from './modules/stories/stories.controller';
import uploadRouter from './modules/uploads/uploads.controller';
//import { IAppError } from './utils/types/error';
import {  AppError, NotFoundError } from './utils/errorHandle/resHandle';
import redisClient from './utils/redisClient';
import { dbConnection } from './db/dbConnection';

const app : Express = express();
export const bootstrap = async() => {
    await redisClient.connect(); 
    await dbConnection();  
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.get('/test', (req, res) => {
    res.json({ message: 'Express works ✅' });
    });
    app.use('/auth', authRouter);
    app.use('/users', userRouter);
    app.use('/posts', postRouter);
    app.use('/stories', storyRouter);
    app.use('/uploads', uploadRouter);
    app.all('/{*path}', (req:Request, res:Response) => {
       throw new NotFoundError(`url not found: ${req.path}`);   
    });
    app.use((err:AppError, req:Request, res:Response,next:NextFunction) => {
        res.status(err.statusCode || 500).json({ errMsg: err.message,status:err.statusCode || 500 });
    });
app.listen(PORT || 3002, () => {
    console.log(`Server is running on port ${process.env.PORT || 3002}`);
}); 
    }
   
