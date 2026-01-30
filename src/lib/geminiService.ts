export const extractLiuYaoData = async (
  input: string | File,
  options?: { model?: string },
) => {
  try {
    const body =
      typeof input === "string"
        ? { text: input, model: options?.model }
        : {
            image: { data: await fileToBase64(input), mimeType: input.type },
            model: options?.model,
          };

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

export type ChatMessage = { role: "user" | "model"; text: string };

export const geminiChat = async (params: {
  systemInstruction: string;
  messages: ChatMessage[];
  model?: string;
}) => {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Gemini chat failed: ${response.status}`);
  }

  const data = (await response.json()) as { text?: string };
  return data.text ?? "";
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = (error) => reject(error);
  });
};
