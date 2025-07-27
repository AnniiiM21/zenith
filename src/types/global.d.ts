// CSS module declarations
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Extend React CSSProperties to include Webkit specific properties
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}
