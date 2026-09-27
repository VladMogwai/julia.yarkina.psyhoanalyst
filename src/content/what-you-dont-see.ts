import type { Locale } from "@/i18n/config";

/**
 * Landing page of the paid questionnaire "What don't you see?" in the "Self-knowledge" section:
 * Julia's text (Ukrainian original, 2026-09-26) and its translations.
 */
/** A phrase wrapped in … is a note Julia marked: it gets a marker highlight as it scrolls into view. */
export interface WhatYouDontSeeText {
  metaTitle: string;
  metaDescription: string;
  title: string;
  subtitle: string;
  welcome: string;
  intro: string[];
  /** Julia's note beside the marked "There are questions." of the intro. */
  questionsNote: string;
  /** The "why do I…" questions, shown as quotes. */
  whys: string[];
  optics: string;
  noticeTitle: string;
  notice: string[];
  /** When to stop and look for professional help instead. */
  help: string[];
  goToQuestions: string;
  soon: string;
  copyrightTitle: string;
  copyright: string;
  license: string;
  forbiddenIntro: string;
  forbidden: string[];
  personal: string;
  enforcement: string;
}

export const whatYouDontSee: Record<Locale, WhatYouDontSeeText> = {
  uk: {
    metaTitle: "Що ти не бачиш? — 52 психоаналітичні питання для самодослідження",
    metaDescription:
      "52 психоаналітичні питання для самодослідження від психоаналітика Юлії Яркіної: подивитися на знайомі переживання через бажання, страхи, захисти й повторювані сценарії.",
    title: "Що ти не бачиш?",
    subtitle: "52 психоаналітичні питання для самодослідження",
    welcome: "Ласкаво прошу!",
    intro: [
      "Цей простір створений для того, щоб на деякий час зупинитися, прислухатися до себе й подивитися на знайомі переживання з іншого боку.",
      "==Тут немає тестів, діагнозів і готових відповідей.==",
      "==Є питання.==",
      "Іноді здається ми можемо дуже добре знати, що з нами відбувається, але зовсім не розуміти, чому саме це з нами відбувається.",
    ],
    questionsNote: "Спробуй відповідати першим, що спадає на думку.",
    whys: [
      "Чому я знову опинився/опинилася у схожих стосунках?",
      "Чому мені так складно сказати «ні»?",
      "Чому я відчуваю провину, коли обираю себе?",
      "Чому я відкладаю те, чого насправді хочу?",
      "Чому я знаю, що потрібно робити, але все одно не можу зробити крок?",
    ],
    optics:
      "«Що ти не бачиш?» пропонує подивитися на ці переживання через психоаналітичну оптику — через бажання, страхи, захисти, внутрішні конфлікти та повторювані сценарії.",
    noticeTitle: "Але є важливе «але».",
    notice: [
      "Цей продукт НЕ є психологічною, психотерапевтичною чи психіатричною допомогою.",
      "Він не є медичною послугою, психотерапією, діагностикою, лікуванням або заміною консультації фахівця.",
      "Питання та пояснення в цьому навігаторі мають виключно інформаційний та рефлексивний характер і призначені для самодослідження.",
      "Вони не можуть визначити причини вашого стану, встановити діагноз або дати індивідуальну рекомендацію.",
      "Одна й та сама проблема може мати абсолютно різне значення для різних людей. Наші переживання пов’язані з особистою історією, досвідом, стосунками та контекстом життя.",
      "Тому не сприймайте запропоновані інтерпретації як твердження про себе.",
      "Це лише можливі напрямки для роздумів.",
    ],
    help: [
      "Якщо певне питання викликає сильні або тривалі переживання — не змушуйте себе продовжувати.",
      "Якщо ви переживаєте гострий психологічний або психічний стан, кризу, різке погіршення самопочуття, думки про самопошкодження чи суїцид або інші стани, які викликають занепокоєння, не покладайтеся на цей продукт.",
      "Зверніться по професійну допомогу до психолога, психотерапевта або психіатра. У невідкладній ситуації зверніться по екстрену допомогу.",
      "Психотерапія є окремою формою професійної допомоги у сфері психічного здоров’я, а психіатрична допомога охоплює, зокрема, діагностику та лікування психічних розладів.",
    ],
    goToQuestions: "Перейти до запитань",
    soon: "Продаж відкриється незабаром.",
    copyrightTitle: "Авторські права та умови використання",
    copyright:
      "©Яркіна Юлія / Що ти не бачиш?, 2026. Усі права захищені. Матеріали цього продукту, зокрема тексти, питання, авторські пояснення, структура, послідовність матеріалів та оформлення, є об’єктами авторського права в частині, що охороняється законодавством України.",
    license:
      "Придбання доступу до продукту надає покупцеві особисте, невиключне та непередаване право користуватися матеріалами виключно для власного особистого використання.",
    forbiddenIntro: "Забороняється без попередньої письмової згоди автора:",
    forbidden: [
      "копіювати та відтворювати матеріали повністю або частково;",
      "публікувати їх у відкритому доступі;",
      "пересилати або передавати доступ до продукту третім особам;",
      "продавати, перепродавати або поширювати матеріали;",
      "використовувати питання, тексти, структуру або інші матеріали продукту у власних комерційних продуктах, курсах, консультаціях, публікаціях чи інших матеріалах;",
      "видавати матеріали або їх частини за власну авторську розробку.",
    ],
    personal: "Доступ до продукту є персональним.",
    enforcement:
      "Будь-яке незаконне копіювання, поширення або комерційне використання матеріалів може порушувати права автора та мати наслідки, передбачені законодавством України.",
  },
  en: {
    metaTitle: "What don’t you see? — 52 psychoanalytic questions for self-exploration",
    metaDescription:
      "52 psychoanalytic questions for self-exploration by psychoanalyst Yuliia Yarkina: look at familiar experiences through desires, fears, defences and repeating scenarios.",
    title: "What don’t you see?",
    subtitle: "52 psychoanalytic questions for self-exploration",
    welcome: "Welcome!",
    intro: [
      "This space was created so that you can stop for a while, listen to yourself and look at familiar experiences from another side.",
      "==There are no tests, diagnoses or ready-made answers here.==",
      "==There are questions.==",
      "Sometimes it seems we can know very well what is happening to us, yet not understand at all why exactly it is happening to us.",
    ],
    questionsNote: "Try answering with the first thing that comes to mind.",
    whys: [
      "Why do I end up in similar relationships again?",
      "Why is it so hard for me to say “no”?",
      "Why do I feel guilty when I choose myself?",
      "Why do I put off what I really want?",
      "Why do I know what needs to be done, but still cannot take a step?",
    ],
    optics:
      "“What don’t you see?” invites you to look at these experiences through a psychoanalytic lens — through desires, fears, defences, inner conflicts and repeating scenarios.",
    noticeTitle: "But there is an important “but”.",
    notice: [
      "This product is NOT psychological, psychotherapeutic or psychiatric help.",
      "It is not a medical service, psychotherapy, diagnosis, treatment or a substitute for consulting a specialist.",
      "The questions and explanations in this guide are purely informational and reflective and are intended for self-exploration.",
      "They cannot determine the causes of your state, make a diagnosis or give individual advice.",
      "The same problem can mean something completely different to different people. Our experiences are bound up with our personal history, experience, relationships and life context.",
      "So do not take the interpretations offered here as statements about yourself.",
      "They are only possible directions for reflection.",
    ],
    help: [
      "If a question stirs up strong or lasting feelings, do not force yourself to go on.",
      "If you are going through an acute psychological or mental state, a crisis, a sharp decline in how you feel, thoughts of self-harm or suicide, or other states that worry you, do not rely on this product.",
      "Seek professional help from a psychologist, psychotherapist or psychiatrist. In an emergency, call emergency services.",
      "Psychotherapy is a separate form of professional mental health care, and psychiatric care includes, among other things, the diagnosis and treatment of mental disorders.",
    ],
    goToQuestions: "Go to the questions",
    soon: "Sales open soon.",
    copyrightTitle: "Copyright and terms of use",
    copyright:
      "©Yuliia Yarkina / What don’t you see?, 2026. All rights reserved. The materials of this product, including texts, questions, the author’s explanations, structure, sequence of materials and design, are subject to copyright to the extent protected by the law of Ukraine.",
    license:
      "Buying access to the product gives the buyer a personal, non-exclusive and non-transferable right to use the materials solely for their own personal use.",
    forbiddenIntro: "Without the author’s prior written consent, it is prohibited to:",
    forbidden: [
      "copy or reproduce the materials in whole or in part;",
      "publish them publicly;",
      "forward or pass on access to the product to third parties;",
      "sell, resell or distribute the materials;",
      "use the questions, texts, structure or other materials of the product in your own commercial products, courses, consultations, publications or other materials;",
      "present the materials or parts of them as your own original work.",
    ],
    personal: "Access to the product is personal.",
    enforcement:
      "Any unlawful copying, distribution or commercial use of the materials may infringe the author’s rights and have consequences under the law of Ukraine.",
  },
  fr: {
    metaTitle: "Que ne vois-tu pas ? — 52 questions psychanalytiques pour s’explorer",
    metaDescription:
      "52 questions psychanalytiques pour s’explorer, par la psychanalyste Yuliia Yarkina : regarder des vécus familiers à travers les désirs, les peurs, les défenses et les scénarios qui se répètent.",
    title: "Que ne vois-tu pas ?",
    subtitle: "52 questions psychanalytiques pour s’explorer",
    welcome: "Bienvenue !",
    intro: [
      "Cet espace a été créé pour s’arrêter un moment, s’écouter et regarder des vécus familiers sous un autre angle.",
      "==Il n’y a ici ni tests, ni diagnostics, ni réponses toutes faites.==",
      "==Il y a des questions.==",
      "Il semble parfois que nous savons très bien ce qui nous arrive, sans comprendre du tout pourquoi cela nous arrive.",
    ],
    questionsNote: "Essaie de répondre la première chose qui te vient à l’esprit.",
    whys: [
      "Pourquoi est-ce que je me retrouve encore dans des relations semblables ?",
      "Pourquoi est-ce si difficile pour moi de dire « non » ?",
      "Pourquoi est-ce que je me sens coupable quand je me choisis ?",
      "Pourquoi est-ce que je repousse ce que je veux vraiment ?",
      "Pourquoi est-ce que je sais ce qu’il faut faire, sans pouvoir pourtant faire un pas ?",
    ],
    optics:
      "« Que ne vois-tu pas ? » propose de regarder ces vécus à travers le prisme psychanalytique — à travers les désirs, les peurs, les défenses, les conflits intérieurs et les scénarios qui se répètent.",
    noticeTitle: "Mais il y a un « mais » important.",
    notice: [
      "Ce produit N’EST PAS une aide psychologique, psychothérapeutique ou psychiatrique.",
      "Il n’est ni un service médical, ni une psychothérapie, ni un diagnostic, ni un traitement, ni un substitut à la consultation d’un spécialiste.",
      "Les questions et explications de ce guide ont un caractère uniquement informatif et réflexif et sont destinées à l’exploration de soi.",
      "Elles ne peuvent pas déterminer les causes de votre état, poser un diagnostic ni donner de recommandation individuelle.",
      "Un même problème peut avoir un sens complètement différent selon les personnes. Nos vécus sont liés à notre histoire personnelle, à notre expérience, à nos relations et au contexte de notre vie.",
      "Ne prenez donc pas les interprétations proposées pour des affirmations sur vous-même.",
      "Ce ne sont que des pistes de réflexion possibles.",
    ],
    help: [
      "Si une question suscite des émotions fortes ou durables, ne vous forcez pas à continuer.",
      "Si vous traversez un état psychologique ou psychique aigu, une crise, une dégradation brutale de votre état, des pensées d’automutilation ou de suicide, ou d’autres états qui vous inquiètent, ne vous reposez pas sur ce produit.",
      "Adressez-vous à un professionnel : psychologue, psychothérapeute ou psychiatre. En cas d’urgence, contactez les services d’urgence.",
      "La psychothérapie est une forme distincte d’aide professionnelle en santé mentale, et les soins psychiatriques comprennent notamment le diagnostic et le traitement des troubles psychiques.",
    ],
    goToQuestions: "Aller aux questions",
    soon: "La vente ouvre bientôt.",
    copyrightTitle: "Droits d’auteur et conditions d’utilisation",
    copyright:
      "©Yuliia Yarkina / Que ne vois-tu pas ?, 2026. Tous droits réservés. Les contenus de ce produit, notamment les textes, les questions, les explications de l’autrice, la structure, l’enchaînement des contenus et la mise en forme, sont des œuvres protégées par le droit d’auteur dans la mesure prévue par la législation ukrainienne.",
    license:
      "L’achat de l’accès au produit confère à l’acheteur un droit personnel, non exclusif et non cessible d’utiliser les contenus exclusivement pour son usage personnel.",
    forbiddenIntro: "Sans l’accord écrit préalable de l’autrice, il est interdit de :",
    forbidden: [
      "copier et reproduire les contenus en tout ou en partie ;",
      "les publier en accès libre ;",
      "transférer ou céder l’accès au produit à des tiers ;",
      "vendre, revendre ou diffuser les contenus ;",
      "utiliser les questions, textes, la structure ou d’autres contenus du produit dans ses propres produits commerciaux, cours, consultations, publications ou autres supports ;",
      "présenter les contenus ou des parties de ceux-ci comme sa propre création.",
    ],
    personal: "L’accès au produit est personnel.",
    enforcement:
      "Toute copie, diffusion ou utilisation commerciale illicite des contenus peut porter atteinte aux droits de l’autrice et entraîner les conséquences prévues par la législation ukrainienne.",
  },
  ro: {
    metaTitle: "Ce nu vezi? — 52 de întrebări psihanalitice pentru autocunoaștere",
    metaDescription:
      "52 de întrebări psihanalitice pentru autocunoaștere, de psihanalista Iulia Iarkina: privește trăiri cunoscute prin dorințe, frici, apărări și scenarii care se repetă.",
    title: "Ce nu vezi?",
    subtitle: "52 de întrebări psihanalitice pentru autocunoaștere",
    welcome: "Bine ai venit!",
    intro: [
      "Acest spațiu a fost creat ca să te oprești pentru o vreme, să te asculți și să privești trăiri cunoscute din altă parte.",
      "==Aici nu există teste, diagnostice sau răspunsuri gata făcute.==",
      "==Există întrebări.==",
      "Uneori pare că știm foarte bine ce ni se întâmplă, dar nu înțelegem deloc de ce anume ni se întâmplă.",
    ],
    questionsNote: "Încearcă să răspunzi primul lucru care îți vine în minte.",
    whys: [
      "De ce ajung din nou în relații asemănătoare?",
      "De ce îmi este atât de greu să spun „nu”?",
      "De ce mă simt vinovat/vinovată când mă aleg pe mine?",
      "De ce amân ceea ce îmi doresc cu adevărat?",
      "De ce știu ce trebuie să fac, dar tot nu pot face un pas?",
    ],
    optics:
      "„Ce nu vezi?” te invită să privești aceste trăiri prin lentila psihanalitică — prin dorințe, frici, apărări, conflicte interioare și scenarii care se repetă.",
    noticeTitle: "Dar există un „dar” important.",
    notice: [
      "Acest produs NU este ajutor psihologic, psihoterapeutic sau psihiatric.",
      "Nu este un serviciu medical, psihoterapie, diagnostic, tratament și nici un înlocuitor al consultației unui specialist.",
      "Întrebările și explicațiile din acest ghid au un caracter exclusiv informativ și reflexiv și sunt destinate autocunoașterii.",
      "Ele nu pot stabili cauzele stării tale, nu pot pune un diagnostic și nu pot oferi o recomandare individuală.",
      "Aceeași problemă poate avea o semnificație cu totul diferită pentru oameni diferiți. Trăirile noastre sunt legate de istoria personală, experiență, relații și contextul vieții.",
      "De aceea, nu lua interpretările propuse drept afirmații despre tine.",
      "Sunt doar direcții posibile de reflecție.",
    ],
    help: [
      "Dacă o întrebare stârnește trăiri puternice sau de durată, nu te forța să continui.",
      "Dacă treci printr-o stare psihologică sau psihică acută, o criză, o înrăutățire bruscă a stării, gânduri de autovătămare sau de sinucidere ori alte stări care te îngrijorează, nu te baza pe acest produs.",
      "Cere ajutor profesionist de la un psiholog, psihoterapeut sau psihiatru. În situații de urgență, sună la serviciile de urgență.",
      "Psihoterapia este o formă distinctă de ajutor profesionist în domeniul sănătății mintale, iar îngrijirea psihiatrică include, printre altele, diagnosticarea și tratarea tulburărilor psihice.",
    ],
    goToQuestions: "Mergi la întrebări",
    soon: "Vânzarea se deschide în curând.",
    copyrightTitle: "Drepturi de autor și condiții de utilizare",
    copyright:
      "©Iulia Iarkina / Ce nu vezi?, 2026. Toate drepturile rezervate. Materialele acestui produs, inclusiv textele, întrebările, explicațiile autoarei, structura, succesiunea materialelor și prezentarea, sunt obiecte ale dreptului de autor în măsura protejată de legislația Ucrainei.",
    license:
      "Cumpărarea accesului la produs îi oferă cumpărătorului dreptul personal, neexclusiv și netransmisibil de a folosi materialele exclusiv pentru uz personal.",
    forbiddenIntro: "Fără acordul scris prealabil al autoarei, este interzis:",
    forbidden: [
      "să copiezi și să reproduci materialele integral sau parțial;",
      "să le publici în acces liber;",
      "să trimiți sau să transmiți accesul la produs unor terți;",
      "să vinzi, să revinzi sau să distribui materialele;",
      "să folosești întrebările, textele, structura sau alte materiale ale produsului în propriile produse comerciale, cursuri, consultații, publicații sau alte materiale;",
      "să prezinți materialele sau părți din ele drept creația ta proprie.",
    ],
    personal: "Accesul la produs este personal.",
    enforcement:
      "Orice copiere, distribuire sau utilizare comercială ilegală a materialelor poate încălca drepturile autoarei și poate avea consecințele prevăzute de legislația Ucrainei.",
  },
  ru: {
    metaTitle: "Что ты не видишь? — 52 психоаналитических вопроса для самоисследования",
    metaDescription:
      "52 психоаналитических вопроса для самоисследования от психоаналитика Юлии Яркиной: взглянуть на знакомые переживания через желания, страхи, защиты и повторяющиеся сценарии.",
    title: "Что ты не видишь?",
    subtitle: "52 психоаналитических вопроса для самоисследования",
    welcome: "Добро пожаловать!",
    intro: [
      "Это пространство создано для того, чтобы ненадолго остановиться, прислушаться к себе и посмотреть на знакомые переживания с другой стороны.",
      "==Здесь нет тестов, диагнозов и готовых ответов.==",
      "==Есть вопросы.==",
      "Иногда кажется, что мы можем очень хорошо знать, что с нами происходит, но совсем не понимать, почему именно это с нами происходит.",
    ],
    questionsNote: "Попробуй отвечать первым, что приходит в голову.",
    whys: [
      "Почему я снова оказался/оказалась в похожих отношениях?",
      "Почему мне так трудно сказать «нет»?",
      "Почему я чувствую вину, когда выбираю себя?",
      "Почему я откладываю то, чего на самом деле хочу?",
      "Почему я знаю, что нужно делать, но всё равно не могу сделать шаг?",
    ],
    optics:
      "«Что ты не видишь?» предлагает посмотреть на эти переживания через психоаналитическую оптику — через желания, страхи, защиты, внутренние конфликты и повторяющиеся сценарии.",
    noticeTitle: "Но есть важное «но».",
    notice: [
      "Этот продукт НЕ является психологической, психотерапевтической или психиатрической помощью.",
      "Он не является медицинской услугой, психотерапией, диагностикой, лечением или заменой консультации специалиста.",
      "Вопросы и пояснения в этом навигаторе носят исключительно информационный и рефлексивный характер и предназначены для самоисследования.",
      "Они не могут определить причины вашего состояния, поставить диагноз или дать индивидуальную рекомендацию.",
      "Одна и та же проблема может иметь совершенно разное значение для разных людей. Наши переживания связаны с личной историей, опытом, отношениями и контекстом жизни.",
      "Поэтому не воспринимайте предложенные интерпретации как утверждения о себе.",
      "Это лишь возможные направления для размышлений.",
    ],
    help: [
      "Если какой-то вопрос вызывает сильные или длительные переживания — не заставляйте себя продолжать.",
      "Если вы переживаете острое психологическое или психическое состояние, кризис, резкое ухудшение самочувствия, мысли о самоповреждении или суициде или другие состояния, вызывающие беспокойство, не полагайтесь на этот продукт.",
      "Обратитесь за профессиональной помощью к психологу, психотерапевту или психиатру. В неотложной ситуации обратитесь за экстренной помощью.",
      "Психотерапия — отдельная форма профессиональной помощи в сфере психического здоровья, а психиатрическая помощь включает, в частности, диагностику и лечение психических расстройств.",
    ],
    goToQuestions: "Перейти к вопросам",
    soon: "Продажа откроется совсем скоро.",
    copyrightTitle: "Авторские права и условия использования",
    copyright:
      "©Яркина Юлия / Что ты не видишь?, 2026. Все права защищены. Материалы этого продукта, в том числе тексты, вопросы, авторские пояснения, структура, последовательность материалов и оформление, являются объектами авторского права в части, охраняемой законодательством Украины.",
    license:
      "Покупка доступа к продукту даёт покупателю личное, неисключительное и непередаваемое право пользоваться материалами исключительно для собственного личного использования.",
    forbiddenIntro: "Без предварительного письменного согласия автора запрещается:",
    forbidden: [
      "копировать и воспроизводить материалы полностью или частично;",
      "публиковать их в открытом доступе;",
      "пересылать или передавать доступ к продукту третьим лицам;",
      "продавать, перепродавать или распространять материалы;",
      "использовать вопросы, тексты, структуру или другие материалы продукта в собственных коммерческих продуктах, курсах, консультациях, публикациях или других материалах;",
      "выдавать материалы или их части за собственную авторскую разработку.",
    ],
    personal: "Доступ к продукту является персональным.",
    enforcement:
      "Любое незаконное копирование, распространение или коммерческое использование материалов может нарушать права автора и влечь последствия, предусмотренные законодательством Украины.",
  },
};
