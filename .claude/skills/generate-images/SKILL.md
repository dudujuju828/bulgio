---
name: generate-images
description: Generate flashcard images for a category using Gemini AI
argument-hint: <category>
---

# Generate Images

Generate flashcard images for the **$ARGUMENTS** category.

## Steps

1. Run the image generation script:
   ```
   node scripts/generate-images.mjs $ARGUMENTS
   ```
2. Wait for it to complete. The script will:
   - Read `src/data/cards/$ARGUMENTS.json`
   - Generate a flat illustration for each card that doesn't already have an image
   - Save images to `public/images/cards/$ARGUMENTS/`
   - Update the JSON file with `image` paths
3. If the script fails due to a model name issue, check the Gemini API docs for the current image generation model and update the `MODEL` variable in `scripts/generate-images.mjs`.
4. After successful generation, commit and push the changes (both the images and updated JSON).
