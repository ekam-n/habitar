import fs from "fs";
import path from "path";

const COMFY_URL = process.env.COMFY_URL ?? "http://127.0.0.1:8188";
const OUTPUT_DIR = path.join(process.cwd(), "public", "generated");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function loadWorkflow(): any {
  const workflowPath = path.join(process.cwd(), "src/lib/ai/workflow.json");
  const raw = fs.readFileSync(workflowPath, "utf-8");
  return JSON.parse(raw);
}

function findNodeByTitle(workflow: any, title: string): string | null {
  for (const [id, node] of Object.entries(workflow) as any) {
    if (node._meta?.title === title) return id;
  }
  return null;
}

async function queuePrompt(workflow: any): Promise<string> {
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });
  const data = await res.json();
  return data.prompt_id;
}

async function pollForResult(promptId: string, timeoutMs = 60000): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    const history = await res.json();

    if (history[promptId]) {
      const outputs = history[promptId].outputs;
      for (const nodeOutput of Object.values(outputs) as any) {
        if (nodeOutput.images?.length > 0) {
          return nodeOutput.images[0].filename;
        }
      }
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  throw new Error("ComfyUI generation timed out");
}

async function downloadImage(filename: string, saveName: string): Promise<string> {
  const res = await fetch(`${COMFY_URL}/view?filename=${filename}&type=output`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const savePath = path.join(OUTPUT_DIR, saveName);
  fs.writeFileSync(savePath, buffer);
  return `/generated/${saveName}`;
}

export async function generateImage(prompt: string, outputName: string): Promise<string> {
  const workflow = loadWorkflow();

  // Find the positive prompt node — adjust title if yours differs
  const positiveNodeId = findNodeByTitle(workflow, "Positive Prompt")
    ?? findNodeByTitle(workflow, "CLIP Text Encode (Prompt)");

  if (!positiveNodeId) {
    throw new Error("Could not find positive prompt node in workflow. Check node titles in ComfyUI.");
  }

  // Inject prompt
  workflow[positiveNodeId].inputs.text = prompt;

  // Randomize seed for variety
  for (const node of Object.values(workflow) as any) {
    if (node.class_type === "KSampler") {
      node.inputs.seed = Math.floor(Math.random() * 1e10);
    }
  }

  const promptId = await queuePrompt(workflow);
  const filename = await pollForResult(promptId);
  const publicPath = await downloadImage(filename, outputName);

  return publicPath;
}