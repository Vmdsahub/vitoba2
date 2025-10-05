/**
 * Utility to clean content from edit-mode attributes when rendering in posts/comments
 */

export function cleanContentForDisplay(content: string): string {
  if (!content) return content;

  const originalContent = content;

  // Remove data-edit-mode attributes from video elements and containers
  let cleanedContent = content
    .replace(/data-edit-mode="true"/g, "")
    .replace(/data-edit-mode="false"/g, "")
    .replace(/data-edit-mode='true'/g, "")
    .replace(/data-edit-mode='false'/g, "")
    // Clean up any extra spaces left by attribute removal
    .replace(/\s+/g, " ")
    .replace(/\s+>/g, ">");

  // Preserve line breaks before removing delete buttons
  // Normalize line break patterns first
  cleanedContent = cleanedContent
    .replace(/<div><br><\/div>/g, "<br>")
    .replace(/<div><br\/><\/div>/g, "<br>")
    .replace(/<div>\s*<\/div>/g, "<br>");

  // Remove ALL delete buttons (trash icon buttons) from content when displaying
  // Pattern 1: Remove buttons with delete title attributes
  cleanedContent = cleanedContent.replace(
    /<button[^>]*title="Excluir [^"]*"[^>]*>[\s]*🗑️[\s]*<\/button>/g,
    "",
  );

  // Pattern 2: Remove buttons with onclick handlers
  cleanedContent = cleanedContent.replace(
    /<button[^>]*onclick="[^"]*"[^>]*>[\s]*🗑️[\s]*<\/button>/g,
    "",
  );

  // Pattern 3: Remove any button containing just the trash emoji
  cleanedContent = cleanedContent.replace(
    /<button[^>]*>[\s]*🗑️[\s]*<\/button>/g,
    "",
  );

  // Remove wrapper divs that contained images and delete buttons, keep only the image
  cleanedContent = cleanedContent.replace(
    /<div[^>]*style="[^"]*position:\s*relative[^"]*"[^>]*>\s*(<img[^>]*>)\s*<button[^>]*>[\s]*🗑️[\s]*<\/button>\s*<\/div>/g,
    "$1",
  );

  // Clean up any remaining wrapper divs with only images
  cleanedContent = cleanedContent.replace(
    /<div[^>]*style="[^"]*position:\s*relative[^"]*"[^>]*>\s*(<img[^>]*>)\s*<\/div>/g,
    "$1",
  );

  // Remove delete buttons from video previews while keeping the video structure
  cleanedContent = cleanedContent.replace(
    /(<div[^>]*class="video-preview"[^>]*>.*?)<button[^>]*>[\s]*🗑️[\s]*<\/button>(.*?<\/div>)/gs,
    "$1$2",
  );

  // Log if any cleaning was performed
  if (originalContent !== cleanedContent && originalContent.includes("🗑️")) {
    console.log("🧹 Content cleaned for display - removed trash buttons:", {
      original: originalContent.length,
      cleaned: cleanedContent.length,
      removed: originalContent.length - cleanedContent.length,
    });
  }

  return cleanedContent;
}

export function cleanContentForSaving(content: string): string {
  if (!content) return content;

  // Remove all edit-mode specific attributes before saving
  let cleanedContent = content
    .replace(/data-edit-mode="[^"]*"/g, "")
    .replace(/data-edit-mode='[^']*'/g, "")
    .replace(/data-click-handled="[^"]*"/g, "")
    .replace(/data-click-handled='[^']*'/g, "")
    // Clean up any extra spaces
    .replace(/\s+/g, " ")
    .replace(/\s+>/g, ">");

  // Preserve line breaks before removing delete buttons
  // Normalize line break patterns first
  cleanedContent = cleanedContent
    .replace(/<div><br><\/div>/g, "<br>")
    .replace(/<div><br\/><\/div>/g, "<br>")
    .replace(/<div>\s*<\/div>/g, "<br>");

  // Remove ALL delete buttons (trash icon buttons) before saving
  // Pattern 1: Remove buttons with delete title attributes
  cleanedContent = cleanedContent.replace(
    /<button[^>]*title="Excluir [^"]*"[^>]*>[\s]*🗑️[\s]*<\/button>/g,
    "",
  );

  // Pattern 2: Remove buttons with onclick handlers
  cleanedContent = cleanedContent.replace(
    /<button[^>]*onclick="[^"]*"[^>]*>[\s]*🗑️[\s]*<\/button>/g,
    "",
  );

  // Pattern 3: Remove any button containing just the trash emoji
  cleanedContent = cleanedContent.replace(
    /<button[^>]*>[\s]*🗑️[\s]*<\/button>/g,
    "",
  );

  // Remove wrapper divs that contained images and delete buttons, keep only the image
  cleanedContent = cleanedContent.replace(
    /<div[^>]*style="[^"]*position:\s*relative[^"]*"[^>]*>\s*(<img[^>]*>)\s*<button[^>]*>[\s]*🗑️[\s]*<\/button>\s*<\/div>/g,
    "$1",
  );

  // Clean up any remaining wrapper divs with only images
  cleanedContent = cleanedContent.replace(
    /<div[^>]*style="[^"]*position:\s*relative[^"]*"[^>]*>\s*(<img[^>]*>)\s*<\/div>/g,
    "$1",
  );

  // Remove delete buttons from video previews while keeping the video structure
  cleanedContent = cleanedContent.replace(
    /(<div[^>]*class="video-preview"[^>]*>.*?)<button[^>]*>[\s]*🗑️[\s]*<\/button>(.*?<\/div>)/gs,
    "$1$2",
  );

  return cleanedContent;
}
