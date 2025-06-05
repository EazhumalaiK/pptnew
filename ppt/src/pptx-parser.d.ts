// src/pptx-parser.d.ts
declare module "pptx-parser" {
  export function parsePptx(arrayBuffer: ArrayBuffer): Promise<{
    slides: any[];
    // Add more fields if needed from the parsed result
  }>;
}
