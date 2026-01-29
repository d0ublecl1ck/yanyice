export const extractLiuYaoData = async (input: string | File) => {
  try {
    const body =
      typeof input === "string"
        ? { text: input }
        : { image: { data: await fileToBase64(input), mimeType: input.type } };

    const response = await fetch("/api/gemini/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Gemini AI extraction failed:", error);
    throw error;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};
