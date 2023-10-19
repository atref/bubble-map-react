import { ComponentBase } from '@grapecity/wijmo.react.base';
import { LabeledLayer } from './layers/labeled-layer';
import { DetailLayer } from './layers/detail-layer';

export class LabeledLayerReact extends ComponentBase {
  _parentProp = 'layers';
  _siblingId = 'layers';
  constructor(props:any) {
      super(props, LabeledLayer, { objectProps: ['labelClass', 'formatLabel', 'zoomLimit']});
  } 
}

export class DetailLayerReact extends ComponentBase {
  _parentProp = 'layers';
  _siblingId = 'layers';
  constructor(props:any) {
        super(props, DetailLayer, { objectProps: ['labelClass']});
    } 
  }
  