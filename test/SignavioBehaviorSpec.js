import {
  bootstrapModeler,
  getBpmnJS,
  inject,
  insertCSS
} from 'bpmn-js/test/helper';

import {
  find,
  isString,
  assign,
  keys,
  omit,
  pick
} from 'min-dash';

insertCSS('diagram-js.css', require('bpmn-js/dist/assets/diagram-js.css'));

insertCSS('bpmn-embedded.css', require('bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'));

import signavioCompatModule from '../';

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import collapsedDiagram from './SubProcess.nestedComplex.collapsed.bpmn';
import expandedDiagram from './SubProcess.expanded.bpmn';
import expandedExistingDiagram from './SubProcess.expandedExistingDiagram.bpmn';

import collapsedBrokenSemanticsDiagram from './SubProcess.collapsed.brokenSemantics.bpmn';
import collapsedMissingSemanticsDiagram from './SubProcess.collapsed.missingSemantics.bpmn';
import collapsedBrokenDiDiagram from './SubProcess.collapsed.brokenDi.bpmn';


describe('signavio-compat', function() {

  describe('basic', function() {

    beforeEach(bootstrapTest(collapsedDiagram, {
      keyboard: {
        bindTo: document
      }
    }));


    it('should bootstrap', inject(function(signavioBehavior) {
      expect(signavioBehavior).to.exist;
    }));

  });


  describe('expanding', function() {

    beforeEach(bootstrapTest(collapsedDiagram));

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


    it('should redo', inject(function(commandStack, elementRegistry) {

      // given
      expand('SubProcess_1');

      var task1 = elementRegistry.get('Task_1'),
          subProcessNested = elementRegistry.get('SubProcess_Nested');

      // when
      commandStack.undo();
      commandStack.redo();

      // then
      expectElementImported('Task_1', 'SubProcess_1', 'Process_1');
      expectElementImported('SubProcess_Nested', 'SubProcess_1', 'Process_1');
      expectElementImported('BoundaryEvent_1', 'SubProcess_1', 'Process_1');

      expectElementImported('SequenceFlow_1', 'SubProcess_1', 'Process_1');
      expectElementImported('SequenceFlow_2', 'SubProcess_1', 'Process_1');

      expect(elementRegistry.get('Task_1')).to.equal(task1);
      expect(elementRegistry.get('SubProcess_Nested')).to.equal(subProcessNested);
    }));


    it('should keep existing bpmndi:BPMNDiagram', function() {

      // given
      var diagramDi = findDiagram('SubProcess_1');

      // assume
      expect(diagramDi).to.exist;

      // when
      expand('SubProcess_1');

      // then
      expect(findDiagram('SubProcess_1')).to.equal(diagramDi);
    });


    it('should emit import events', inject(function(eventBus) {

      // given
      var capturedEvents = [];

      eventBus.on([
        'signavio.import.render.start',
        'signavio.import.render.complete',
        'signavio.import.done'
      ], function(event) {
        var eventKeys = keys(omit(event, [ 'type' ]));

        capturedEvents.push(eventKeys);
      });

      // when
      expand('SubProcess_1');

      // then
      expect(capturedEvents).to.eql([
        [ 'subProcess' ],
        [ 'error', 'subProcess', 'warnings' ],
        [ 'error', 'subProcess', 'warnings' ]
      ]);

    }));

  });


  describe('expand / error handling', function() {

    describe('broken semantics', function() {

      beforeEach(bootstrapTest(collapsedBrokenSemanticsDiagram));


      it('should import', inject(function(eventBus) {

        // given
        let importResults;

        eventBus.on('signavio.import.done', function(event) {
          importResults = pick(event, [ 'error', 'warnings' ]);
        });

        // when
        expand('SubProcess_1');

        // then
        expect(importResults.error).not.to.exist;

        expectWarnings(importResults, [
          /#source Ref not specified/
        ]);
      }));

    });


    describe('missing semantics', function() {

      beforeEach(bootstrapTest(collapsedMissingSemanticsDiagram));


      it('should import', inject(function(eventBus) {

        // given
        let importResults;

        eventBus.on('signavio.import.done', function(event) {
          importResults = pick(event, [ 'error', 'warnings' ]);
        });

        // when
        expand('SubProcess_1');

        // then
        expect(importResults.error).not.to.exist;

        expectWarnings(importResults, [
          /no bpmnElement referenced in /,
          /#target Ref not specified/
        ]);
      }));

    });


    describe('broken DI', function() {

      beforeEach(bootstrapTest(collapsedBrokenDiDiagram));


      it('should import', inject(function(eventBus) {

        // given
        let importResults;

        eventBus.on('signavio.import.done', function(event) {
          importResults = pick(event, [ 'error', 'warnings' ]);
        });

        // when
        expand('SubProcess_1');

        // then
        expect(importResults.error).not.to.exist;

        expectWarnings(importResults, [

          // "Cannot read property 'x' of undefined"
          // bounds is undefined
          // undefined is not an object (evaluating 'bounds.x')
          /undefined/,
          /element .* id="EndEvent" .* referenced by .* not yet drawn/
        ]);
      }));

    });

  });


  describe('collapsing', function() {

    beforeEach(bootstrapTest(expandedDiagram));


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

  });


  describe('collapse / existing bpmndi:BPMNDiagram', function() {

    beforeEach(bootstrapTest(expandedExistingDiagram));


    it('should do', inject(function(bpmnjs) {

      // given
      var existingDi = findDiagram('SubProcess_1');

      // assume
      expect(existingDi).to.exist;

      // when
      collapse('SubProcess_1');

      // then
      expectElementRemoved('StartEvent_1', 'Process_1', existingDi);
    }));

  });


  describe('complex', function() {

    beforeEach(bootstrapTest(collapsedDiagram, {
      keyboard: {
        bindTo: document
      }
    }));


    beforeEach(bootstrapTest(collapsedDiagram));


    it('should expand/collapse nested', inject(function() {

      // when
      expand('SubProcess_1');

      // then
      expectElementImported('Task_1', 'SubProcess_1', 'Process_1');
      expectElementImported('SubProcess_Nested', 'SubProcess_1', 'Process_1');
      expectElementImported('BoundaryEvent_1', 'SubProcess_1', 'Process_1');

      expectElementImported('SequenceFlow_1', 'SubProcess_1', 'Process_1');
      expectElementImported('SequenceFlow_2', 'SubProcess_1', 'Process_1');

      // when
      expand('SubProcess_Nested');

      // then
      expectElementImported('Task_Nested', 'SubProcess_Nested', 'Process_1');
      expectElementImported('BoundaryEvent_Nested', 'SubProcess_Nested', 'Process_1');

      // when
      collapse('SubProcess_1');

      // then
      expectElementRemoved('Task_1', 'Process_1', 'SubProcess_1');
      expectElementRemoved('SubProcess_Nested', 'Process_1', 'SubProcess_1');
      expectElementRemoved('BoundaryEvent_1', 'Process_1', 'SubProcess_1');

      expectElementRemoved('SequenceFlow_1', 'Process_1', 'SubProcess_1');
      expectElementRemoved('SequenceFlow_2', 'Process_1', 'SubProcess_1');

      expectElementRemoved('Task_Nested', 'SubProcess_Nested', 'Process_1');
      expectElementRemoved('BoundaryEvent_Nested', 'SubProcess_Nested', 'Process_1');

      // when
      expand('SubProcess_1');

      expectElementImported('Task_1', 'SubProcess_1', 'Process_1');
      expectElementImported('SubProcess_Nested', 'SubProcess_1', 'Process_1');
      expectElementImported('BoundaryEvent_1', 'SubProcess_1', 'Process_1');

      expectElementImported('SequenceFlow_1', 'SubProcess_1', 'Process_1');
      expectElementImported('SequenceFlow_2', 'SubProcess_1', 'Process_1');

      expectElementImported('Task_Nested', 'SubProcess_Nested', 'Process_1');
      expectElementImported('BoundaryEvent_Nested', 'SubProcess_Nested', 'Process_1');
    }));

  });

});


// helpers //////////

function bootstrapTest(diagram, additionalOptions) {

  return bootstrapModeler(diagram, assign({
    additionalModules: [
      signavioCompatModule
    ]
  }, additionalOptions));

}


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


function expectWarnings(importResults, expectedWarnings) {

  var warnings = importResults.warnings;

  expect(warnings).to.have.length(
    expectedWarnings.length,
    'expected ' + expectedWarnings.length + ' warnings'
  );

  warnings.forEach(function(warning, idx) {
    expect(warning.message).to.match(expectedWarnings[idx]);
  });

}