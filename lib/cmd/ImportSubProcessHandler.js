import BpmnTreeWalker from 'bpmn-js/lib/import/BpmnTreeWalker';

import {
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import {
  add as collectionAdd,
  remove as collectionRemove
} from 'diagram-js/lib/util/Collections';

import { saveClear } from 'diagram-js/lib/util/Removal';

import { find } from 'min-dash';


export default class ImportElementsHandler {

  constructor(bpmnImporter, bpmnjs, canvas, translate) {
    this._bpmnImporter = bpmnImporter;
    this._bpmnjs = bpmnjs;
    this._canvas = canvas;
    this._translate = translate;
  }

  execute(context) {
    var self = this;

    var subProcess = context.subProcess,
        subProcessDiagram = context.subProcessDiagram;

    var warnings = [];

    var visitor = {

      element: function(element, parentShape) {
        return self._bpmnImporter.add(element, parentShape);
      },

      error: function(message, context) {
        warnings.push({ message: message, context: context });
      }

    };

    var walker = new BpmnTreeWalker(visitor, this._translate);

    var plane = subProcessDiagram.plane,
        planeElements = plane.planeElement;

    // (1) register DI first
    planeElements.forEach(function(planeElement) {
      walker.registerDi(planeElement);
    });

    // (2) move DI
    moveDI(subProcessDiagram, this.findDiagram(this._canvas.getRootElement().id));

    // (3) try to import
    try {
      walker.handleSubProcess(getBusinessObject(subProcess), subProcess);

      // must be called afterwards
      walker.handleDeferred();
    } catch (e) {

      // TODO(philippfromme): handle
      console.error(e);
    }

    if (warnings.length) {

      // TODO(philippfromme): handle
      console.warn(warnings);
    }
  }

  revert(context) {
    var self = this;

    function deleteElements(elements) {
      saveClear(elements, function(element) {
        deleteElement(element);
      });
    }

    function deleteElement(element) {
      if (element.waypoints) {
        self._canvas.removeConnection(element);
      } else {
        self._canvas.removeShape(element);
      }
    }

    var subProcess = context.subProcess,
        targetDiagram = context.subProcessDiagram;

    var sourceDiagram = this.findDiagram(this._canvas.getRootElement().id);

    var sourcePlaneElements = sourceDiagram.plane.planeElement.filter(function(sourcePlaneElement) {
      return hasParentWithId(sourcePlaneElement, subProcess.id);
    });

    // (1) remove DI binding
    sourcePlaneElements.forEach(function(sourcePlaneElement) {

      // TODO(philippfromme): object-ref doesn't allow deleting after binding
      // delete sourcePlaneElement.bpmnElement.di;
    });

    // (2) move DI (but only children of subProcess)
    moveDI(sourceDiagram, targetDiagram, sourcePlaneElements);

    // (3) delete children
    if (subProcess.children && subProcess.children.length) {
      deleteElements(subProcess.children);
    }
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

ImportElementsHandler.$inject = [
  'bpmnImporter',
  'bpmnjs',
  'canvas',
  'translate'
];

// helpers ///////////

/**
 * Move DI elements from one bpmndi:BPMNDiagram to another.
 *
 * @param {Object} sourceDiagram
 * @param {Object} targetDiagram
 * @param {Array} sourcePlaneElements - Optional list of elements to move.
 * If not specified, all elements will be moved.
 */
function moveDI(sourceDiagram, targetDiagram, sourcePlaneElements) {
  sourcePlaneElements = sourcePlaneElements || sourceDiagram.plane.planeElement;

  var targetPlaneElements = targetDiagram.plane.planeElement;

  // (1) add to target plane
  sourcePlaneElements.forEach(function(sourcePlaneElement) {
    collectionAdd(targetPlaneElements, sourcePlaneElement);
  });

  // (2) remove from source plane
  sourcePlaneElements.slice().forEach(function(sourcePlaneElement) {
    collectionRemove(sourceDiagram.plane.planeElement, sourcePlaneElement);

    sourcePlaneElement.$parent = targetDiagram.plane;
  });
}

function hasParentWithId(planeElement, parentId) {
  while (planeElement.bpmnElement && planeElement.bpmnElement.$parent) {
    if (planeElement.bpmnElement.$parent.id === parentId) {
      return true;
    }

    planeElement = planeElement.bpmnElement.$parent;
  }

  return false;
}