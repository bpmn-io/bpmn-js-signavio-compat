import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import ImportSubProcessHandler from './cmd/ImportSubProcessHandler';
import DeleteSubProcessHandler from './cmd/DeleteSubProcessHandler';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  find
} from 'min-dash';


const HIGH_PRIORITY = 2000;


export default class SignavioBehavior extends CommandInterceptor {

  constructor(
      bpmnjs, bpmnImporter, canvas,
      commandStack, eventBus, modeling,
      translate) {

    super(eventBus);

    this._bpmnjs = bpmnjs;

    commandStack.registerHandler(
      'signavioCompat.importSubProcess',
      ImportSubProcessHandler
    );

    commandStack.registerHandler(
      'signavioCompat.deleteSubProcess',
      DeleteSubProcessHandler
    );

    function isSignavio() {
      const $attrs = bpmnjs.getDefinitions().$attrs;

      return find($attrs, function(attr) {
        return attr === 'http://www.signavio.com';
      });
    }


    this.postExecuted([ 'shape.toggleCollapse' ], HIGH_PRIORITY, (event) => {
      if (!isSignavio()) {
        return;
      }

      const shape = event.context.shape;

      if (!is(shape, 'bpmn:SubProcess')) {
        return;
      }

      var context;

      if (!shape.collapsed) {

        // expand
        const diagram = this.findDiagram(shape.id);

        if (!diagram) {
          return;
        }

        context = {
          subProcess: shape,
          subProcessDiagram: diagram
        };

        commandStack.execute('signavioCompat.importSubProcess', context);
      } else {

        // collapse
        context = {
          subProcess: shape,
          subProcessDiagram: this.findDiagram(shape.id)
        };

        commandStack.execute('signavioCompat.deleteSubProcess', context);
      }
    });

  }

  findDiagram(id) {
    var diagrams = this._bpmnjs.getDefinitions().diagrams;

    return find(diagrams, function(diagram) {
      const plane = diagram.plane,
            bpmnElement = plane.bpmnElement;

      return bpmnElement.id === id;
    });
  }

}

SignavioBehavior.$inject = [
  'bpmnjs',
  'bpmnImporter',
  'canvas',
  'commandStack',
  'eventBus',
  'modeling',
  'translate'
];