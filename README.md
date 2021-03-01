# bpmn-js-signavio-compat

[![CI](https://github.com/bpmn-io/bpmn-js-signavio-compat/workflows/CI/badge.svg)](https://github.com/bpmn-io/bpmn-js-signavio-compat/actions?query=workflow%3ACI)

Interoperate with [Signavio](http://signavio.com) exported diagrams.


## Features

* Expand and collapse sub-processes, Signavio style


## Usage with bpmn-js

Add bpmn-js-signavio-compat as an additional module when creating the [bpmn-js]() instance:

```javascript
import signavioCompatModule from 'bpmn-js-signavio-compat';

const modeler = new Modeler({
  additionalModules: [
    signavioCompatModule
  ]
});
```

Note that you need to use a transpiler (e.g. [babel](https://babeljs.io/)) when using the bpmn-js-signavio-compat module.


## License

MIT