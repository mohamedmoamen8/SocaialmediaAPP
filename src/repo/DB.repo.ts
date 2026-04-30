import { HydratedDocument, Model,ProjectionType,QueryFilter,QueryOptions,Types } from "mongoose";
import { userModel } from "../db/models/user.models";
import { IUser } from "../modules/users/user.types";

export class DBRepo <TDocument>{
    constructor(public model: Model<TDocument>) {

    }
    async findById(id:Types.ObjectId,projection?: ProjectionType<TDocument>,options?:QueryOptions):Promise<HydratedDocument<TDocument> | null>{
        const doc = await this.model.findById(id, projection).exec();
        return doc;
    }
    async find(
        filter: QueryFilter<TDocument>,
        projection?: ProjectionType<TDocument>,
        options?: QueryOptions
    ): Promise<HydratedDocument<TDocument>[]> {
        const docs = await this.model.find(filter, projection, options).exec();
        return docs;    
    }
       async findOne(
        filter: QueryFilter<TDocument>,
        projection?: ProjectionType<TDocument>,
        options?: QueryOptions
    ): Promise<HydratedDocument<TDocument> | null> {
        const doc = await this.model.findOne(filter, projection, options).exec();
        return doc; 
    }
    async create(data: Partial<TDocument> | Array<Partial<TDocument>> ) :Promise<HydratedDocument<TDocument> | HydratedDocument<TDocument>[]> {
        if (Array.isArray(data)) {
            return await this.model.create(data);
        }
        return await this.model.create(data);
    }
    async findall(projection?: ProjectionType<TDocument>, options?: QueryOptions): Promise<HydratedDocument<TDocument>[]> {
        const docs = await this.model.find({}, projection, options).exec();
        return docs;
    }   
    async findByEmail(email:string,projection?: ProjectionType<TDocument>, options?: QueryOptions): Promise<HydratedDocument<TDocument> | null> {
        const doc = await this.model.findOne({email}, projection, options).exec();
        return doc;
    }
}

export class UserRepo extends DBRepo<IUser>{
    constructor() {
        super(userModel);
    }
}
