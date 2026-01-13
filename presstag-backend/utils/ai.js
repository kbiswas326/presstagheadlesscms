const http = require('http');
const { URL } = require('url');
const axios = require('axios');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || "llava";

function makeOllamaRequest(urlStr, bodyObj) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const postData = JSON.stringify(bodyObj);
        
        const options = {
            hostname: url.hostname,
            port: parseInt(url.port) || 80,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error("Failed to parse JSON response"));
                    }
                } else {
                    // Try to parse error message if possible
                    reject(new Error(`HTTP Status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        
        // specific timeout handling if needed
        req.setTimeout(60000, () => {
             req.destroy();
             reject(new Error("Request timed out"));
        });

        req.write(postData);
        req.end();
    });
}

async function generateKeyTakeaways(content) {
  // Check if content is provided
  if (!content) return [];

  const safeContent = content.substring(0, 15000); // Limit context size for safety

  const prompt = `You are an expert content analyst. Analyze the following article content and provide 3 to 4 concise, high-value key takeaways or "pointers" that summarize the most important information.

  Rules:
  1. Return ONLY a valid JSON array of strings.
  2. No markdown formatting (no \`\`\`json or \`\`\`).
  3. No introductory text.
  4. Each pointer should be a single sentence.
  5. Max 4 pointers.

  Content:
  ${safeContent}
  `;

  console.log(`Generating AI pointers using Ollama model: ${OLLAMA_MODEL}...`);

  try {
    const data = await makeOllamaRequest(OLLAMA_BASE_URL, {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        format: "json",
    });

    const text = data.response;
    console.log("AI Raw Response:", text);

    // Parse JSON
    try {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let pointers = JSON.parse(cleanedText);
        
        // Handle case where AI returns an object with a key like "pointers" or "takeaways"
        if (!Array.isArray(pointers) && typeof pointers === 'object') {
            const keys = Object.keys(pointers);
            for (const key of keys) {
                if (Array.isArray(pointers[key])) {
                    pointers = pointers[key];
                    break;
                }
            }
        }

        if (Array.isArray(pointers)) {
            return pointers.slice(0, 4);
        }
    } catch (e) {
        console.warn("JSON parse failed, attempting fallback parsing:", e);
        // Fallback for non-JSON response
         return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith(']'))
            .map(line => line.replace(/^[-•*]\s*/, '').replace(/^"\s*/, '').replace(/\s*",?$/, ''))
            .slice(0, 4);
    }

    return ["Could not parse AI response."];

  } catch (error) {
    console.error("Error connecting to Ollama:", error.message);
    
    // Specific advice for connection errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
        return [
            "Ollama is not running.",
            "1. Install Ollama from ollama.com",
            `2. Run: ollama pull ${OLLAMA_MODEL}`,
            "3. Make sure the Ollama app is running in the system tray."
        ];
    }
    
    if (error.message.includes('404')) {
         return [
            `Error: Model '${OLLAMA_MODEL}' not found.`,
            `Please run: ollama pull ${OLLAMA_MODEL}`,
            "Then try again."
         ];
    }

    return [
      "AI Generation Failed.",
      `Error: ${error.message}`,
      "Please ensure Ollama is installed and running."
    ];
  }
}

async function generateImageCaption(imageUrl) {
  if (!imageUrl) return "No image provided.";

  try {
    // 1. Fetch image and convert to base64
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');

    const prompt = "Describe this image in a single concise sentence suitable for a caption.";

    console.log(`Generating image caption using Ollama model: ${OLLAMA_VISION_MODEL}...`);

    const data = await makeOllamaRequest(OLLAMA_BASE_URL, {
        model: OLLAMA_VISION_MODEL,
        prompt: prompt,
        images: [base64Image],
        stream: false
    });

    return data.response.trim();
  } catch (error) {
    console.error("Error generating caption:", error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
        return "Ollama is not running. Please start Ollama.";
    }
    if (error.message.includes('404')) {
        return `Model '${OLLAMA_VISION_MODEL}' not found. Please run 'ollama pull ${OLLAMA_VISION_MODEL}'`;
    }

    return "Failed to generate caption.";
  }
}

module.exports = { generateKeyTakeaways, generateImageCaption };
