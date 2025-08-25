import { NextRequest, NextResponse } from 'next/server';
import PDFParser from "pdf2json";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    const pdfParser = new PDFParser();
    
    const textContent = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", errData => {
        console.error("PDF Parser Error:", errData.parserError);
        reject(new Error("Error parsing PDF data."));
      });
      
      // THE FIX IS HERE: The parsed data is passed as an argument to the callback
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        // We access the Pages array from the pdfData object, not the parser itself.
        if (!pdfData || !pdfData.Pages) {
          console.warn("PDF data is missing the 'Pages' array.");
          resolve(""); // Resolve with an empty string if data is malformed
          return;
        }

        const fullText = pdfData.Pages.map(page => 
          page.Texts.map(text => 
            decodeURIComponent(text.R[0].T)
          ).join(" ")
        ).join("\n\n");

        resolve(fullText);
      });

      pdfParser.parseBuffer(fileBuffer);
    });

    if (!textContent || textContent.trim() === "") {
        console.warn("PDF parsed successfully, but no text content was extracted.");
        return NextResponse.json({ text: "[No text content could be extracted from this PDF]" });
    }

    return NextResponse.json({ text: textContent });

  } catch (error) {
    console.error('Error in /api/upload:', error);
    return NextResponse.json({ error: 'Failed to process the PDF file.' }, { status: 500 });
  }
}