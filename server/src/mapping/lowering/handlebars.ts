import * as vm from 'vm';
import Handlebars from 'handlebars';

import { LoweringConfig, SPP } from './lowering';
import { VM } from 'vm2';

export const handlebars = (mapping: string, spp: SPP, config: LoweringConfig): string => {
  const sppSingle = (...args: any): any => spp(...args)[0];

  // create new Handlebar instance
  const HandlebarsInstance = Handlebars.create();

  HandlebarsInstance.registerHelper('spp', (...args) => {
    if (args.length !== 2 && args.length !== 3) {
      throw new Error('Invalid number of arguments');
    }
    return args.length === 2 ? spp(args[0])[0] : spp(args[0], args[1])[0];
  });

  HandlebarsInstance.registerHelper('sppList', (...args) => {
    if (args.length !== 2 && args.length !== 3) {
      throw new Error('Invalid number of arguments');
    }
    return args.length === 2 ? spp(args[0]) : spp(args[0], args[1]);
  });

  const sandbox = {
    spp: sppSingle,
    sppList: spp,
    Handlebars: HandlebarsInstance,
  };

  const vmInst = new VM({
    timeout: 1000,
    sandbox,
  });
  vmInst.run(config.functions);
  // vm.createContext(sandbox);
  // vm.runInContext(config.functions, sandbox);

  const template = HandlebarsInstance.compile(mapping);

  const view = {};
  return template(view);
};
