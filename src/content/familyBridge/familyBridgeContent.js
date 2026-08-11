export const FAMILY_BRIDGE_LANGUAGES = Object.freeze([
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
  { id: "zh-Hans", label: "简体中文" }
]);

export const FAMILY_BRIDGE_COPY = Object.freeze({
  en: {
    listJoiner: " and ", fallbackSounds: "the current English sounds", fallbackWords: "the words sent home by the teacher", fallbackBook: "a favourite book",
    privacyTitle: "Privacy by design", privacyText: "No family account is needed. The app does not record a child’s voice or image, and it does not claim that a home activity was completed.", printPrivacy: "No app sign-in is needed. Nothing on this sheet records a child’s voice or image, and home completion is not tracked.",
    title: "Five small reading moments",
    note: "About 5–10 minutes each. Keep it warm and stop before it feels tiring.",
    languageNote: "The sounds and words below are English literacy practice.",
    activityTitles: ["Sound hunt", "Letter find", "Quick words", "Read and talk", "Child’s choice"],
    activities: {
      sound: focus => `Find three things whose English names begin with ${focus}. Say each English name together.`,
      letters: focus => `Write ${focus} on small paper squares. Mix them up, find each one, and say its English sound.`,
      words: words => `Point to each quick word—${words}. Read it together, then find it in a book or on a label.`,
      book: () => "Choose any book you already have at home, or reread the quick words on this sheet. Pause once to ask: “What do you notice?” There is no test and no app sign-in.",
      celebrate: () => "Let the child choose a favourite word or page. Say what made that choice interesting."
    }
  },
  es: {
    listJoiner: " y ", fallbackSounds: "los sonidos actuales del inglés", fallbackWords: "las palabras que envió el docente", fallbackBook: "un libro favorito",
    privacyTitle: "Privacidad desde el diseño", privacyText: "No se necesita una cuenta familiar. La aplicación no graba la voz ni la imagen del niño y no afirma que se haya completado una actividad en casa.", printPrivacy: "No se necesita iniciar sesión. Esta hoja no graba la voz ni la imagen del niño y no registra si se completó la actividad en casa.",
    title: "Cinco momentos breves de lectura",
    note: "Unos 5–10 minutos cada vez. Manténganlo agradable y paren antes de que canse.",
    languageNote: "Los sonidos y las palabras de abajo son práctica de lectura en inglés.",
    activityTitles: ["Búsqueda de sonidos", "Encuentra la letra", "Palabras rápidas", "Leer y conversar", "Elección del niño"],
    activities: {
      sound: focus => `Busquen tres cosas cuyos nombres en inglés empiecen con ${focus}. Digan juntos cada nombre en inglés.`,
      letters: focus => `Escriban ${focus} en papelitos. Mézclenlos, encuentren cada uno y digan su sonido en inglés.`,
      words: words => `Señalen cada palabra rápida—${words}. Léanla juntos y búsquenla en un libro o una etiqueta.`,
      book: () => "Elijan cualquier libro que ya tengan en casa o vuelvan a leer las palabras rápidas de esta hoja. Hagan una pausa para preguntar: “¿Qué notas?” No es un examen y no hace falta iniciar sesión.",
      celebrate: () => "Dejen que el niño elija una palabra o página favorita. Comenten por qué fue interesante."
    }
  },
  "zh-Hans": {
    listJoiner: " 和 ", fallbackSounds: "当前学习的英语发音", fallbackWords: "老师发回家的单词", fallbackBook: "一本喜欢的书",
    privacyTitle: "隐私保护设计", privacyText: "无需家庭账户。应用不会录制孩子的声音或图像，也不会声称孩子完成了家庭活动。", printPrivacy: "无需登录应用。本页不会录制孩子的声音或图像，也不会追踪家庭活动是否完成。",
    title: "五个轻松的阅读时刻",
    note: "每次约 5–10 分钟。保持轻松，在孩子感到疲倦前结束。",
    languageNote: "下面的字母发音和单词用于英语读写练习。",
    activityTitles: ["寻找声音", "寻找字母", "常用词", "阅读与交流", "孩子来选择"],
    activities: {
      sound: focus => `找出三个英文名称以 ${focus} 开头的物品，一起说出每个英文名称。`,
      letters: focus => `把 ${focus} 写在小纸片上。打乱后逐个找出，并说出它的英语发音。`,
      words: words => `依次指着这些常用词：${words}。一起读，再到书本或标签中寻找。`,
      book: () => "选择家里已有的一本书，或重读本页上的常用词。中途问一次：“你注意到了什么？”这不是测验，也不需要登录应用。",
      celebrate: () => "让孩子选一个最喜欢的单词或页面，并聊聊为什么有趣。"
    }
  }
});
