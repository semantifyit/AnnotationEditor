import * as vm from 'vm';
import { SPP } from './lowering';

// export const allButLast = <T>(arr: T[]): T[] => arr.slice(0, -1);
// export const last = <T>(arr: T[]): T => arr.slice(-1)[0];

export const javascript = (mapping: string, spp: SPP, config: any): string => {
  // const getSppEach = (base: string) => (...args: any[]): any =>
  //   (args.length === 2 ? spp(base, args[0]) : spp(args[1], args[2])).map((id) =>
  //     last(args)({
  //       spp: (newPP: any) => spp(id, newPP)[0],
  //       sppList: (newPP: any) => spp(id, newPP),
  //       value: id,
  //       sppEach: getSppEach(id),
  //     }),
  //   );

  const sppSingle = (...args: any): any => spp(...args)[0];

  const sandbox = {
    spp: sppSingle,
    sppList: spp,
    // sppEach: getSppEach(baseId),
  };

  vm.createContext(sandbox);

  const res: unknown = vm.runInNewContext(mapping, sandbox);

  if (typeof res === 'object') {
    return JSON.stringify(res);
  }
  return String(res);
};
