async function test() {
  try {
    const response = await fetch('https://hkakmdpqbbsstacpgpqe.supabase.co/functions/v1/generate-lyrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: 'Genera una linea de cancion corta de prueba' })
    });
    const data = await response.json();
    console.log("STATUS:", response.status);
    console.log("RESPONSE DATA:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
