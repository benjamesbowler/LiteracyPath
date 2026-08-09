export const FAMILY_BRIDGE_LANGUAGES = Object.freeze([
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
  { id: "zh-Hans", label: "简体中文" }
]);

export const FAMILY_BRIDGE_COPY = Object.freeze({
  en: {
    title: "Five small reading moments",
    note: "About 5–10 minutes each. Keep it warm and stop before it feels tiring.",
    languageNote: "The sounds and words below are English literacy practice.",
    activityTitles: ["Sound hunt", "Letter find", "Quick words", "Read and talk", "Child’s choice"],
    activities: {
      sound: focus => `Find three things whose English names begin with ${focus}. Say each English name together.`,
      letters: focus => `Write ${focus} on small paper squares. Mix them up, find each one, and say its English sound.`,
      words: words => `Point to each quick word—${words}. Read it together, then find it in a book or on a label.`,
      book: title => `Read ${title} together. Pause once to ask: “What do you notice?” There is no test.`,
      celebrate: () => "Let the child choose a favourite word or page. Say what made that choice interesting."
    }
  },
  es: {
    title: "Cinco momentos breves de lectura",
    note: "Unos 5–10 minutos cada vez. Manténganlo agradable y paren antes de que canse.",
    languageNote: "Los sonidos y las palabras de abajo son práctica de lectura en inglés.",
    activityTitles: ["Búsqueda de sonidos", "Encuentra la letra", "Palabras rápidas", "Leer y conversar", "Elección del niño"],
    activities: {
      sound: focus => `Busquen tres cosas cuyos nombres en inglés empiecen con ${focus}. Digan juntos cada nombre en inglés.`,
      letters: focus => `Escriban ${focus} en papelitos. Mézclenlos, encuentren cada uno y digan su sonido en inglés.`,
      words: words => `Señalen cada palabra rápida—${words}. Léanla juntos y búsquenla en un libro o una etiqueta.`,
      book: title => `Lean juntos ${title}. Hagan una pausa para preguntar: “¿Qué notas?” No es un examen.`,
      celebrate: () => "Dejen que el niño elija una palabra o página favorita. Comenten por qué fue interesante."
    }
  },
  "zh-Hans": {
    title: "五个轻松的阅读时刻",
    note: "每次约 5–10 分钟。保持轻松，在孩子感到疲倦前结束。",
    languageNote: "下面的字母发音和单词用于英语读写练习。",
    activityTitles: ["寻找声音", "寻找字母", "常用词", "阅读与交流", "孩子来选择"],
    activities: {
      sound: focus => `找出三个英文名称以 ${focus} 开头的物品，一起说出每个英文名称。`,
      letters: focus => `把 ${focus} 写在小纸片上。打乱后逐个找出，并说出它的英语发音。`,
      words: words => `依次指着这些常用词：${words}。一起读，再到书本或标签中寻找。`,
      book: title => `一起阅读《${title}》。中途问一次：“你注意到了什么？”这不是测验。`,
      celebrate: () => "让孩子选一个最喜欢的单词或页面，并聊聊为什么有趣。"
    }
  }
});
