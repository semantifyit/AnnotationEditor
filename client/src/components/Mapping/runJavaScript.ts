// https://github.com/facebook/create-react-app/issues/1277
export class RunJavaScriptFunction {
  public worker: Worker | undefined;

  public runJavaScriptFunction = (
    func: string,
    input: string,
    timeout: number = 5000,
  ): Promise<any> =>
    new Promise((resolve) => {
      let code = func
        .substring(func.indexOf('{') + 1, func.lastIndexOf('}'))
        .trim();
      code = code.replace(/return (.*);$/, 'postMessage($1);');
      code = code.replace(/return (.*)$/, 'postMessage($1);');
      code = `let input = '${input}';\n${code}`;
      // console.log(code);
      const blob = new Blob([code], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      this.worker.onmessage = (m) => {
        resolve(m.data);
      };
      this.worker.addEventListener(
        'error',
        (err) => {
          resolve(`${err.message} (Line: ${err.lineno}, Column ${err.colno})`);
        },
        false,
      );
      setTimeout(() => {
        if (this.worker) {
          this.worker.terminate();
        }
        resolve('test_failed');
      }, timeout);
    });
}

// some tests with eval and new Function():

// {
//   const jsFunc = `
// function transform(input) {
//     return input;
// }`;
//   const input = 'foo';
//
//   const result = eval(`(${jsFunc})('${input}')`);
//
//   console.log('result: ', result);
// }
//
// {
//   const input = 'foo';
//   const func = new Function('input', ' return input;');
//   const result = func(input);
//
//   console.log('result: ', result);
// }
//
// {
//   // https://github.com/facebook/create-react-app/issues/1277
//   const input = 'foo';
//   const workerFunc = `
//   const input = '${input}';
//   while(1){}
//   postMessage(input);`;
//
//   let code = workerFunc.toString();
//   console.log(code);
//   code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));
//   console.log(code);
//
//   const blob = new Blob([workerFunc], { type: 'application/javascript' });
//   const worker = new Worker(URL.createObjectURL(blob));
//
//   worker.onmessage = (m) => {
//     console.log('msg', m.data);
//   };
//   setTimeout(() => worker.terminate(), 5000);
// }
