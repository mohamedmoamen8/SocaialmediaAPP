import bycrpt from 'bcrypt';
import { Salt } from '../config'; 
  



export const createHash = async (data:string):Promise<string>=>{
    const hash =await bycrpt.hash(data, Salt);
    return hash;
}

export const compareHash = async (data:string, hash:string):Promise<boolean>=>{
    const isMatch = await bycrpt.compare(data, hash);
    return isMatch;
}
