import {
  bootstrapModeler,
  getBpmnJS,
  inject,
  insertCSS
} from 'bpmn-js/test/helper';

import {
  find,
  isString
} from 'min-dash';

insertCSS('diagram-js.css', require('diagram-js/assets/diagram-js.css'));

insertCSS('bpmn-embedded.css', require('bpmn-font/dist/css/bpmn-embedded.css'));

import signavioCompatModule from '../';

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import collapsedDiagram from './SubProcess.nestedComplex.collapsed.bpmn';
import expandedDiagram from './SubProcess.expanded.bpmn';


describe('signavio-compat', function() {

  describe('basic', function() {

    beforeEach(bootstrapModeler(collapsedDiagram, {
      additionalModules: [
        signavioCompatModule
      ],
      keyboard: {
        bindTo: document
      }
    }));


    it('should bootstrap', inject(function(signavioBehavior) {
      expect(signavioBehavior).to.exist;
    }));

  });


  describe('expanding', function() {

    beforeEach(bootstrapModeler(collapsedDiagram, {
      additionalModules: [
        signavioCompatModule
      ]
    }));


    it('should do', function() {

      // given
      expand('SubProcess_1');

      // then
      expectElementImported('Task_1', 'SubProcess_1', 'Process_1');
      expectElementImported('SubProcess_Nested', 'SubProcess_1', 'Process_1');
      expectElementImported('BoundaryEvent_1', 'SubProcess_1', 'Process_1');

      expectElementImported('SequenceFlow_1', 'SubProcess_1', 'Process_1');
      expectElementImported('SequenceFlow_2', 'SubProcess_1', 'Process_1');
    });


    it('should undo', inject(function(commandStack) {

      // given
      expand('SubProcess_1');

      // when
      commandStack.undo();

      // then
      expectElementRemoved('Task_1', 'Process_1', 'SubProcess_1');
      expectElementRemoved('SubProcess_Nested', 'Process_1', 'SubProcess_1');
      expectElementRemoved('BoundaryEvent_1', 'Process_1', 'SubProcess_1');

      expectElementRemoved('SequenceFlow_1', 'Process_1', 'SubProcess_1');
      expectElementRemoved('SequenceFlow_2', 'Process_1', 'SubProcess_1');
    }));


    it('should redo', inject(function(commandStack) {

      // given
      expand('SubProcess_1');

      // when
      commandStack.undo();
      commandStack.redo();

      // then
      expectElementImported('Task_1', 'SubProcess_1', 'Process_1');
      expectElementImported('SubProcess_Nested', 'SubProcess_1', 'Process_1');
      expectElementImported('BoundaryEvent_1', 'SubProcess_1', 'Process_1');

      expectElementImported('SequenceFlow_1', 'SubProcess_1', 'Process_1');
      expectElementImported('SequenceFlow_2', 'SubProcess_1', 'Process_1');
    }));


    it('should keep existing bpmndi:BPMNDiagram of subprocess');


    describe('error handling', function() {

      it('should handle broken semantics');


      it('should handle missing semantics');


      it('should handle broken DI');

    });

  });


  describe('collapsing', function() {

    beforeEach(bootstrapModeler(expandedDiagram, {
      additionalModules: [
        signavioCompatModule
      ]
    }));


    it('should do', function() {

      // when
      collapse('SubProcess_1');

      // then
      expectElementRemoved('StartEvent_1', 'Process_1', 'SubProcess_1');
      expectElementRemoved('SequenceFlow_1', 'Process_1', 'SubProcess_1');
      expectElementRemoved('Task_1', 'Process_1', 'SubProcess_1');
      expectElementRemoved('SequenceFlow_2', 'Process_1', 'SubProcess_1');
      expectElementRemoved('EndEvent_1', 'Process_1', 'SubProcess_1');
    });


    it('should undo', inject(function(commandStack) {

      // given
      collapse('SubProcess_1');

      // when
      commandStack.undo();

      // then
      var targetDiagram = findDiagram('SubProcess_1');

      expect(targetDiagram).not.to.exist;

      expectElementImported('StartEvent_1', 'Process_1');
      expectElementImported('SequenceFlow_1', 'Process_1');
      expectElementImported('Task_1', 'Process_1');
      expectElementImported('SequenceFlow_2', 'Process_1');
      expectElementImported('EndEvent_1', 'Process_1');
    }));


    it('should redo', inject(function(commandStack) {

      // given
      collapse('SubProcess_1');

      // when
      commandStack.undo();
      commandStack.redo();

      // then
      expectElementRemoved('StartEvent_1', 'Process_1', 'SubProcess_1');
      expectElementRemoved('SequenceFlow_1', 'Process_1', 'SubProcess_1');
      expectElementRemoved('Task_1', 'Process_1', 'SubProcess_1');
      expectElementRemoved('SequenceFlow_2', 'Process_1', 'SubProcess_1');
      expectElementRemoved('EndEvent_1', 'Process_1', 'SubProcess_1');
    }));


    it('reuse exsting bpmndi:BPMNDiagram');

  });

});


// helpers //////////

function findDI(diagram, id) {
  return find(diagram.plane.planeElement, function(planeElement) {
    return planeElement.bpmnElement.id === id;
  });
}

function expectElementImported(id, sourceDiagram, targetDiagram) {

  if (isString(sourceDiagram)) {
    sourceDiagram = findDiagram(sourceDiagram);

    expect(sourceDiagram).to.exist;
  }

  if (isString(targetDiagram)) {
    targetDiagram = findDiagram(targetDiagram);

    expect(targetDiagram).to.exist;
  }

  return getBpmnJS().invoke(function(bpmnjs, elementRegistry) {
    var element = elementRegistry.get(id);

    expect(element).to.exist;

    if (targetDiagram) {
      expect(findDI(sourceDiagram, id)).not.to.exist;
      expect(findDI(targetDiagram, id)).to.exist;

      expect(getBusinessObject(element).di).to.equal(findDI(targetDiagram, id));
    } else {

      // sourceDiagram does not exist
      targetDiagram = sourceDiagram;

      expect(findDI(targetDiagram, id)).to.exist;

      expect(getBusinessObject(element).di).to.equal(findDI(targetDiagram, id));
    }
  });
}

function expectElementRemoved(id, sourceDiagram, targetDiagram) {

  if (isString(sourceDiagram)) {
    sourceDiagram = findDiagram(sourceDiagram);

    expect(sourceDiagram).to.exist;
  }

  if (isString(targetDiagram)) {
    targetDiagram = findDiagram(targetDiagram);

    expect(targetDiagram).to.exist;
  }

  return getBpmnJS().invoke(function(bpmnjs, elementRegistry) {
    var element = elementRegistry.get(id);

    expect(element).not.to.exist;

    expect(findDI(sourceDiagram, id)).not.to.exist;
    expect(findDI(targetDiagram, id)).to.exist;
  });
}

function findDiagram(id) {
  return getBpmnJS().invoke(function(bpmnjs) {
    var definitions = bpmnjs.getDefinitions(),
        diagrams = definitions.diagrams;

    return find(diagrams, function(diagram) {
      return diagram.plane.bpmnElement.id === id;
    });
  });
}

function expand(id) {
  return toggleCollapse(id, true);
}

function collapse(id) {
  return toggleCollapse(id, false);
}

function toggleCollapse(id, isExpanded) {

  return getBpmnJS().invoke(function(elementRegistry, bpmnReplace) {

    var subProcess = elementRegistry.get(id);

    expect(subProcess).to.exist;

    // when
    return bpmnReplace.replaceElement(subProcess,
      {
        type: 'bpmn:SubProcess',
        isExpanded
      }
    );
  });

}