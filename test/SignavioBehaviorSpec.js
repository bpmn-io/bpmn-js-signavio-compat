import {
  bootstrapModeler,
  getBpmnJS,
  inject,
  insertCSS
} from 'bpmn-js/test/helper';

import { find } from 'min-dash';

insertCSS('diagram-js.css', require('diagram-js/assets/diagram-js.css'));

insertCSS('bpmn-embedded.css', require('bpmn-font/dist/css/bpmn-embedded.css'));

import signavioCompatModule from '../';

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import collapsedDiagram from './SubProcess.nestedComplex.bpmn';
import expandedDiagram from './Subprocess.expanded.bpmn';


describe('signavio-compat', function() {

  function findDiagram(id) {
    return getBpmnJS().invoke(function(bpmnjs) {
      var definitions = bpmnjs.getDefinitions(),
          diagrams = definitions.diagrams;

      return find(diagrams, function(diagram) {
        return diagram.plane.bpmnElement.id === id;
      });
    });
  }

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


    function expectElementImported(id, sourceDiagram, targetDiagram) {
      return getBpmnJS().invoke(function(bpmnjs, elementRegistry) {
        var element = elementRegistry.get(id);

        expect(element).to.exist;

        if (targetDiagram) {
          expect(findDI(sourceDiagram, id)).to.not.exist;
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
      return getBpmnJS().invoke(function(bpmnjs, elementRegistry) {
        var element = elementRegistry.get(id);

        expect(element).to.not.exist;

        expect(findDI(sourceDiagram, id)).to.not.exist;
        expect(findDI(targetDiagram, id)).to.exist;
      });
    }


    describe('expanding', function() {

      var sourceDiagram, targetDiagram;

      beforeEach(bootstrapModeler(collapsedDiagram, {
        additionalModules: [
          signavioCompatModule
        ],
        keyboard: {
          bindTo: document
        }
      }));

      beforeEach(inject(function(bpmnReplace, elementRegistry) {

        // given
        var collapsedSubProcess = elementRegistry.get('SubProcess_1');

        // when
        bpmnReplace.replaceElement(collapsedSubProcess,
          {
            type: 'bpmn:SubProcess',
            isExpanded: true
          }
        );

        sourceDiagram = findDiagram('SubProcess_1');
        targetDiagram = findDiagram('Process_1');
      }));


      it('should do', function() {

        // then
        expectElementImported('Task_1', sourceDiagram, targetDiagram);
        expectElementImported('SubProcess_Nested', sourceDiagram, targetDiagram);
        expectElementImported('BoundaryEvent_1', sourceDiagram, targetDiagram);
      });


      it('should undo', inject(function(commandStack) {

        // when
        commandStack.undo();

        // then
        expectElementRemoved('Task_1', targetDiagram, sourceDiagram);
        expectElementRemoved('SubProcess_Nested', targetDiagram, sourceDiagram);
        expectElementRemoved('BoundaryEvent_1', targetDiagram, sourceDiagram);
      }));


      it('should redo', inject(function(commandStack) {

        // when
        commandStack.undo();
        commandStack.redo();

        // then
        expectElementImported('Task_1', sourceDiagram, targetDiagram);
        expectElementImported('SubProcess_Nested', sourceDiagram, targetDiagram);
        expectElementImported('BoundaryEvent_1', sourceDiagram, targetDiagram);
      }));


      it('should keep existing bpmndi:BPMNDiagram of subprocess');


      describe('error handling', function() {

        it('should handle broken semantics');


        it('should handle missing semantics');


        it('should handle broken DI');

      });

    });


    describe('collapsing', function() {

      var sourceDiagram;

      beforeEach(bootstrapModeler(expandedDiagram, {
        additionalModules: [
          signavioCompatModule
        ],
        keyboard: {
          bindTo: document
        }
      }));

      beforeEach(inject(function(bpmnReplace, elementRegistry) {

        // given
        var collapsedSubProcess = elementRegistry.get('SubProcess_1');

        // when
        bpmnReplace.replaceElement(collapsedSubProcess,
          {
            type: 'bpmn:SubProcess',
            isExpanded: false
          }
        );

        sourceDiagram = findDiagram('Process_1');
      }));


      it('should do', function() {

        // then
        var targetDiagram = findDiagram('SubProcess_1');

        expect(targetDiagram).to.exist;

        expectElementRemoved('StartEvent_1', sourceDiagram, targetDiagram);
        expectElementRemoved('SequenceFlow_1', sourceDiagram, targetDiagram);
        expectElementRemoved('Task_1', sourceDiagram, targetDiagram);
        expectElementRemoved('SequenceFlow_2', sourceDiagram, targetDiagram);
        expectElementRemoved('EndEvent_1', sourceDiagram, targetDiagram);
      });


      it('should undo', inject(function(commandStack) {

        // when
        commandStack.undo();

        // then
        var targetDiagram = findDiagram('SubProcess_1');

        expect(targetDiagram).to.not.exist;

        expectElementImported('StartEvent_1', sourceDiagram);
        expectElementImported('SequenceFlow_1', sourceDiagram);
        expectElementImported('Task_1', sourceDiagram);
        expectElementImported('SequenceFlow_2', sourceDiagram);
        expectElementImported('EndEvent_1', sourceDiagram);
      }));


      it('should redo', inject(function(commandStack) {

        // when
        commandStack.undo();
        commandStack.redo();

        // then
        var targetDiagram = findDiagram('SubProcess_1');

        expect(targetDiagram).to.exist;

        expectElementRemoved('StartEvent_1', sourceDiagram, targetDiagram);
        expectElementRemoved('SequenceFlow_1', sourceDiagram, targetDiagram);
        expectElementRemoved('Task_1', sourceDiagram, targetDiagram);
        expectElementRemoved('SequenceFlow_2', sourceDiagram, targetDiagram);
        expectElementRemoved('EndEvent_1', sourceDiagram, targetDiagram);
      }));


      it('should reuse exsting bpmndi:BPMNDiagram of subprocess');

    });

  });

});

// helpers //////////

function findDI(diagram, id) {
  return find(diagram.plane.planeElement, function(planeElement) {
    return planeElement.bpmnElement.id === id;
  });
}
