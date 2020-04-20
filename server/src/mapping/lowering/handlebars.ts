import Handlebars from 'handlebars';
import { SPP } from './lowering';

let globalSpp: SPP = null;

Handlebars.registerHelper('spp', (...args) => {
  if (args.length !== 2 && args.length !== 3) {
    throw new Error('Invalid number of arguments');
  }
  return args.length === 2 ? globalSpp(args[0])[0] : globalSpp(args[0], args[1])[0];
});

Handlebars.registerHelper('sppList', (...args) => {
  if (args.length !== 2 && args.length !== 3) {
    throw new Error('Invalid number of arguments');
  }
  return args.length === 2 ? globalSpp(args[0]) : globalSpp(args[0], args[1]);
});

export const handlebars = (mapping: string, spp: SPP, config: any): string => {
  globalSpp = spp;
  const view = {};

  const template = Handlebars.compile(mapping);

  return template(view);
};
