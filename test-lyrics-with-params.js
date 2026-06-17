async function test() {
  const formData = {
    category: "papa",
    childName: "Javier Rayas",
    familyNames: "su esposa Mary, hijos Javi, valeria, edgar, ulises y anibal",
    moodAndStyle: "ranchera norteña",
    mensajeHablado: "gracias papi",
    specificDetails: "mi papa se llama javier rayas, es de la sandia leon guanajuato"
  };

  const interviewAnswers = {
    "¿Existe algún apodo cariñoso, particular o incluso divertido con el que tú, Mary o tus hermanos (Javi, Valeria, Edgar, Ulises y Aníbal) se refieran a él, ya sea en casa o en la intimidad familiar?": "en el rancho todos lo conocen como kaliman o el kali",
    "Si tuvieras que elegir una frase, una enseñanza o una palabra recurrente que tu papá siempre use o que resuma su manera de amar y guiar a su familia, ¿cuál sería? Esa 'estampa' verbal que lo identifica por completo.": "es muy elocuente",
    "Finalmente, si esta canción lograra transmitirle el mensaje más importante de todos, ¿cuál es ese sentimiento exacto, esa emoción profunda, que deseas que tu papá Javier sienta al escucharla y que permanezca con él?": "orgullo por el padre que fue que aun que un tiempo estuvo ausente hoy es el mejor abuelo para sus nietos",
    "Cuéntanos una anécdota o recuerdo vívido de tu papá, Javier, que capture perfectamente su espíritu, su amor de padre o incluso su forma de ser característica. Esa historia que la familia siempre recuerda y les hace sonreír o conmoverse.": "cuando conquitaba a su hoy esposa, una vez amenazo con darse un tiro con una pistola de juguete",
    "Pensando en su vida, quizás en La Sandía, León Guanajuato, ¿cuál fue un momento difícil o un gran desafío que Javier superó con valentía y esfuerzo por sacar adelante a su familia, y cómo este momento los unió o les enseñó algo valioso?": "cuando los dejo para irse a estados unidos",
    "Más allá de su nombre, ¿cómo describirías a Javier Rayas? ¿Qué rasgo físico o de su personalidad es tan distintivo en él que, al pensarlo, inmediatamente lo reconocen como su padre y no como nadie más? (Por ejemplo, su sonrisa, sus manos fuertes, su forma de dar un consejo).": "serio muy politico siempre va a la plazita por noticias"
  };

  const context = "una cancion para mi papa";

  let contextSummary = `Categoría: ${formData.category}\n`;
  contextSummary += `Idea Inicial: ${context}\n`;
  
  if (formData.category === 'hijo') {
    contextSummary += `DATOS DEL NIÑO/A (OBLIGATORIO INCLUIR): \n`;
    contextSummary += `- Nombre: ${formData.childName}\n`;
    contextSummary += `- Fecha de Nacimiento: \n`;
    contextSummary += `INSTRUCCIÓN PARA NIÑO: La canción debe mencionar su nombre, el significado de su nombre (o un mensaje sobre su origen) y la importancia del día que nació.\n\n`;
  }

  if (formData.specificDetails) {
    contextSummary += `Detalles Específicos Adicionales: ${formData.specificDetails}\n`;
  }
  if (formData.familyNames) {
    contextSummary += `Personas importantes (esposa, hijos, etc.): ${formData.familyNames}\n`;
  }
  contextSummary += `\nHechos y Detalles Extraídos de la Entrevista:\n`;
  Object.entries(interviewAnswers).forEach(([q, a], index) => {
    contextSummary += `- Detalle ${index + 1}: ${a}\n`;
  });

  const isTribute = formData.category === 'papa';
  const prompt = `Eres un compositor experto de canciones personalizadas. 
  Genera la letra completa de una canción siguiendo estos datos, estructurada con [Verse 1], [Chorus], [Verse 2], [Spoken Word], [Chorus], [Bridge], [Outro].
  
  CONTEXTO Y DETALLES EMOCIONALES:
  ${contextSummary}
  
  MENSAJE HABLADO (Para la sección [Spoken Word]):
  "${formData.mensajeHablado}"
  
  ESTILO DE LA CANCIÓN DESEADO:
  ${formData.moodAndStyle}
  
  INSTRUCCIONES CRÍTICAS DE REDACCIÓN:
  1. PROHIBICIÓN: No incluyas nunca la frase "Media Naranja" ni menciones a la plataforma en la letra. La canción debe ser 100% personal para el destinatario.
  2. NIÑOS/BEBÉS: Si la categoría es 'hijo', es MANDATORIO que investigues o deduzcas poéticamente el significado de su nombre "${formData.childName}" y lo integres en un verso. Debe sentirse como una bendición o un regalo del destino.
  3. FLUIDEZ: Incorpora los detalles de las respuestas en la lírica de forma natural y poética.
  4. SPOKEN WORD: La sección [Spoken Word] debe contener el mensaje hablado proporcionado.${isTribute ? `\n  5. REGLAS DE FORMATO Y METATAGS (¡CRÍTICO PARA SUNO!): SUNO NO ENTIENDE INSTRUCCIONES DESCRIPTIVAS. NUNCA escribas frases narrativas dentro de los corchetes (por ejemplo, PROHIBIDO escribir: "[Baja la música, entra violín]"). Suno cantará ese texto por error. Si necesitas cambiar la música, usa ÚNICAMENTE metatags estructurales estándar de 1 o 2 palabras en inglés (ejemplo: [Break], [Guitar Solo], [Instrumental Interlude], [Drop], [Build], [Acapella]).
  6. PERSPECTIVA DEL NARRADOR: Canta desde la perspectiva de un observador ("él era...") o colectivo ("nuestro padre..."). Cuenta su historia en tercera persona, no le cantes directamente ("tú").` : `\n  5. METATAGS DE SUNO: NUNCA uses frases descriptivas en los corchetes (ej. "[Música suave]"). Suno lo cantará por error. Usa solo etiquetas cortas en inglés: [Verse], [Chorus], [Bridge], [Guitar Solo], [Break].`}
  ${isTribute ? '7' : '6'}. Responde ÚNICAMENTE con la letra estructurada.`;

  try {
    const response = await fetch('https://hkakmdpqbbsstacpgpqe.supabase.co/functions/v1/generate-lyrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    console.log("STATUS:", response.status);
    console.log("RESPONSE DATA:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
