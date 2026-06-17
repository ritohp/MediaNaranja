async function testGemini() {
  const apiKey = "AIzaSyBGuMiBt56js9UzWf5vs6Hl45EIMnkO9sA";
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
      })
    });
    const data = await response.json();
    console.log("STATUS:", response.status);
    console.log("RESPONSE:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("ERROR:", error);
  }
}

testGemini();
