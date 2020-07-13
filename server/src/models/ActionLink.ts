import mongoose, { Schema } from 'mongoose';
import { MongoDoc, MongoLeanDoc } from './helper';

export interface TemplatePath {
  id: string; // node-id
  path: string[]; // path
}

export interface PropertyMap {
  id: string;
  from: TemplatePath;
  to: TemplatePath;
}

export interface ActionLink {
  id: string;
  source: string;
  target: string;
  propertyMaps: PropertyMap[];
  iterator?: TemplatePath;
  condition?: {
    type: 'sparql' | 'javascript';
    value: string;
  };
  annotation: string;
}

export type ActionLinkDoc = MongoDoc<ActionLink>;
export type ActionLinkLeanDoc = MongoLeanDoc<ActionLink>;

const ActionLinkSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  propertyMaps: [{ type: Object, required: false }],
  iterator: { type: Object, required: false },
  condition: { type: Object, required: false },
  annotation: { type: String, required: true },
});

export default mongoose.model<ActionLinkDoc>('ActionLink', ActionLinkSchema);
