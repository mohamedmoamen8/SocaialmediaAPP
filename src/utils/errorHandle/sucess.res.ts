import { Response } from "express";

interface ISuccessRes {
  res:Response;
  data?:object;
  message:string
  status?:number;
}


export const SuccessRes = ({res,message="Done",data={},status=200}:ISuccessRes) => {
 res.status(status).json({ message, data });
};
