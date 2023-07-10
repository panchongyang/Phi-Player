import { IRenderUnit } from "../unit";

type ILayersRendererList =IRenderUnit[];

export class ILayers {
  renderers: ILayersRendererList;

  constructor() {
    this.renderers = [];
  }

  public flush() {
    this.renderers.sort((a, b) => a.level - b.level);
    while(this.renderers.length > 0) {
      const renderer = this.renderers.shift();
      renderer && renderer.renderer.render(...renderer.rendererProps);
    }
  }

  public add(unit: IRenderUnit) {
    this.renderers.push(unit);
  }
}
