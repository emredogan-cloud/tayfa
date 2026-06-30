/**
 * Static image asset module declarations for the Metro bundler. At runtime a
 * `import x from './foo.png'` resolves to an opaque numeric asset id, which
 * `expo-image`'s `<Image source>` (and RN's `<Image>`) accept directly.
 */
declare module '*.png' {
  const content: number;
  export default content;
}
declare module '*.jpg' {
  const content: number;
  export default content;
}
declare module '*.jpeg' {
  const content: number;
  export default content;
}
declare module '*.webp' {
  const content: number;
  export default content;
}
