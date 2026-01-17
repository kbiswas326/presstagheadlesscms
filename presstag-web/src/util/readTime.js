export function calculateReadTime(content) {
    if (!content) return '1 min read'; // Default fallback

    // Remove HTML tags and trim whitespace
    const text = content.replace(/<[^>]*>/g, '').trim();
    
    // Count words (split by whitespace)
    const words = text.split(/\s+/).length;
    
    // Calculate reading time (assuming 200 words per minute)
    const minutes = Math.ceil(words / 200);
    
    // Format the output
    if (minutes < 1) return '1 min read';
    return `${minutes} min read`;
}