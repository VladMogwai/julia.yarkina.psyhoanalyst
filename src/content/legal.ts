import type { Locale } from "@/i18n/config";

/**
 * Legal pages of the "Self-knowledge" section: public offer, refunds and privacy.
 * DRAFTS (2026-09-27), to be checked by a lawyer before sales open. Words in [square brackets] are the
 * sole proprietor's (FOP) details still to be filled in; the same values stand in every language.
 */
export type LegalPage = "offer" | "refund" | "privacy";

export const legalPages: LegalPage[] = ["offer", "refund", "privacy"];

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalText {
  title: string;
  /** Short name for links, e.g. in the footer. */
  linkLabel: string;
  description: string;
  updated: string;
  sections: LegalSection[];
}

/** The seller's details, the same in every language until the FOP data is known. */
const seller = {
  name: "[ПІБ ФОП]",
  code: "[РНОКПП]",
  address: "[адреса реєстрації]",
  phone: "[телефон]",
  email: "hello@yarkina-psy.online",
  site: "yarkina-psy.online",
};

export const legal: Record<Locale, Record<LegalPage, LegalText>> = {
  uk: {
    offer: {
      title: "Публічна оферта",
      linkLabel: "Оферта",
      description: "Умови продажу цифрового продукту «Що ти не бачиш?» на сайті yarkina-psy.online.",
      updated: "Редакція від 27 вересня 2026 року",
      sections: [
        {
          title: "1. Загальні положення",
          paragraphs: [
            `Ця оферта є пропозицією фізичної особи — підприємця ${seller.name}, РНОКПП ${seller.code}, адреса: ${seller.address} (далі — Продавець), укласти договір купівлі-продажу цифрового продукту на умовах, викладених нижче.`,
            "Оферта адресована будь-якій повнолітній дієздатній особі (далі — Покупець). Оплата замовлення означає повне й беззастережне прийняття цих умов (акцепт) і укладення договору.",
          ],
        },
        {
          title: "2. Предмет договору",
          paragraphs: [
            "Продавець надає Покупцю доступ до цифрового продукту «Що ти не бачиш?» — набору психоаналітичних питань для самодослідження (далі — Продукт), а Покупець оплачує його.",
            "Продукт має інформаційний і рефлексивний характер. Він не є психологічною, психотерапевтичною, психіатричною чи медичною допомогою, діагностикою, лікуванням або заміною консультації фахівця.",
          ],
        },
        {
          title: "3. Ціна та оплата",
          paragraphs: [
            "Ціна Продукту вказана на сторінці рубрики «Самопізнання» у гривнях або євро і діє на момент оформлення замовлення.",
            "Оплата здійснюється банківською карткою через платіжний сервіс WayForPay. Дані картки обробляє платіжний сервіс; Продавець їх не отримує і не зберігає.",
          ],
        },
        {
          title: "4. Надання доступу",
          paragraphs: [
            "Доступ відкривається автоматично одразу після підтвердження оплати для електронної пошти, з якою Покупець увійшов на сайт. Доступ безстроковий і діє, поки працює сайт.",
            "Щоб скористатися Продуктом, Покупець входить на сайт за одноразовим кодом, надісланим на ту саму пошту. Покупець сам відповідає за доступ до своєї пошти.",
          ],
        },
        {
          title: "5. Права на Продукт",
          paragraphs: [
            "Продукт є об’єктом авторського права. Покупець отримує невиключне право користуватися ним особисто, для власного самодослідження.",
            "Заборонено копіювати, поширювати, публікувати, продавати, передавати третім особам чи використовувати Продукт у професійній або комерційній діяльності без письмового дозволу Продавця.",
          ],
        },
        {
          title: "6. Повернення коштів",
          paragraphs: ["Умови повернення коштів викладені на сторінці «Повернення коштів», яка є частиною цієї оферти."],
        },
        {
          title: "7. Відповідальність",
          paragraphs: [
            "Покупець самостійно вирішує, як користуватися Продуктом, і самостійно відповідає за свої рішення. Якщо питання викликає сильні або тривалі переживання, варто зупинитися і звернутися по професійну допомогу.",
            "Продавець не відповідає за перерви в роботі сайту з причин, які від нього не залежать, зокрема через збої постачальників послуг чи платіжного сервісу.",
          ],
        },
        {
          title: "8. Персональні дані",
          paragraphs: ["Обробка персональних даних описана в Політиці конфіденційності."],
        },
        {
          title: "9. Вирішення спорів",
          paragraphs: [
            "Спори вирішуються шляхом переговорів, а якщо згоди не досягнуто — відповідно до законодавства України.",
          ],
        },
        {
          title: "10. Реквізити Продавця",
          paragraphs: [
            `ФОП ${seller.name}, РНОКПП ${seller.code}. Адреса: ${seller.address}. Телефон: ${seller.phone}. Пошта: ${seller.email}. Сайт: ${seller.site}.`,
          ],
        },
      ],
    },
    refund: {
      title: "Повернення коштів",
      linkLabel: "Повернення",
      description: "Коли і як можна повернути кошти за цифровий продукт «Що ти не бачиш?».",
      updated: "Редакція від 27 вересня 2026 року",
      sections: [
        {
          title: "Коли кошти повертаються",
          paragraphs: [
            "Продукт — це цифровий контент, доступ до якого відкривається одразу після оплати.",
            "Ви можете попросити повернути кошти протягом 14 днів від оплати, якщо ще не відкривали питання Продукту.",
            "Кошти повертаються також, якщо оплата пройшла, але доступ не відкрився з технічних причин, які ми не змогли усунути, або якщо оплату було списано двічі.",
          ],
        },
        {
          title: "Як попросити повернення",
          paragraphs: [
            `Напишіть на ${seller.email} з тієї пошти, з якою ви купували, і вкажіть номер замовлення або дату оплати.`,
            "Ми відповімо протягом 3 робочих днів. Кошти повертаються на ту саму картку через платіжний сервіс WayForPay; строк зарахування залежить від банку і зазвичай становить до 7 банківських днів.",
          ],
        },
        {
          title: "Після повернення",
          paragraphs: ["Після повернення коштів доступ до Продукту закривається."],
        },
      ],
    },
    privacy: {
      title: "Політика конфіденційності",
      linkLabel: "Конфіденційність",
      description: "Які дані збирає сайт yarkina-psy.online, навіщо і як їх захищено.",
      updated: "Редакція від 27 вересня 2026 року",
      sections: [
        {
          title: "Хто обробляє дані",
          paragraphs: [
            `Власник і розпорядник персональних даних — ФОП ${seller.name}, РНОКПП ${seller.code}. Зв’язатися щодо даних: ${seller.email}.`,
          ],
        },
        {
          title: "Які дані ми збираємо",
          paragraphs: [
            "Адресу електронної пошти — для входу на сайт і надання доступу до покупок.",
            "Дані замовлень: продукт, суму, валюту, дату і статус оплати.",
            "Дані картки ми не отримуємо: їх обробляє платіжний сервіс WayForPay.",
            "Сайт не збирає ваших відповідей на питання: вони залишаються з вами.",
          ],
        },
        {
          title: "Навіщо",
          paragraphs: [
            "Щоб виконати договір: надіслати код для входу, прийняти оплату, відкрити і зберегти доступ до купленого, відповісти на звернення.",
          ],
        },
        {
          title: "Кому ми передаємо дані",
          paragraphs: [
            "Лише сервісам, без яких сайт не працює: Supabase (облікові записи і замовлення), Cloudflare (хостинг сайту), Resend (надсилання листів з кодом), WayForPay (оплата). Кожен з них обробляє дані лише для своєї частини роботи.",
          ],
        },
        {
          title: "Скільки зберігаємо",
          paragraphs: [
            "Поки у вас є доступ до покупок, а дані про оплати — стільки, скільки вимагає законодавство про облік і податки.",
          ],
        },
        {
          title: "Файли cookie і локальне сховище",
          paragraphs: [
            "Сайт зберігає у вашому браузері лише те, що потрібно для входу (сесію). Рекламних і аналітичних cookie ми не використовуємо.",
          ],
        },
        {
          title: "Ваші права",
          paragraphs: [
            `Ви можете дізнатися, які дані про вас зберігаються, виправити їх або попросити видалити, написавши на ${seller.email}. Видалення облікового запису закриває доступ до покупок. Ви також маєте право поскаржитися до Уповноваженого Верховної Ради України з прав людини, а якщо ви в ЄС — до наглядового органу своєї країни.`,
          ],
        },
      ],
    },
  },
  ru: {
    offer: {
      title: "Публичная оферта",
      linkLabel: "Оферта",
      description: "Условия продажи цифрового продукта «Что ты не видишь?» на сайте yarkina-psy.online.",
      updated: "Редакция от 27 сентября 2026 года",
      sections: [
        {
          title: "1. Общие положения",
          paragraphs: [
            `Эта оферта — предложение физического лица — предпринимателя ${seller.name}, РНОКПП ${seller.code}, адрес: ${seller.address} (далее — Продавец), заключить договор купли-продажи цифрового продукта на условиях, изложенных ниже.`,
            "Оферта адресована любому совершеннолетнему дееспособному лицу (далее — Покупатель). Оплата заказа означает полное и безоговорочное принятие этих условий (акцепт) и заключение договора.",
          ],
        },
        {
          title: "2. Предмет договора",
          paragraphs: [
            "Продавец предоставляет Покупателю доступ к цифровому продукту «Что ты не видишь?» — набору психоаналитических вопросов для самоисследования (далее — Продукт), а Покупатель его оплачивает.",
            "Продукт носит информационный и рефлексивный характер. Он не является психологической, психотерапевтической, психиатрической или медицинской помощью, диагностикой, лечением или заменой консультации специалиста.",
          ],
        },
        {
          title: "3. Цена и оплата",
          paragraphs: [
            "Цена Продукта указана на странице рубрики «Самопознание» в гривнах или евро и действует на момент оформления заказа.",
            "Оплата производится банковской картой через платёжный сервис WayForPay. Данные карты обрабатывает платёжный сервис; Продавец их не получает и не хранит.",
          ],
        },
        {
          title: "4. Предоставление доступа",
          paragraphs: [
            "Доступ открывается автоматически сразу после подтверждения оплаты для электронной почты, с которой Покупатель вошёл на сайт. Доступ бессрочный и действует, пока работает сайт.",
            "Чтобы пользоваться Продуктом, Покупатель входит на сайт по одноразовому коду, отправленному на ту же почту. Покупатель сам отвечает за доступ к своей почте.",
          ],
        },
        {
          title: "5. Права на Продукт",
          paragraphs: [
            "Продукт является объектом авторского права. Покупатель получает неисключительное право пользоваться им лично, для собственного самоисследования.",
            "Запрещено копировать, распространять, публиковать, продавать, передавать третьим лицам или использовать Продукт в профессиональной или коммерческой деятельности без письменного разрешения Продавца.",
          ],
        },
        {
          title: "6. Возврат средств",
          paragraphs: ["Условия возврата средств изложены на странице «Возврат средств», которая является частью этой оферты."],
        },
        {
          title: "7. Ответственность",
          paragraphs: [
            "Покупатель сам решает, как пользоваться Продуктом, и сам отвечает за свои решения. Если вопрос вызывает сильные или длительные переживания, стоит остановиться и обратиться за профессиональной помощью.",
            "Продавец не отвечает за перерывы в работе сайта по независящим от него причинам, в том числе из-за сбоев поставщиков услуг или платёжного сервиса.",
          ],
        },
        {
          title: "8. Персональные данные",
          paragraphs: ["Обработка персональных данных описана в Политике конфиденциальности."],
        },
        {
          title: "9. Разрешение споров",
          paragraphs: ["Споры решаются путём переговоров, а если согласие не достигнуто — в соответствии с законодательством Украины."],
        },
        {
          title: "10. Реквизиты Продавца",
          paragraphs: [
            `ФЛП ${seller.name}, РНОКПП ${seller.code}. Адрес: ${seller.address}. Телефон: ${seller.phone}. Почта: ${seller.email}. Сайт: ${seller.site}.`,
          ],
        },
      ],
    },
    refund: {
      title: "Возврат средств",
      linkLabel: "Возврат",
      description: "Когда и как можно вернуть средства за цифровой продукт «Что ты не видишь?».",
      updated: "Редакция от 27 сентября 2026 года",
      sections: [
        {
          title: "Когда средства возвращаются",
          paragraphs: [
            "Продукт — это цифровой контент, доступ к которому открывается сразу после оплаты.",
            "Вы можете попросить вернуть средства в течение 14 дней с момента оплаты, если ещё не открывали вопросы Продукта.",
            "Средства возвращаются также, если оплата прошла, но доступ не открылся по техническим причинам, которые мы не смогли устранить, или если оплата была списана дважды.",
          ],
        },
        {
          title: "Как попросить возврат",
          paragraphs: [
            `Напишите на ${seller.email} с той почты, с которой вы покупали, и укажите номер заказа или дату оплаты.`,
            "Мы ответим в течение 3 рабочих дней. Средства возвращаются на ту же карту через платёжный сервис WayForPay; срок зачисления зависит от банка и обычно составляет до 7 банковских дней.",
          ],
        },
        {
          title: "После возврата",
          paragraphs: ["После возврата средств доступ к Продукту закрывается."],
        },
      ],
    },
    privacy: {
      title: "Политика конфиденциальности",
      linkLabel: "Конфиденциальность",
      description: "Какие данные собирает сайт yarkina-psy.online, зачем и как они защищены.",
      updated: "Редакция от 27 сентября 2026 года",
      sections: [
        {
          title: "Кто обрабатывает данные",
          paragraphs: [
            `Владелец и распорядитель персональных данных — ФЛП ${seller.name}, РНОКПП ${seller.code}. Связаться по вопросам данных: ${seller.email}.`,
          ],
        },
        {
          title: "Какие данные мы собираем",
          paragraphs: [
            "Адрес электронной почты — для входа на сайт и предоставления доступа к покупкам.",
            "Данные заказов: продукт, сумму, валюту, дату и статус оплаты.",
            "Данные карты мы не получаем: их обрабатывает платёжный сервис WayForPay.",
            "Сайт не собирает ваших ответов на вопросы: они остаются с вами.",
          ],
        },
        {
          title: "Зачем",
          paragraphs: [
            "Чтобы исполнить договор: отправить код для входа, принять оплату, открыть и сохранить доступ к купленному, ответить на обращения.",
          ],
        },
        {
          title: "Кому мы передаём данные",
          paragraphs: [
            "Только сервисам, без которых сайт не работает: Supabase (учётные записи и заказы), Cloudflare (хостинг сайта), Resend (отправка писем с кодом), WayForPay (оплата). Каждый из них обрабатывает данные только для своей части работы.",
          ],
        },
        {
          title: "Сколько храним",
          paragraphs: [
            "Пока у вас есть доступ к покупкам, а данные об оплатах — столько, сколько требует законодательство об учёте и налогах.",
          ],
        },
        {
          title: "Файлы cookie и локальное хранилище",
          paragraphs: [
            "Сайт хранит в вашем браузере только то, что нужно для входа (сессию). Рекламных и аналитических cookie мы не используем.",
          ],
        },
        {
          title: "Ваши права",
          paragraphs: [
            `Вы можете узнать, какие данные о вас хранятся, исправить их или попросить удалить, написав на ${seller.email}. Удаление учётной записи закрывает доступ к покупкам. Вы также вправе подать жалобу Уполномоченному Верховной Рады Украины по правам человека, а если вы в ЕС — надзорному органу своей страны.`,
          ],
        },
      ],
    },
  },
  en: {
    offer: {
      title: "Public offer",
      linkLabel: "Offer",
      description: "Terms of sale of the digital product “What don’t you see?” on yarkina-psy.online.",
      updated: "Version of 27 September 2026",
      sections: [
        {
          title: "1. General provisions",
          paragraphs: [
            `This offer is a proposal by the sole proprietor ${seller.name}, tax number ${seller.code}, address: ${seller.address} (the Seller), to conclude a contract for the sale of a digital product on the terms below.`,
            "The offer is addressed to any adult with full legal capacity (the Buyer). Paying for an order means full and unconditional acceptance of these terms and concludes the contract.",
          ],
        },
        {
          title: "2. Subject of the contract",
          paragraphs: [
            "The Seller gives the Buyer access to the digital product “What don’t you see?”, a set of psychoanalytic questions for self-exploration (the Product), and the Buyer pays for it.",
            "The Product is informational and reflective. It is not psychological, psychotherapeutic, psychiatric or medical help, diagnosis, treatment or a substitute for a consultation with a professional.",
          ],
        },
        {
          title: "3. Price and payment",
          paragraphs: [
            "The price of the Product is shown on the “Self-knowledge” page in hryvnias or euros and applies at the moment of ordering.",
            "Payment is made by bank card through the WayForPay payment service. Card details are handled by the payment service; the Seller neither receives nor stores them.",
          ],
        },
        {
          title: "4. Access",
          paragraphs: [
            "Access opens automatically as soon as payment is confirmed, for the email the Buyer signed in with. Access has no time limit and lasts for as long as the site runs.",
            "To use the Product, the Buyer signs in with a one-time code sent to that same email. The Buyer is responsible for access to their own email.",
          ],
        },
        {
          title: "5. Rights to the Product",
          paragraphs: [
            "The Product is protected by copyright. The Buyer receives a non-exclusive right to use it personally, for their own self-exploration.",
            "Copying, distributing, publishing, selling, passing the Product to third parties or using it in professional or commercial activity without the Seller’s written permission is prohibited.",
          ],
        },
        {
          title: "6. Refunds",
          paragraphs: ["Refunds are governed by the “Refunds” page, which is part of this offer."],
        },
        {
          title: "7. Liability",
          paragraphs: [
            "The Buyer decides how to use the Product and is responsible for their own decisions. If a question stirs up strong or lasting feelings, it is worth stopping and seeking professional help.",
            "The Seller is not liable for interruptions of the site for reasons beyond their control, including failures of service providers or the payment service.",
          ],
        },
        {
          title: "8. Personal data",
          paragraphs: ["The processing of personal data is described in the Privacy policy."],
        },
        {
          title: "9. Disputes",
          paragraphs: ["Disputes are settled by negotiation and, failing agreement, under the law of Ukraine."],
        },
        {
          title: "10. Seller’s details",
          paragraphs: [
            `Sole proprietor ${seller.name}, tax number ${seller.code}. Address: ${seller.address}. Phone: ${seller.phone}. Email: ${seller.email}. Website: ${seller.site}.`,
          ],
        },
      ],
    },
    refund: {
      title: "Refunds",
      linkLabel: "Refunds",
      description: "When and how you can get a refund for the digital product “What don’t you see?”.",
      updated: "Version of 27 September 2026",
      sections: [
        {
          title: "When you get a refund",
          paragraphs: [
            "The Product is digital content that opens right after payment.",
            "You can ask for a refund within 14 days of payment if you have not yet opened the Product’s questions.",
            "You also get a refund if payment went through but access did not open for technical reasons we could not fix, or if you were charged twice.",
          ],
        },
        {
          title: "How to ask for a refund",
          paragraphs: [
            `Write to ${seller.email} from the email you bought with, and give the order number or the date of payment.`,
            "We reply within 3 working days. The money goes back to the same card through WayForPay; how long it takes depends on the bank, usually up to 7 banking days.",
          ],
        },
        {
          title: "After a refund",
          paragraphs: ["After a refund, access to the Product is closed."],
        },
      ],
    },
    privacy: {
      title: "Privacy policy",
      linkLabel: "Privacy",
      description: "What data yarkina-psy.online collects, why, and how it is protected.",
      updated: "Version of 27 September 2026",
      sections: [
        {
          title: "Who processes the data",
          paragraphs: [
            `The controller of personal data is the sole proprietor ${seller.name}, tax number ${seller.code}. Contact about data: ${seller.email}.`,
          ],
        },
        {
          title: "What we collect",
          paragraphs: [
            "Your email address, to sign you in and give you access to your purchases.",
            "Order data: product, amount, currency, date and payment status.",
            "We do not receive card details: they are handled by the WayForPay payment service.",
            "The site does not collect your answers to the questions: they stay with you.",
          ],
        },
        {
          title: "Why",
          paragraphs: [
            "To perform the contract: send the sign-in code, take payment, open and keep access to what you bought, and answer your requests.",
          ],
        },
        {
          title: "Who we share data with",
          paragraphs: [
            "Only the services the site cannot work without: Supabase (accounts and orders), Cloudflare (hosting), Resend (sending the code emails), WayForPay (payment). Each processes data only for its own part of the work.",
          ],
        },
        {
          title: "How long we keep it",
          paragraphs: [
            "For as long as you have access to your purchases; payment records for as long as accounting and tax law requires.",
          ],
        },
        {
          title: "Cookies and local storage",
          paragraphs: [
            "The site keeps in your browser only what is needed to stay signed in (the session). We use no advertising or analytics cookies.",
          ],
        },
        {
          title: "Your rights",
          paragraphs: [
            `You can find out what data about you is kept, correct it or ask for it to be deleted by writing to ${seller.email}. Deleting your account closes access to your purchases. You also have the right to complain to the Ukrainian Parliament Commissioner for Human Rights or, in the EU, to the supervisory authority of your country.`,
          ],
        },
      ],
    },
  },
  fr: {
    offer: {
      title: "Offre publique",
      linkLabel: "Offre",
      description: "Conditions de vente du produit numérique « Que ne vois-tu pas ? » sur yarkina-psy.online.",
      updated: "Version du 27 septembre 2026",
      sections: [
        {
          title: "1. Dispositions générales",
          paragraphs: [
            `La présente offre est une proposition de l’entrepreneur individuel ${seller.name}, numéro fiscal ${seller.code}, adresse : ${seller.address} (le Vendeur), de conclure un contrat de vente d’un produit numérique aux conditions ci-dessous.`,
            "L’offre s’adresse à toute personne majeure et juridiquement capable (l’Acheteur). Le paiement d’une commande vaut acceptation pleine et sans réserve des présentes conditions et conclusion du contrat.",
          ],
        },
        {
          title: "2. Objet du contrat",
          paragraphs: [
            "Le Vendeur donne à l’Acheteur accès au produit numérique « Que ne vois-tu pas ? », un ensemble de questions psychanalytiques pour l’exploration de soi (le Produit), et l’Acheteur le paie.",
            "Le Produit a un caractère informatif et réflexif. Il ne constitue ni une aide psychologique, psychothérapeutique, psychiatrique ou médicale, ni un diagnostic, ni un traitement, ni un substitut à la consultation d’un professionnel.",
          ],
        },
        {
          title: "3. Prix et paiement",
          paragraphs: [
            "Le prix du Produit est indiqué sur la page « Connaissance de soi » en hryvnias ou en euros et s’applique au moment de la commande.",
            "Le paiement s’effectue par carte bancaire via le service de paiement WayForPay. Les données de la carte sont traitées par le service de paiement ; le Vendeur ne les reçoit ni ne les conserve.",
          ],
        },
        {
          title: "4. Accès",
          paragraphs: [
            "L’accès s’ouvre automatiquement dès la confirmation du paiement, pour l’adresse e-mail avec laquelle l’Acheteur s’est connecté. L’accès est sans limite de durée et vaut tant que le site fonctionne.",
            "Pour utiliser le Produit, l’Acheteur se connecte avec un code à usage unique envoyé à cette même adresse. L’Acheteur est responsable de l’accès à sa messagerie.",
          ],
        },
        {
          title: "5. Droits sur le Produit",
          paragraphs: [
            "Le Produit est protégé par le droit d’auteur. L’Acheteur reçoit un droit non exclusif de l’utiliser personnellement, pour sa propre exploration de soi.",
            "Il est interdit de copier, diffuser, publier, vendre, transmettre à des tiers ou utiliser le Produit dans une activité professionnelle ou commerciale sans l’autorisation écrite du Vendeur.",
          ],
        },
        {
          title: "6. Remboursement",
          paragraphs: ["Les conditions de remboursement figurent sur la page « Remboursement », qui fait partie de la présente offre."],
        },
        {
          title: "7. Responsabilité",
          paragraphs: [
            "L’Acheteur décide lui-même de l’usage du Produit et répond de ses propres décisions. Si une question suscite des émotions fortes ou durables, il est préférable de s’arrêter et de demander une aide professionnelle.",
            "Le Vendeur n’est pas responsable des interruptions du site pour des raisons indépendantes de sa volonté, notamment les pannes des prestataires ou du service de paiement.",
          ],
        },
        {
          title: "8. Données personnelles",
          paragraphs: ["Le traitement des données personnelles est décrit dans la Politique de confidentialité."],
        },
        {
          title: "9. Litiges",
          paragraphs: ["Les litiges sont réglés à l’amiable et, à défaut d’accord, conformément au droit ukrainien."],
        },
        {
          title: "10. Coordonnées du Vendeur",
          paragraphs: [
            `Entrepreneur individuel ${seller.name}, numéro fiscal ${seller.code}. Adresse : ${seller.address}. Téléphone : ${seller.phone}. E-mail : ${seller.email}. Site : ${seller.site}.`,
          ],
        },
      ],
    },
    refund: {
      title: "Remboursement",
      linkLabel: "Remboursement",
      description: "Quand et comment obtenir un remboursement du produit numérique « Que ne vois-tu pas ? ».",
      updated: "Version du 27 septembre 2026",
      sections: [
        {
          title: "Quand le remboursement est possible",
          paragraphs: [
            "Le Produit est un contenu numérique qui s’ouvre dès le paiement.",
            "Vous pouvez demander un remboursement dans les 14 jours suivant le paiement si vous n’avez pas encore ouvert les questions du Produit.",
            "Vous êtes également remboursé si le paiement est passé mais que l’accès ne s’est pas ouvert pour des raisons techniques que nous n’avons pas pu résoudre, ou si vous avez été débité deux fois.",
          ],
        },
        {
          title: "Comment demander un remboursement",
          paragraphs: [
            `Écrivez à ${seller.email} depuis l’adresse utilisée pour l’achat, en indiquant le numéro de commande ou la date du paiement.`,
            "Nous répondons sous 3 jours ouvrés. L’argent est reversé sur la même carte via WayForPay ; le délai dépend de la banque, en général jusqu’à 7 jours bancaires.",
          ],
        },
        {
          title: "Après le remboursement",
          paragraphs: ["Après le remboursement, l’accès au Produit est fermé."],
        },
      ],
    },
    privacy: {
      title: "Politique de confidentialité",
      linkLabel: "Confidentialité",
      description: "Quelles données le site yarkina-psy.online collecte, pourquoi et comment elles sont protégées.",
      updated: "Version du 27 septembre 2026",
      sections: [
        {
          title: "Qui traite les données",
          paragraphs: [
            `Le responsable du traitement est l’entrepreneur individuel ${seller.name}, numéro fiscal ${seller.code}. Contact pour les données : ${seller.email}.`,
          ],
        },
        {
          title: "Ce que nous collectons",
          paragraphs: [
            "Votre adresse e-mail, pour vous connecter et vous donner accès à vos achats.",
            "Les données de commande : produit, montant, devise, date et statut du paiement.",
            "Nous ne recevons pas les données de carte : elles sont traitées par le service de paiement WayForPay.",
            "Le site ne collecte pas vos réponses aux questions : elles restent avec vous.",
          ],
        },
        {
          title: "Pourquoi",
          paragraphs: [
            "Pour exécuter le contrat : envoyer le code de connexion, encaisser le paiement, ouvrir et conserver l’accès à ce que vous avez acheté, répondre à vos demandes.",
          ],
        },
        {
          title: "Avec qui nous partageons les données",
          paragraphs: [
            "Uniquement avec les services sans lesquels le site ne fonctionne pas : Supabase (comptes et commandes), Cloudflare (hébergement), Resend (envoi des e-mails de code), WayForPay (paiement). Chacun ne traite les données que pour sa part du travail.",
          ],
        },
        {
          title: "Durée de conservation",
          paragraphs: [
            "Tant que vous avez accès à vos achats ; les données de paiement aussi longtemps que l’exige la loi comptable et fiscale.",
          ],
        },
        {
          title: "Cookies et stockage local",
          paragraphs: [
            "Le site ne garde dans votre navigateur que ce qui est nécessaire pour rester connecté (la session). Nous n’utilisons aucun cookie publicitaire ni d’analyse.",
          ],
        },
        {
          title: "Vos droits",
          paragraphs: [
            `Vous pouvez savoir quelles données vous concernant sont conservées, les corriger ou demander leur suppression en écrivant à ${seller.email}. La suppression du compte ferme l’accès aux achats. Vous pouvez aussi déposer une plainte auprès du Commissaire aux droits de l’homme du Parlement ukrainien ou, dans l’UE, auprès de l’autorité de contrôle de votre pays (en France, la CNIL).`,
          ],
        },
      ],
    },
  },
  ro: {
    offer: {
      title: "Ofertă publică",
      linkLabel: "Ofertă",
      description: "Condițiile de vânzare a produsului digital „Ce nu vezi?” pe yarkina-psy.online.",
      updated: "Versiunea din 27 septembrie 2026",
      sections: [
        {
          title: "1. Dispoziții generale",
          paragraphs: [
            `Această ofertă este propunerea persoanei fizice-antreprenor ${seller.name}, cod fiscal ${seller.code}, adresa: ${seller.address} (Vânzătorul), de a încheia un contract de vânzare a unui produs digital în condițiile de mai jos.`,
            "Oferta se adresează oricărei persoane majore, cu capacitate deplină de exercițiu (Cumpărătorul). Plata comenzii înseamnă acceptarea deplină și necondiționată a acestor condiții și încheierea contractului.",
          ],
        },
        {
          title: "2. Obiectul contractului",
          paragraphs: [
            "Vânzătorul oferă Cumpărătorului acces la produsul digital „Ce nu vezi?”, un set de întrebări psihanalitice pentru autocunoaștere (Produsul), iar Cumpărătorul îl plătește.",
            "Produsul are caracter informativ și reflexiv. Nu reprezintă ajutor psihologic, psihoterapeutic, psihiatric sau medical, diagnostic, tratament și nu înlocuiește consultația unui specialist.",
          ],
        },
        {
          title: "3. Preț și plată",
          paragraphs: [
            "Prețul Produsului este afișat pe pagina „Cunoaștere de sine”, în grivne sau euro, și se aplică la momentul comenzii.",
            "Plata se face cu cardul bancar prin serviciul de plată WayForPay. Datele cardului sunt prelucrate de serviciul de plată; Vânzătorul nu le primește și nu le păstrează.",
          ],
        },
        {
          title: "4. Acces",
          paragraphs: [
            "Accesul se deschide automat imediat după confirmarea plății, pentru adresa de e-mail cu care Cumpărătorul s-a conectat. Accesul nu are limită de timp și durează cât timp funcționează site-ul.",
            "Pentru a folosi Produsul, Cumpărătorul se conectează cu un cod unic trimis pe aceeași adresă. Cumpărătorul răspunde de accesul la propriul e-mail.",
          ],
        },
        {
          title: "5. Drepturi asupra Produsului",
          paragraphs: [
            "Produsul este protejat de dreptul de autor. Cumpărătorul primește dreptul neexclusiv de a-l folosi personal, pentru propria autocunoaștere.",
            "Este interzisă copierea, distribuirea, publicarea, vânzarea, transmiterea către terți sau folosirea Produsului în activitate profesională ori comercială fără acordul scris al Vânzătorului.",
          ],
        },
        {
          title: "6. Rambursare",
          paragraphs: ["Condițiile de rambursare sunt descrise pe pagina „Rambursare”, care face parte din această ofertă."],
        },
        {
          title: "7. Răspundere",
          paragraphs: [
            "Cumpărătorul decide singur cum folosește Produsul și răspunde de propriile decizii. Dacă o întrebare stârnește trăiri puternice sau de durată, e bine să te oprești și să cauți ajutor de specialitate.",
            "Vânzătorul nu răspunde pentru întreruperile site-ului din motive independente de voința sa, inclusiv defecțiuni ale furnizorilor de servicii sau ale serviciului de plată.",
          ],
        },
        {
          title: "8. Date personale",
          paragraphs: ["Prelucrarea datelor personale este descrisă în Politica de confidențialitate."],
        },
        {
          title: "9. Litigii",
          paragraphs: ["Litigiile se soluționează pe cale amiabilă, iar în lipsa unui acord, potrivit legislației Ucrainei."],
        },
        {
          title: "10. Datele Vânzătorului",
          paragraphs: [
            `Persoană fizică-antreprenor ${seller.name}, cod fiscal ${seller.code}. Adresa: ${seller.address}. Telefon: ${seller.phone}. E-mail: ${seller.email}. Site: ${seller.site}.`,
          ],
        },
      ],
    },
    refund: {
      title: "Rambursare",
      linkLabel: "Rambursare",
      description: "Când și cum poți primi banii înapoi pentru produsul digital „Ce nu vezi?”.",
      updated: "Versiunea din 27 septembrie 2026",
      sections: [
        {
          title: "Când se rambursează banii",
          paragraphs: [
            "Produsul este conținut digital care se deschide imediat după plată.",
            "Poți cere rambursarea în 14 zile de la plată, dacă nu ai deschis încă întrebările Produsului.",
            "Banii se rambursează și dacă plata a trecut, dar accesul nu s-a deschis din motive tehnice pe care nu le-am putut rezolva, sau dacă suma a fost retrasă de două ori.",
          ],
        },
        {
          title: "Cum ceri rambursarea",
          paragraphs: [
            `Scrie la ${seller.email} de pe adresa cu care ai cumpărat și indică numărul comenzii sau data plății.`,
            "Răspundem în 3 zile lucrătoare. Banii revin pe același card prin WayForPay; termenul depinde de bancă, de obicei până la 7 zile bancare.",
          ],
        },
        {
          title: "După rambursare",
          paragraphs: ["După rambursare, accesul la Produs se închide."],
        },
      ],
    },
    privacy: {
      title: "Politica de confidențialitate",
      linkLabel: "Confidențialitate",
      description: "Ce date colectează site-ul yarkina-psy.online, de ce și cum sunt protejate.",
      updated: "Versiunea din 27 septembrie 2026",
      sections: [
        {
          title: "Cine prelucrează datele",
          paragraphs: [
            `Operatorul datelor personale este persoana fizică-antreprenor ${seller.name}, cod fiscal ${seller.code}. Contact pentru date: ${seller.email}.`,
          ],
        },
        {
          title: "Ce colectăm",
          paragraphs: [
            "Adresa de e-mail, pentru conectare și pentru accesul la cumpărături.",
            "Datele comenzilor: produsul, suma, moneda, data și starea plății.",
            "Nu primim datele cardului: le prelucrează serviciul de plată WayForPay.",
            "Site-ul nu colectează răspunsurile tale la întrebări: ele rămân la tine.",
          ],
        },
        {
          title: "De ce",
          paragraphs: [
            "Pentru a executa contractul: a trimite codul de conectare, a încasa plata, a deschide și păstra accesul la ce ai cumpărat, a răspunde la solicitări.",
          ],
        },
        {
          title: "Cui transmitem datele",
          paragraphs: [
            "Doar serviciilor fără de care site-ul nu funcționează: Supabase (conturi și comenzi), Cloudflare (găzduire), Resend (trimiterea e-mailurilor cu cod), WayForPay (plată). Fiecare prelucrează datele doar pentru partea sa de lucru.",
          ],
        },
        {
          title: "Cât timp le păstrăm",
          paragraphs: [
            "Cât timp ai acces la cumpărături; datele plăților, cât cere legislația contabilă și fiscală.",
          ],
        },
        {
          title: "Cookie-uri și stocare locală",
          paragraphs: [
            "Site-ul păstrează în browserul tău doar ce e necesar pentru a rămâne conectat (sesiunea). Nu folosim cookie-uri de publicitate sau de analiză.",
          ],
        },
        {
          title: "Drepturile tale",
          paragraphs: [
            `Poți afla ce date despre tine sunt păstrate, le poți corecta sau cere ștergerea lor scriind la ${seller.email}. Ștergerea contului închide accesul la cumpărături. Ai și dreptul de a depune o plângere la Comisarul pentru drepturile omului al Parlamentului Ucrainei sau, în UE, la autoritatea de supraveghere din țara ta (în România, ANSPDCP).`,
          ],
        },
      ],
    },
  },
};
