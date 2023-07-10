export interface IRenderer {
    level: number;
    render( ...props: unknown[] ): void; 
}