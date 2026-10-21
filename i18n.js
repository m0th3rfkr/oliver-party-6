// Spanish / English text for both pages. Spanish is the default.
// The HTML is written in Spanish; this swaps text in place when the guest picks English.
//   data-i18n="key"        -> textContent
//   data-i18n-html="key"   -> innerHTML (only for the fixed strings below, never guest input)
//   data-i18n-aria="key"   -> aria-label
//   data-i18n-alt="key"    -> alt
//   data-i18n-placeholder="key" -> placeholder
(function () {
  const DEFAULT_LANG = 'es';
  const STORAGE_KEY = 'party-lang';

  const STRINGS = {
    es: {
      'page.title': 'Fiesta de Alberca Paw Patrol de Oliver',
      'hero.kicker': '¡Paw Patrol, en acción!',
      'hero.title': "Oliver's<br>Pool Party!",
      'hero.tag': '¡Cachorros, cachorras, a chapotear! 💦',
      'hero.age': 'Oliver cumple <b>6</b>',
      'countdown.label': 'Tiempo para la fiesta',
      'countdown.days': 'Días',
      'countdown.hours': 'Horas',
      'countdown.minutes': 'Min',
      'countdown.seconds': 'Seg',
      'countdown.done': '¡Hora de la fiesta!',
      'details.title': 'Datos de la Misión',
      'details.when': '📅 Cuándo',
      'details.date': 'Sábado 7 de noviembre',
      'details.time': '⏰ Hora',
      'details.where': '🏠 Dónde',
      'details.map': '🗺️ Cómo llegar',
      'gear.title': 'Equipo de Cachorro',
      'gear.swimsuit': '🩳 Traje de baño',
      'gear.towel': '🏖️ Toalla',
      'gear.sunscreen': '🧴 Bloqueador solar',
      'gear.clothes': '👕 Ropa seca',
      'gear.spirit': '🐶 ¡Espíritu de cachorro!',
      'fun.title': 'Misiones del Día',
      'fun.swim': 'Albercada',
      'fun.hunt': 'Resbaladilla inflable',
      'fun.cake': 'Pastel y golosinas de cachorro',
      'rsvp.title': '¿Te unes a la manada?',
      'rsvp.text': 'Por favor confirma tu asistencia a más tardar el miércoles 4 de noviembre.',
      'rsvp.nameLabel': 'Nombre del amig@ de Oliver',
      'rsvp.namePlaceholder': 'Ej. Sofía',
      'rsvp.withLabel': '¿Con quién viene?',
      'rsvp.withPlaceholder': 'Ej. mamá, papá y su hermanito',
      'rsvp.allergiesLabel': '¿Alguna alergia? (opcional)',
      'rsvp.allergiesPlaceholder': 'Ej. nueces',
      'rsvp.nameMissing': 'Escribe el nombre del amig@ de Oliver.',
      'rsvp.button': 'Confirmar',
      'rsvp.message': '¡Hola! Confirmo que vamos a la fiesta de Oliver 🎉',
      'rsvp.messageName': '🐶 Amig@ de Oliver: {value}',
      'rsvp.messageWith': '👨‍👩‍👧 Viene con: {value}',
      'rsvp.messageAllergies': '⚠️ Alergias: {value}',
      'talk.title': '¿Quieres hablar con los papás de Oliver?',
      'talk.text': 'Escríbenos si tienes alguna duda.',
      'talk.button': 'Escribir por WhatsApp',
      'talk.message': '¡Hola! Tengo una pregunta sobre la fiesta de Oliver.',
      'gifts.title': 'Ideas de Regalo Paw Patrol',
      'gifts.text': '¿Buscas un regalo para Oliver? Aquí encontrarás ideas de Paw Patrol.',
      'gifts.button': 'Ver ideas de regalo',
      'albumCard.title': 'Álbum de la Fiesta',
      'albumCard.text': '¡Toma fotos y videos en la fiesta y súbelos a nuestra revista digital en vivo!',
      'albumCard.button': 'Abrir la revista',
      'footer': '¡Ningún trabajo es demasiado grande, ningún cachorro es demasiado pequeño! 🎉',

      'album.pageTitle': 'Revista de la Fiesta de Oliver',
      'album.title': 'La Revista de la Patrulla',
      'album.kicker': 'Edición especial · Oliver cumple 6',
      'album.intro': '¡Sube tus fotos y videos! Solo tú podrás verlos desde este teléfono.',
      'album.back': '← Volver a la invitación',
      'album.setupTitle': 'Vista previa.',
      'album.setupText': 'El álbum aún no está conectado, así que lo que subas ahora solo se ve en este navegador. Para conectarlo, sigue <code>SETUP.md</code>.',
      'album.add': '📷 Subir fotos y videos',
      'album.slideshow': '▶ Ver presentación',
      'album.scan': '¡Escanea para subir fotos y videos!',
      'album.drop': '¡Suelta tus fotos y videos para subirlos! 🐾',
      'album.viewer': 'Visor de fotos y videos',
      'album.close': 'Cerrar',
      'album.prev': 'Anterior',
      'album.next': 'Siguiente',
      'album.photoAlt': 'Foto de la fiesta',
      'album.videoLabel': 'Video de la fiesta',
      'album.open': 'Abrir',
      'album.save': '⬇ Descargar',
      'album.coverAlt': 'Invitación: Pool Party. Sábado 7 de noviembre, Oliver cumple 6 años',
      'album.page': 'Página {n}',
      'album.pageFooter': 'La Revista de la Patrulla',
      'album.headline.0': '¡Misión: diversión!',
      'album.headline.1': '¡Cachorros en acción!',
      'album.headline.2': '¡A chapotear!',
      'album.headline.3': '¡Ningún salto es demasiado grande!',
      'album.headline.4': 'Patrulla de la alberca',
      'album.headline.5': '¡Pastel a la vista!',
      'album.uploading': 'Subiendo {i} de {total}...',
      'album.partial': '{done} listos, {failed} no se pudieron subir. Los videos deben pesar menos de 50 MB. Inténtalo de nuevo o elige otro archivo.',
      'album.thanks.one': '¡Gracias! Ya está en la revista 🎉',
      'album.thanks.other': '¡Gracias! Se subieron {n} fotos y videos 🎉',
      'album.loadError': 'No se pudo cargar el álbum. Revisa tu conexión e inténtalo de nuevo.',
    },
    en: {
      'page.title': "Oliver's Paw Patrol Pool Party",
      'hero.kicker': 'Paw Patrol is on a roll!',
      'hero.title': "Oliver's<br>Pool Party!",
      'hero.tag': "Pups, pups, let's make a splash! 💦",
      'hero.age': 'Oliver is turning <b>6</b>',
      'countdown.label': 'Time until the party',
      'countdown.days': 'Days',
      'countdown.hours': 'Hours',
      'countdown.minutes': 'Mins',
      'countdown.seconds': 'Secs',
      'countdown.done': 'Party time!',
      'details.title': 'Mission Briefing',
      'details.when': '📅 When',
      'details.date': 'Saturday, November 7',
      'details.time': '⏰ Time',
      'details.where': '🏠 Where',
      'details.map': '🗺️ Get directions',
      'gear.title': 'Pup Gear Checklist',
      'gear.swimsuit': '🩳 Swimsuit',
      'gear.towel': '🏖️ Towel',
      'gear.sunscreen': '🧴 Sunscreen',
      'gear.clothes': '👕 Dry clothes',
      'gear.spirit': '🐶 Pup spirit!',
      'fun.title': "Today's Missions",
      'fun.swim': 'Pool party',
      'fun.hunt': 'Inflatable slide',
      'fun.cake': 'Cake and pup treats',
      'rsvp.title': 'Will You Join the Pack?',
      'rsvp.text': 'Please RSVP by Wednesday, November 4.',
      'rsvp.nameLabel': "Name of Oliver's friend",
      'rsvp.namePlaceholder': 'e.g. Sofia',
      'rsvp.withLabel': "Who's coming with them?",
      'rsvp.withPlaceholder': 'e.g. mom, dad and little brother',
      'rsvp.allergiesLabel': 'Any allergies? (optional)',
      'rsvp.allergiesPlaceholder': 'e.g. nuts',
      'rsvp.nameMissing': "Please write the name of Oliver's friend.",
      'rsvp.button': 'Confirm',
      'rsvp.message': "Hi! We're coming to Oliver's party 🎉",
      'rsvp.messageName': "🐶 Oliver's friend: {value}",
      'rsvp.messageWith': '👨‍👩‍👧 Coming with: {value}',
      'rsvp.messageAllergies': '⚠️ Allergies: {value}',
      'talk.title': "Want to talk to Oliver's parents?",
      'talk.text': 'Message us if you have any questions.',
      'talk.button': 'Message on WhatsApp',
      'talk.message': "Hi! I have a question about Oliver's party.",
      'gifts.title': 'Paw Patrol Gift Ideas',
      'gifts.text': 'Looking for a gift for Oliver? Here are some Paw Patrol ideas.',
      'gifts.button': 'See gift ideas',
      'albumCard.title': 'Party Album',
      'albumCard.text': 'Snap photos and videos at the party and add them to our live digital magazine!',
      'albumCard.button': 'Open the magazine',
      'footer': 'No job is too big, no pup is too small! 🎉',

      'album.pageTitle': "Oliver's Party Magazine",
      'album.title': 'The Pup Patrol Magazine',
      'album.kicker': 'Special edition · Oliver turns 6',
      'album.intro': "Add your photos and videos! Only you can see them, from this phone.",
      'album.back': '← Back to the party page',
      'album.setupTitle': 'Preview.',
      'album.setupText': "The album isn't connected yet, so anything you add now only shows in this browser. To connect it, follow <code>SETUP.md</code>.",
      'album.add': '📷 Add photos & videos',
      'album.slideshow': '▶ Play slideshow',
      'album.scan': 'Scan to add photos & videos!',
      'album.drop': 'Drop your photos and videos to add them! 🐾',
      'album.viewer': 'Photo and video viewer',
      'album.close': 'Close',
      'album.prev': 'Previous',
      'album.next': 'Next',
      'album.photoAlt': 'Party photo',
      'album.videoLabel': 'Party video',
      'album.open': 'Open',
      'album.save': '⬇ Download',
      'album.coverAlt': 'Invitation: Pool Party. Saturday, November 7, Oliver turns 6',
      'album.page': 'Page {n}',
      'album.pageFooter': 'The Pup Patrol Magazine',
      'album.headline.0': 'Mission: fun!',
      'album.headline.1': 'Pups in action!',
      'album.headline.2': "Let's make a splash!",
      'album.headline.3': 'No jump is too big!',
      'album.headline.4': 'Pool patrol',
      'album.headline.5': 'Cake ahoy!',
      'album.uploading': 'Adding {i} of {total}...',
      'album.partial': '{done} added, {failed} could not upload. Videos must be under 50 MB. Try again or pick a different file.',
      'album.thanks.one': 'Thanks! It is in the magazine 🎉',
      'album.thanks.other': 'Thanks! {n} photos and videos added 🎉',
      'album.loadError': 'Could not load the album. Check your connection and try again.',
    },
  };

  const listeners = [];

  function readSaved() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return STRINGS[saved] ? saved : DEFAULT_LANG;
    } catch (err) {
      return DEFAULT_LANG;
    }
  }

  let lang = readSaved();

  function t(key, vars = {}) {
    const text = STRINGS[lang][key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
  }

  // Picks the ".one" or ".other" form for n.
  function tn(key, n, vars = {}) {
    return t(`${key}.${n === 1 ? 'one' : 'other'}`, { n, ...vars });
  }

  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    root.querySelectorAll('[data-i18n-alt]').forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    root.querySelectorAll('[data-lang]').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang)));
  }

  function setLang(next) {
    if (!STRINGS[next] || next === lang) return;
    lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      // Private mode or blocked storage: the choice just won't be remembered.
    }
    document.documentElement.lang = lang;
    apply();
    listeners.forEach((fn) => fn(lang));
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  document.documentElement.lang = lang;
  apply();

  window.I18N = { t, tn, apply, onChange };
})();
