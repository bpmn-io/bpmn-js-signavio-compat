import {
  bootstrapModeler,
  inject
} from 'bpmn-js/test/helper';


import signavioCompatModule from '../';
import coreModule from 'bpmn-js/lib/core';

import testDiagram from './SignavioBehavior.bpmn';


describe('signavio-compat', function() {

  describe('basic', function() {

    beforeEach(bootstrapModeler(testDiagram, {
      modules: [
        signavioCompatModule,
        coreModule
      ]
    }));


    it('should bootstrap', inject(function(signavioBehavior) {
      expect(signavioBehavior).to.exist;
    }));

  });

});
