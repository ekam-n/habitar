import { parseHabit } from "./habits";
import { generateTitle, generateButtonLabel } from "./titles";
import { generateBackgroundPrompt, generateAccessoryPrompt } from "./prompts";

const profile = parseHabit("go to the gym every morning");
console.log("Profile:", profile);
console.log("Title:", generateTitle(profile, 5, false));
console.log("Button:", generateButtonLabel(profile));
console.log("BG Prompt:", generateBackgroundPrompt(profile, 5, false));
console.log("Accessory Prompt:", generateAccessoryPrompt(profile));

import { getDb } from "../db/schema";
getDb();
console.log("DB initialized OK");