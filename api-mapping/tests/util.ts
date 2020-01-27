import * as fs from 'fs';

export const fileToJSON = (filename: string) =>
  JSON.parse(fs.readFileSync(filename, 'utf8'));
