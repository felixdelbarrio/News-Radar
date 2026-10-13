import {segmentCoverageDefaults} from '../../shared/selection-policy.js';
export function syncSegmentCoverage(form,changed){
  const coverage=segmentCoverageDefaults[form.elements.segment?.value];
  if(changed==='segment'&&coverage&&form.elements.coverage)form.elements.coverage.value=coverage;
}
