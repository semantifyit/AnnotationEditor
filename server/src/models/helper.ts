import { Document } from 'mongoose';

interface MetaProps {
  _id: string;
  __v: string;
  createdAt: string;
  updatedAt: string;
}

export type MongoDoc<T> = Document & MetaProps & T;

export type MongoLeanDoc<T> = MetaProps & T;
