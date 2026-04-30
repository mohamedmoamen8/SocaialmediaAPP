import { Router,type Router as RouterType } from "express";
import { SuccessRes } from "../../utils/errorHandle/sucess.res";

import { authentication } from "../../middleware/auth.middleware";
import { validation } from "../../middleware/validation.middleware";
import userServices from "./user.services";
import { AppError } from "../../utils/errorHandle/resHandle";
import { updatePasswordSchema } from "../auth/auth.validation";
let router : RouterType = Router();

router.get('/users', async (req, res, next) => {
    try {
        const data = await userServices.getAllUsers();
        SuccessRes({ res, data, message: 'Users retrieved successfully' });
    } catch (error) {
        next(error);
    }
});
router.get('/users/email', async (req, res, next) => {
    try {
        const email = req.query.email as string;
        const user = await userServices.getUserByEmail(email);
        if (!user) throw new AppError('User not found', 404);
        SuccessRes({ res, data: user,message: 'User found successfully' });
    } catch (error) {
        next(error);
    }
});
router.patch('/update-password', authentication, validation(updatePasswordSchema), async (req, res, next) => 
    { try 
    { if (!req.user) throw new AppError('Unauthorized', 401); const { currentPassword, newPassword } = 
    req.body as { currentPassword: string; newPassword: string; }; const data = await userServices.updatePassword({ userId: req.user._id, currentPassword, newPassword, }); SuccessRes({ res, data, message: 'Password updated' }); } catch (error) { next(error); } });

export default router;