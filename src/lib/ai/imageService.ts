import { generateImage } from "./comfy";

export async function generateBackgroundImage(prompt: string, habitId: number, streak: number): Promise<string> {
  const name = `bg_${habitId}_${streak}_${Date.now()}.png`;
  return generateImage(prompt, name);
}

export async function generateAccessoryImage(prompt: string, habitId: number): Promise<string> {
  const name = `acc_${habitId}_${Date.now()}.png`;
  return generateImage(prompt, name);
}