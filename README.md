# Habit World

A habit tracking app that generates an AI world image for your habit using Stable Diffusion via ComfyUI.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) running locally with **`sdxl_lightning_4step.safetensors`** in your `models/checkpoints/` folder

## Setup

1. Clone or download this repository
2. Open `.env.local` and set `COMFY_URL` to your ComfyUI address (default: `http://127.0.0.1:8000`)
3. Make sure ComfyUI is running before launching the app

## Launch

Double-click **`start.bat`**

This will install dependencies, open your browser, and start the app.

## Usage

1. Describe your habit (e.g. "go to the gym every morning")
2. Wait for your world to generate
3. Click the log button each day to build your streak
4. Your world title evolves at streaks 1, 3, 7, 14, and 30
5. Use **Reset streak** to start over, or **Delete habit** to create a new one
