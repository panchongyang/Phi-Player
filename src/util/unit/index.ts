import { IRenderer } from "./renderer";

export class IRenderUnit {
    renderer: IRenderer;
    level: number;
    rendererProps: unknown[];

    constructor(renderer: IRenderer, level: number, ...props: unknown[]) {
        this.renderer = renderer;
        this.level = level;
        this.rendererProps = props;
    }
}