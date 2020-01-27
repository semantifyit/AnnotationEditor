import mongoose, { Schema } from 'mongoose';
import { MongoDoc, MongoLeanDoc } from './helper';

export interface Vocab {
  name: string;
  description?: string;
  vocab: string; // since mongodb doesnt allow for keys including '.';
  ogVocab?: string;
  namespaces?: [
    {
      prefix: string;
      uri: string;
    },
  ];
}

export type VocabDoc = MongoDoc<Vocab>;
export type VocabLeanDoc = MongoLeanDoc<Vocab>;

const VocabSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  vocab: { type: String, required: true },
  ogVocab: { type: String, required: false },
  namespaces: [
    {
      prefix: { type: String, required: true },
      uri: { type: String, required: true },
    },
  ],
});

export default mongoose.model<VocabDoc>('Vocab', VocabSchema);
