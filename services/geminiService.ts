
import { GoogleGenAI, GenerateContentResponse, Modality, LiveServerMessage } from "@google/genai";
import { Role, Message, ChatMode, Attachment } from "../types";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async *streamChat(history: Message[], newMessage: string, mode: ChatMode, attachments?: Attachment[]) {
    const ai = this.getAI();
    let model = 'gemini-3-flash-preview'; 
    let config: any = {};

    // Map history to SDK format
    const contents: any[] = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [
        { text: msg.content },
        ...(msg.attachments?.map(att => ({
          inlineData: {
            data: att.data.split(',')[1] || att.data,
            mimeType: att.mimeType
          }
        })) || [])
      ]
    }));

    // Add current message
    const currentParts: any[] = [{ text: newMessage }];
    if (attachments) {
      attachments.forEach(att => {
        currentParts.push({
          inlineData: {
            data: att.data.split(',')[1] || att.data,
            mimeType: att.mimeType
          }
        });
      });
      // Force Pro model for image understanding
      model = 'gemini-3-pro-preview';
    } else {
      switch (mode) {
        case 'reasoning':
          model = 'gemini-3-pro-preview';
          config.thinkingConfig = { thinkingBudget: 16000 }; 
          break;
        case 'search':
          model = 'gemini-3-flash-preview';
          config.tools = [{ googleSearch: {} }];
          break;
        case 'creative':
          model = 'gemini-3-pro-preview';
          break;
        case 'fast':
        default:
          model = 'gemini-3-flash-preview';
          break;
      }
    }

    contents.push({ role: 'user', parts: currentParts });

    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          ...config,
          systemInstruction: "You are a world-class AI assistant. You provide concise, accurate, and helpful information. Use Markdown for all formatting.",
        },
      });

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        const grounding = c.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title,
          uri: chunk.web?.uri
        })).filter((s: any) => s.uri);

        yield { text, grounding };
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async generateSpeech(text: string): Promise<Uint8Array> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    return this.decodeBase64(base64Audio);
  }

  async connectLive(callbacks: {
    onopen?: () => void,
    onmessage?: (message: LiveServerMessage) => void,
    onerror?: (e: any) => void,
    onclose?: (e: any) => void
  }) {
    const ai = this.getAI();
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: 'You are a helpful conversational assistant.',
      },
    });
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const numChannels = 1;
    const sampleRate = 24000;
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const geminiService = new GeminiService();
