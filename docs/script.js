(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.nav-links');
  const progress = document.querySelector('.progress span');
  const reveals = document.querySelectorAll('.reveal');
  const themeToggle = document.querySelector('.theme-toggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const compactNav = window.matchMedia('(max-width: 920px)');

  /* ---------------- Dictionnaire Multilingue (FR, EN, ES, ZH) ---------------- */
  const translations = {
    fr: {
      nav_how: "Comment ça marche",
      nav_custom: "Personnaliser le prompt",
      nav_privacy: "Confidentialité",
      nav_install: "Ajouter à Firefox ↗",
      nav_home: "Accueil",
      hero_pill: "Disponible sur Firefox Add-ons ↗",
      hero_title: "Une vidéo YouTube.<br><em>Un clic.</em> Votre résumé.",
      hero_text: "L’extension ajoute un bouton <strong>Résumer</strong> natif directement dans YouTube. Au clic, elle ouvre Gemini avec le lien de la vidéo et <strong>votre prompt 100% personnalisable</strong>.",
      hero_cta_add: "Ajouter à Firefox",
      hero_cta_demo: "Voir la démo en direct ↓",
      hero_cta_custom: "Personnaliser son prompt →",
      demo_tab_watch: "Page Vidéo",
      demo_tab_feed: "Accueil YouTube",
      how_title: "YouTube → Résumer → Gemini.",
      how_subtitle: "Un flux direct, sans copier-coller ni perte de temps.",
      how_step1_title: "1. Choisissez votre vidéo",
      how_step1_desc: "Sur YouTube, ouvrez une vidéo ou parcourez votre fil d’accueil, vos abonnements et vos recommandations.",
      how_step2_title: "2. Cliquez sur Résumer",
      how_step2_desc: "Un bouton natif est ajouté sous le lecteur YouTube et en tête du menu contextuel (trois points) de chaque vidéo.",
      how_step3_title: "3. Gemini prend le relais",
      how_step3_desc: "Gemini s’ouvre dans un nouvel onglet avec votre consigne personnalisée et le lien de la vidéo, prêt pour l’analyse.",
      studio_kicker: "Liberté totale",
      studio_title_section: "Votre prompt, personnalisé par vous-même.",
      studio_lead: "Contrairement à d’autres extensions figées, vous avez le <strong>contrôle absolu sur la consigne envoyée à Gemini</strong>. Modifiez-la librement dans les options selon vos besoins : résumé rapide, plan d’action, vulgarisation ou analyse détaillée.",
      studio_test_title: "✦ Testez vos consignes en direct",
      preset_classic: "Résumé classique",
      preset_points: "5 idées clés",
      preset_plan: "Plan détaillé",
      preset_simple: "Vulgarisation",
      preset_link: "Lien seul",
      studio_input_label: "Texte configuré dans les options de l’extension :",
      studio_hint: "L'URL YouTube de la vidéo est ajoutée automatiquement à la fin de votre texte.",
      studio_preview_badge: "Aperçu envoyé à Gemini",
      privacy_card_title: "Pas de collecte. Pas de serveur intermédiaire.",
      privacy_card_desc: "Votre prompt est stocké <strong>uniquement en local dans votre navigateur Firefox</strong>. L'extension n'a aucun serveur, aucune télémétrie et ne conserve aucun historique.",
      privacy_card_link: "Lire la politique de confidentialité →",
      install_title: "Ajoutez Résumer à YouTube.",
      install_desc: "Gratuit, léger et open source. Installez en un clic sur Firefox.",
      install_btn: "Ajouter à Firefox ↗",
      install_source: "Voir le code source",
      footer_brand: "Résumé YouTube par Gemini",
      footer_legal: "Projet indépendant — non affilié à YouTube, Google ou Mozilla.",
      privacy_kicker: "Transparence",
      privacy_title: "Politique de confidentialité",
      privacy_subtitle: "L’extension ne collecte aucune donnée pour le compte du développeur.",
      privacy_summary_label: "En bref",
      privacy_summary_text: "Rien n’est envoyé sans votre clic sur <b>Résumer</b>. L’extension ne possède aucun serveur de collecte, aucun système de télémétrie et aucun compte utilisateur.",
      presets: {
        classic: { prompt: "Résume-moi la vidéo :" },
        points: { prompt: "Donne-moi les 5 idées clés et les points d'action de cette vidéo :" },
        plan: { prompt: "Rédige un plan complet et structuré avec chapitres de cette vidéo :" },
        simple: { prompt: "Explique les notions principales de cette vidéo en termes simples :" },
        link: { prompt: "" }
      },
      demo: {
        yt_search: "Rechercher",
        yt_title: "Comprendre un sujet complexe en moins de 15 minutes",
        yt_channel: "Exemple",
        yt_subs: "128 k abonnés",
        yt_subscribe: "S’abonner",
        yt_share: "Partager",
        yt_btn: "Résumer",
        yt_views: "84 k vues · il y a 2 jours",
        card1_title: "Comprendre un sujet complexe en moins de 15 minutes",
        card1_meta: "Exemple · 84 k vues · il y a 2 jours",
        card2_title: "Les 5 idées clés pour progresser plus vite",
        card2_meta: "Apprendre · 42 k vues · il y a 3 jours",
        card3_title: "Méthode simple pour retenir l'essentiel",
        card3_meta: "Méthode · 63 k vues · il y a 5 jours",
        menu_queue: "Ajouter à la file d'attente",
        menu_save: "Enregistrer pour plus tard",
        menu_share: "Partager",
        gemini_new_chat: "Nouveau chat",
        gemini_recent: "Récents",
        gemini_prompt: "Résume-moi la vidéo :",
        gemini_placeholder: "Demandez à Gemini...",
        gemini_thinking: "Analyse de la vidéo YouTube...",
        resp_title: "Résumé de la vidéo",
        resp_intro: "Voici les points clés à retenir de la présentation :",
        p1_title: "Concepts fondamentaux :",
        p1_text: "se concentrer sur les piliers essentiels pour assimiler rapidement le sujet.",
        p2_title: "Mise en pratique :",
        p2_text: "connecter les idées nouvelles à des cas réels plutôt que les mémoriser isolément.",
        p3_title: "Synthèse :",
        p3_text: "retenir les 3 enseignements majeurs pour gagner un temps précieux."
      }
    },
    en: {
      nav_how: "How it works",
      nav_custom: "Custom Prompt",
      nav_privacy: "Privacy",
      nav_install: "Add to Firefox ↗",
      nav_home: "Home",
      hero_pill: "Available on Firefox Add-ons ↗",
      hero_title: "A YouTube video.<br><em>One click.</em> Your summary.",
      hero_text: "The extension adds a native <strong>Summarize</strong> button directly in YouTube. Click it to open Gemini with the video link and <strong>your 100% customizable prompt</strong>.",
      hero_cta_add: "Add to Firefox",
      hero_cta_demo: "Watch live demo ↓",
      hero_cta_custom: "Customize prompt →",
      demo_tab_watch: "Watch Page",
      demo_tab_feed: "YouTube Feed",
      how_title: "YouTube → Summarize → Gemini.",
      how_subtitle: "A seamless flow, no copy-pasting, no wasted time.",
      how_step1_title: "1. Pick your video",
      how_step1_desc: "On YouTube, open any video or browse your home feed, subscriptions, and recommendations.",
      how_step2_title: "2. Click Summarize",
      how_step2_desc: "A native button is seamlessly placed below the player and at the top of the three-dots menu on every card.",
      how_step3_title: "3. Gemini takes over",
      how_step3_desc: "Gemini opens in a new tab with your custom prompt and the video link, ready for immediate analysis.",
      studio_kicker: "Total Freedom",
      studio_title_section: "Your prompt, tailored by yourself.",
      studio_lead: "Unlike rigid extensions, you have <strong>absolute control over the prompt sent to Gemini</strong>. Customize it anytime in the options for your workflow: quick summary, action plan, simplified explanation, or in-depth analysis.",
      studio_test_title: "✦ Test your prompts live",
      preset_classic: "Standard Summary",
      preset_points: "5 Key Takeaways",
      preset_plan: "Structured Outline",
      preset_simple: "ELI5 / Simple",
      preset_link: "Link only",
      studio_input_label: "Prompt configured in extension options:",
      studio_hint: "The video YouTube URL is automatically appended to the end of your text.",
      studio_preview_badge: "Preview sent to Gemini",
      privacy_card_title: "No tracking. No intermediate servers.",
      privacy_card_desc: "Your prompt is stored <strong>exclusively locally inside your Firefox browser</strong>. The extension operates without servers, telemetry, or saved history.",
      privacy_card_link: "Read the privacy policy →",
      install_title: "Add Summarize to YouTube.",
      install_desc: "Free, lightweight, and open source. Install in one click on Firefox.",
      install_btn: "Add to Firefox ↗",
      install_source: "View source code",
      footer_brand: "YouTube Summarizer by Gemini",
      footer_legal: "Independent project — not affiliated with YouTube, Google, or Mozilla.",
      privacy_kicker: "Transparency",
      privacy_title: "Privacy Policy",
      privacy_subtitle: "The extension does not collect any user data for the developer.",
      privacy_summary_label: "In brief",
      privacy_summary_text: "Nothing is sent without your explicit click on <b>Summarize</b>. The extension has no backend servers, no telemetry, and requires no user accounts.",
      presets: {
        classic: { prompt: "Summarize this video:" },
        points: { prompt: "Give me the 5 key ideas and action points from this video:" },
        plan: { prompt: "Create a complete and structured outline with chapters for this video:" },
        simple: { prompt: "Explain the main concepts of this video in simple terms:" },
        link: { prompt: "" }
      },
      demo: {
        yt_search: "Search",
        yt_title: "Mastering complex topics in under 15 minutes",
        yt_channel: "Example",
        yt_subs: "128K subscribers",
        yt_subscribe: "Subscribe",
        yt_share: "Share",
        yt_btn: "Summarize",
        yt_views: "84K views · 2 days ago",
        card1_title: "Mastering complex topics in under 15 minutes",
        card1_meta: "Example · 84K views · 2 days ago",
        card2_title: "5 key insights to accelerate your learning",
        card2_meta: "Learning · 42K views · 3 days ago",
        card3_title: "Simple method to retain key concepts",
        card3_meta: "Method · 63K views · 5 days ago",
        menu_queue: "Add to queue",
        menu_save: "Save to Watch later",
        menu_share: "Share",
        gemini_new_chat: "New chat",
        gemini_recent: "Recent",
        gemini_prompt: "Summarize this video:",
        gemini_placeholder: "Ask Gemini...",
        gemini_thinking: "Analyzing YouTube video...",
        resp_title: "Video Summary",
        resp_intro: "Here are the key takeaways from the presentation:",
        p1_title: "Core Concepts:",
        p1_text: "focus on the essential pillars to quickly grasp the subject." ,
        p2_title: "Practical Application:",
        p2_text: "connect new ideas to real-world scenarios rather than memorizing in isolation.",
        p3_title: "Key Takeaways:",
        p3_text: "retain the 3 main takeaways to save valuable learning time."
      }
    },
    es: {
      nav_how: "Cómo funciona",
      nav_custom: "Personalizar prompt",
      nav_privacy: "Privacidad",
      nav_install: "Añadir a Firefox ↗",
      nav_home: "Inicio",
      hero_pill: "Disponible en Firefox Add-ons ↗",
      hero_title: "Un video de YouTube.<br><em>Un clic.</em> Tu resumen.",
      hero_text: "La extensión añade un botón nativo <strong>Resumir</strong> directamente en YouTube. Al hacer clic, abre Gemini con el enlace del video y <strong>tu prompt 100% personalizable</strong>.",
      hero_cta_add: "Añadir a Firefox",
      hero_cta_demo: "Ver la demo en vivo ↓",
      hero_cta_custom: "Personalizar prompt →",
      demo_tab_watch: "Página de Video",
      demo_tab_feed: "Inicio de YouTube",
      how_title: "YouTube → Resumir → Gemini.",
      how_subtitle: "Un flujo directo, sin copiar y pegar ni perder tiempo.",
      how_step1_title: "1. Elige tu video",
      how_step1_desc: "En YouTube, abre cualquier video o explora tu página de inicio, suscripciones y recomendaciones.",
      how_step2_title: "2. Haz clic en Resumir",
      how_step2_desc: "Un botón nativo se integra debajo del reproductor y en la parte superior del menú de tres puntos de cada video.",
      how_step3_title: "3. Gemini toma el relevo",
      how_step3_desc: "Gemini se abre en una nueva pestaña con tu instrucción personalizada y el enlace del video, listo para el análisis.",
      studio_kicker: "Libertad total",
      studio_title_section: "Tu prompt, personalizado por ti mismo.",
      studio_lead: "A diferencia de otras extensiones rígidas, tienes el <strong>control absoluto sobre la instrucción enviada a Gemini</strong>. Modifícala libremente en las opciones: resumen rápido, plan de acción, explicación sencilla o análisis profundo.",
      studio_test_title: "✦ Prueba tus instrucciones en vivo",
      preset_classic: "Resumen clásico",
      preset_points: "5 ideas clave",
      preset_plan: "Esquema detallado",
      preset_simple: "Explicación simple",
      preset_link: "Solo enlace",
      studio_input_label: "Texto configurado en las opciones de la extensión:",
      studio_hint: "La URL de YouTube del video se añade automáticamente al final de tu texto.",
      studio_preview_badge: "Vista previa enviada a Gemini",
      privacy_card_title: "Sin recopilación. Sin servidores intermedios.",
      privacy_card_desc: "Tu prompt se guarda <strong>únicamente de forma local en tu navegador Firefox</strong>. La extensión no tiene servidores, telemetría ni historial.",
      privacy_card_link: "Leer la política de privacidad →",
      install_title: "Añade Resumir a YouTube.",
      install_desc: "Gratis, ligero y de código abierto. Instálalo en un clic en Firefox.",
      install_btn: "Añadir a Firefox ↗",
      install_source: "Ver código fuente",
      footer_brand: "Resumen de YouTube por Gemini",
      footer_legal: "Proyecto independiente — no afiliado a YouTube, Google ni Mozilla.",
      privacy_kicker: "Transparencia",
      privacy_title: "Política de privacidad",
      privacy_subtitle: "La extensión no recopila ningún dato para el desarrollador.",
      privacy_summary_label: "En resumen",
      privacy_summary_text: "Nada se envía sin tu clic explícito en <b>Resumir</b>. La extensión no tiene servidores de recopilación, telemetría ni cuentas de usuario.",
      presets: {
        classic: { prompt: "Resúmeme el video:" },
        points: { prompt: "Dame las 5 ideas clave y puntos de acción de este video:" },
        plan: { prompt: "Redacta un esquema completo y estructurado con capítulos de este video:" },
        simple: { prompt: "Explica las nociones principales de este video en términos sencillos:" },
        link: { prompt: "" }
      },
      demo: {
        yt_search: "Buscar",
        yt_title: "Dominar temas complejos en menos de 15 minutos",
        yt_channel: "Ejemplo",
        yt_subs: "128 K suscriptores",
        yt_subscribe: "Suscribirse",
        yt_share: "Compartir",
        yt_btn: "Resumir",
        yt_views: "84 K vistas · hace 2 días",
        card1_title: "Dominar temas complejos en menos de 15 minutos",
        card1_meta: "Ejemplo · 84 K vistas · hace 2 días",
        card2_title: "Las 5 ideas clave para progresar más rápido",
        card2_meta: "Aprender · 42 K vistas · hace 3 días",
        card3_title: "Método sencillo para recordar lo esencial",
        card3_meta: "Método · 63 K vistas · hace 5 días",
        menu_queue: "Añadir a la cola",
        menu_save: "Guardar para ver más tarde",
        menu_share: "Compartir",
        gemini_new_chat: "Nuevo chat",
        gemini_recent: "Recientes",
        gemini_prompt: "Resúmeme el video:",
        gemini_placeholder: "Pregunta a Gemini...",
        gemini_thinking: "Analizando el video de YouTube...",
        resp_title: "Resumen del video",
        resp_intro: "Estos son los puntos clave de la presentación:",
        p1_title: "Conceptos fundamentales:",
        p1_text: "centrarse en los pilares esenciales para asimilar rápidamente el tema.",
        p2_title: "Puesta en práctica:",
        p2_text: "conectar nuevas ideas con casos reales en lugar de memorizarlas de forma aislada.",
        p3_title: "Síntesis:",
        p3_text: "retener las 3 lecciones principales para ahorrar tiempo valioso."
      }
    },
    zh: {
      nav_how: "工作原理",
      nav_custom: "自定义提示词",
      nav_privacy: "隐私政策",
      nav_install: "添加到 Firefox ↗",
      nav_home: "首页",
      hero_pill: "已在 Firefox Add-ons 上架 ↗",
      hero_title: "一个 YouTube 视频。<br><em>一键直达。</em> 你的专属摘要。",
      hero_text: "插件直接在 YouTube 中嵌入原生的<strong>总结</strong>按钮。一键即可打开 Gemini 并自动附带视频链接与<strong>完全自定义的提示词</strong>。",
      hero_cta_add: "添加到 Firefox",
      hero_cta_demo: "查看实时演示 ↓",
      hero_cta_custom: "自定义提示词 →",
      demo_tab_watch: "视频播放页",
      demo_tab_feed: "YouTube 首页推荐",
      how_title: "YouTube → 一键总结 → Gemini。",
      how_subtitle: "一键无缝衔接，无需复制粘贴，高效省时。",
      how_step1_title: "1. 选择任意视频",
      how_step1_desc: "在 YouTube 上打开任意视频，或直接在首页推荐、订阅列表和推荐信息流中浏览。",
      how_step2_title: "2. 点击“总结”按钮",
      how_step2_desc: "原生按钮直接嵌入视频播放器下方，以及信息流每个视频的三点菜单顶部。",
      how_step3_title: "3. Gemini 自动处理",
      how_step3_desc: "Gemini 会在全新标签页中打开，自动填入自定义提示词和视频链接，即刻开始智能分析。",
      studio_kicker: "完全自由",
      studio_title_section: "完全由你自主掌控的个性化提示词。",
      studio_lead: "与其他死板固定的插件不同，你对<strong>发送给 Gemini 的提示词拥有绝对控制权</strong>。在设置中随时调整以满足各种场景需求：快速摘要、行动清单、通俗科普或深度拆解。",
      studio_test_title: "✦ 实时测试提示词效果",
      preset_classic: "标准总结",
      preset_points: "5个核心观点",
      preset_plan: "结构化大纲",
      preset_simple: "通俗易懂",
      preset_link: "仅发送链接",
      studio_input_label: "插件选项中配置的提示词文本：",
      studio_hint: "视频的 YouTube 链接会自动附加在提示词文本末尾。",
      studio_preview_badge: "发送至 Gemini 的最终内容预览",
      privacy_card_title: "零数据收集。无任何中转服务器。",
      privacy_card_desc: "你的自定义提示词<strong>仅存储在 Firefox 本地浏览器中</strong>。该插件无自建服务器、无数据分析埋点、不记录任何历史记录。",
      privacy_card_link: "查看完整的隐私政策 →",
      install_title: "为 YouTube 增添一键总结能力。",
      install_desc: "免费、轻量、完全开源。Firefox 一键安装。",
      install_btn: "添加到 Firefox ↗",
      install_source: "查看源代码",
      footer_brand: "YouTube 视频总结 (Gemini)",
      footer_legal: "独立开源项目 — 与 YouTube、Google 或 Mozilla 无官方隶属关系。",
      privacy_kicker: "透明公开",
      privacy_title: "隐私政策",
      privacy_subtitle: "本插件不会为开发者收集任何用户数据。",
      privacy_summary_label: "简而言之",
      privacy_summary_text: "除非你主动点击<b>总结</b>按钮，否则不会发送任何内容。插件无后端服务器、无数据分析追踪，无需注册账户。",
      presets: {
        classic: { prompt: "请为我总结这个视频：" },
        points: { prompt: "请提炼出该视频的5个核心观点和行动建议：" },
        plan: { prompt: "请按章节为该视频撰写一份完整且结构化的大纲：" },
        simple: { prompt: "请用通俗易懂的语言解释该视频的主要概念：" },
        link: { prompt: "" }
      },
      demo: {
        yt_search: "搜索",
        yt_title: "15分钟内掌握复杂主题的关键方法",
        yt_channel: "示例频道",
        yt_subs: "12.8万位订阅者",
        yt_subscribe: "订阅",
        yt_share: "分享",
        yt_btn: "总结",
        yt_views: "8.4万次观看 · 2天前",
        card1_title: "15分钟内掌握复杂主题的关键方法",
        card1_meta: "示例频道 · 8.4万次观看 · 2天前",
        card2_title: "快速提升的5个核心认知与实践",
        card2_meta: "学习频道 · 4.2万次观看 · 3天前",
        card3_title: "高效记忆核心知识的极简方法",
        card3_meta: "高效方法 · 6.3万次观看 · 5天前",
        menu_queue: "添加到播放队列",
        menu_save: "保存到稍后观看",
        menu_share: "分享",
        gemini_new_chat: "新对话",
        gemini_recent: "近期记录",
        gemini_prompt: "请为我总结这个视频：",
        gemini_placeholder: "向 Gemini 提问...",
        gemini_thinking: "正在分析 YouTube 视频...",
        resp_title: "视频摘要",
        resp_intro: "以下是本视频的核心要点总结：",
        p1_title: "核心概念：",
        p1_text: "专注于核心基础，以便快速掌握该领域的关键知识。",
        p2_title: "实践应用：",
        p2_text: "将新概念与实际应用场景结合，而不是孤立记忆。",
        p3_title: "总结提炼：",
        p3_text: "掌握三大核心要领，大幅节省宝贵的学习时间。"
      }
    }
  };

  /* ---------------- Thème Sombre / Clair ---------------- */
  const getStoredTheme = () => {
    try {
      return localStorage.getItem('site-theme');
    } catch {
      return null;
    }
  };

  const applyTheme = (theme, persist = false) => {
    const normalized = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = normalized;

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', normalized === 'light' ? '#f7f8fc' : '#0a0a0f');
    }

    if (themeToggle) {
      const isLight = normalized === 'light';
      themeToggle.setAttribute('aria-pressed', String(isLight));
      themeToggle.setAttribute('aria-label', isLight ? 'Passer au thème sombre' : 'Passer au thème clair');
      themeToggle.title = isLight ? 'Passer au thème sombre' : 'Passer au thème clair';
    }

    if (persist) {
      try {
        localStorage.setItem('site-theme', normalized);
      } catch {}
    }
  };

  applyTheme(root.dataset.theme || (systemTheme.matches ? 'dark' : 'light'));

  themeToggle?.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true);
  });

  systemTheme.addEventListener?.('change', (event) => {
    if (!getStoredTheme()) applyTheme(event.matches ? 'dark' : 'light');
  });

  /* ---------------- Barre de Défilement Throttlée ---------------- */
  let scrollTicking = false;
  const updateScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 14);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = max > 0 ? `${Math.min(100, Math.max(0, (y / max) * 100))}%` : '0%';
    }
  };

  updateScroll();
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        updateScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ---------------- Navigation Mobile Accessible ---------------- */
  if (menuButton && nav) {
    const updateMenuText = (isOpen) => {
      const sr = menuButton.querySelector('.sr-only');
      if (sr) sr.textContent = isOpen ? 'Fermer le menu' : 'Ouvrir le menu';
    };

    const closeMenu = ({ restoreFocus = false } = {}) => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      updateMenuText(false);
      document.body.classList.remove('menu-open');
      if (restoreFocus) menuButton.focus({ preventScroll: true });
    };

    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      updateMenuText(open);
      document.body.classList.toggle('menu-open', open);

      if (open) nav.querySelector('a')?.focus({ preventScroll: true });
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu({ restoreFocus: true });
      }
    });

    document.addEventListener('click', (event) => {
      if (nav.classList.contains('open') && !nav.contains(event.target) && !menuButton.contains(event.target)) {
        closeMenu();
      }
    });

    const syncNavMode = () => {
      if (!compactNav.matches && nav.classList.contains('open')) closeMenu();
    };
    compactNav.addEventListener?.('change', syncNavMode);
  }

  /* ---------------- Animations d'apparition (Reveal) ---------------- */
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((item) => item.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    reveals.forEach((item) => revealObserver.observe(item));
  }

  /* ---------------- Studio de Personnalisation du Prompt ---------------- */
  const studioInput = document.querySelector('#interactive-prompt-input');
  const studioPreview = document.querySelector('#interactive-prompt-preview');
  const presetChips = document.querySelectorAll('.preset-chip');
  const sampleVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

  const updateStudioPreview = (value) => {
    if (!studioPreview) return;
    const clean = (typeof value === 'string' ? value : studioInput?.value || '').trim();
    const output = clean ? `${clean} ${sampleVideoUrl}` : sampleVideoUrl;
    studioPreview.textContent = output;
  };

  if (studioInput && studioPreview) {
    studioInput.addEventListener('input', () => {
      updateStudioPreview(studioInput.value);
      const currentLang = root.getAttribute('lang') || 'fr';
      const langPresets = translations[currentLang]?.presets || translations.fr.presets;
      presetChips.forEach((chip) => {
        const presetId = chip.dataset.presetId;
        const promptVal = langPresets[presetId]?.prompt ?? '';
        chip.classList.toggle('active', promptVal === studioInput.value);
      });
    });

    presetChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        presetChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const currentLang = root.getAttribute('lang') || 'fr';
        const langPresets = translations[currentLang]?.presets || translations.fr.presets;
        const presetId = chip.dataset.presetId;
        if (presetId && langPresets[presetId] !== undefined) {
          studioInput.value = langPresets[presetId].prompt;
          updateStudioPreview(studioInput.value);
        }
      });
    });

    updateStudioPreview(studioInput.value);
  }

  /* ---------------- Démonstration & Typographie Dynamique ---------------- */
  const flow = document.querySelector('.hero-visual[data-flow-phase]');
  const promptOutput = flow?.querySelector('.composer-prompt');
  let currentFullPrompt = 'Résume-moi la vidéo : youtube.com/watch?v=VIDEO_ID';

  const updateDemoText = (lang) => {
    if (!flow) return;
    const t = translations[lang]?.demo || translations.fr.demo;

    const elSearch = flow.querySelectorAll('.demo-yt-search-label');
    elSearch.forEach((el) => { el.textContent = t.yt_search; });

    const elTitle = flow.querySelector('.demo-yt-title');
    if (elTitle) elTitle.textContent = t.yt_title;

    const elChannel = flow.querySelector('.demo-yt-channel');
    if (elChannel) elChannel.textContent = t.yt_channel;

    const elSubs = flow.querySelector('.demo-yt-subs');
    if (elSubs) elSubs.textContent = t.yt_subs;

    const elSubBtn = flow.querySelector('.demo-yt-subscribe');
    if (elSubBtn) elSubBtn.textContent = t.yt_subscribe;

    const elShare = flow.querySelector('.demo-yt-share');
    if (elShare) elShare.textContent = t.yt_share;

    const elBtnTexts = flow.querySelectorAll('.demo-yt-btn-text');
    elBtnTexts.forEach((el) => { el.textContent = t.yt_btn; });

    const elViews = flow.querySelector('.demo-yt-views');
    if (elViews) elViews.textContent = t.yt_views;

    const elCard1Title = flow.querySelector('.demo-card1-title');
    if (elCard1Title) elCard1Title.textContent = t.card1_title;
    const elCard1Meta = flow.querySelector('.demo-card1-meta');
    if (elCard1Meta) elCard1Meta.textContent = t.card1_meta;

    const elCard2Title = flow.querySelector('.demo-card2-title');
    if (elCard2Title) elCard2Title.textContent = t.card2_title;
    const elCard2Meta = flow.querySelector('.demo-card2-meta');
    if (elCard2Meta) elCard2Meta.textContent = t.card2_meta;

    const elCard3Title = flow.querySelector('.demo-card3-title');
    if (elCard3Title) elCard3Title.textContent = t.card3_title;
    const elCard3Meta = flow.querySelector('.demo-card3-meta');
    if (elCard3Meta) elCard3Meta.textContent = t.card3_meta;

    const elMenuQueue = flow.querySelector('.demo-menu-queue');
    if (elMenuQueue) elMenuQueue.textContent = t.menu_queue;
    const elMenuSave = flow.querySelector('.demo-menu-save');
    if (elMenuSave) elMenuSave.textContent = t.menu_save;
    const elMenuShare = flow.querySelector('.demo-menu-share');
    if (elMenuShare) elMenuShare.textContent = t.menu_share;

    const elNewChat = flow.querySelector('.demo-gemini-new-chat');
    if (elNewChat) elNewChat.textContent = t.gemini_new_chat;
    const elRecent = flow.querySelector('.demo-gemini-recent');
    if (elRecent) elRecent.textContent = t.gemini_recent;

    const elUserPrompt = flow.querySelector('.demo-user-prompt');
    if (elUserPrompt) elUserPrompt.textContent = t.gemini_prompt;

    const elPlaceholder = flow.querySelector('.demo-gemini-placeholder');
    if (elPlaceholder) elPlaceholder.textContent = t.gemini_placeholder;

    const elThinking = flow.querySelector('.demo-gemini-thinking');
    if (elThinking) elThinking.textContent = t.gemini_thinking;

    const elRespTitle = flow.querySelector('.demo-gemini-resp-title');
    if (elRespTitle) elRespTitle.textContent = t.resp_title;
    const elRespIntro = flow.querySelector('.demo-gemini-resp-intro');
    if (elRespIntro) elRespIntro.textContent = t.resp_intro;

    const elP1Title = flow.querySelector('.demo-resp-p1-title');
    if (elP1Title) elP1Title.textContent = t.p1_title;
    const elP1Text = flow.querySelector('.demo-resp-p1-text');
    if (elP1Text) elP1Text.textContent = t.p1_text;

    const elP2Title = flow.querySelector('.demo-resp-p2-title');
    if (elP2Title) elP2Title.textContent = t.p2_title;
    const elP2Text = flow.querySelector('.demo-resp-p2-text');
    if (elP2Text) elP2Text.textContent = t.p2_text;

    const elP3Title = flow.querySelector('.demo-resp-p3-title');
    if (elP3Title) elP3Title.textContent = t.p3_title;
    const elP3Text = flow.querySelector('.demo-resp-p3-text');
    if (elP3Text) elP3Text.textContent = t.p3_text;

    currentFullPrompt = `${t.gemini_prompt} youtube.com/watch?v=VIDEO_ID`;
  };

  /* ---------------- Gestion de la Langue (i18n) ---------------- */
  const langButtons = document.querySelectorAll('.lang-btn');

  const setLanguage = (lang, persist = false) => {
    const activeLang = translations[lang] ? lang : 'fr';
    root.setAttribute('lang', activeLang);

    // Mettre à jour tous les éléments textuels data-i18n
    const translatableElements = document.querySelectorAll('[data-i18n]');
    translatableElements.forEach((el) => {
      const key = el.dataset.i18n;
      const text = translations[activeLang]?.[key];
      if (text !== undefined) {
        if (text.includes('<') && text.includes('>')) {
          el.innerHTML = text;
        } else {
          el.textContent = text;
        }
      }
    });

    // Mettre à jour les boutons du sélecteur
    langButtons.forEach((btn) => {
      const isSelected = btn.dataset.lang === activeLang;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    });

    // Mettre à jour les textes de la démo
    updateDemoText(activeLang);

    // Mettre à jour le studio de consignes selon la puce sélectionnée
    if (studioInput && studioPreview) {
      const activeChip = document.querySelector('.preset-chip.active');
      const presetId = activeChip?.dataset.presetId || 'classic';
      const langPresets = translations[activeLang]?.presets || translations.fr.presets;
      if (langPresets[presetId] !== undefined) {
        studioInput.value = langPresets[presetId].prompt;
        updateStudioPreview(studioInput.value);
      }
    }

    if (persist) {
      try {
        localStorage.setItem('site-lang', activeLang);
      } catch {}
    }
  };

  const getStoredLang = () => {
    try {
      const saved = localStorage.getItem('site-lang');
      if (saved && translations[saved]) return saved;
    } catch {}

    const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('zh')) return 'zh';
    return 'fr';
  };

  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang, true);
    });
  });

  const initialLang = getStoredLang();
  setLanguage(initialLang);

  /* ---------------- Démonstration Hero Animée & Contrôles ---------------- */
  if (!flow) return;

  const ctrlToggle = document.querySelector('#demo-ctrl-toggle');
  const ctrlReplay = document.querySelector('#demo-ctrl-replay');
  const modeTabs = document.querySelectorAll('.demo-mode-tab');
  const heroDemoTrigger = document.querySelector('#hero-demo-trigger');

  let currentMode = 'watch';
  let demoVisible = true;
  let isPaused = false;
  let flowAbortController = new AbortController();

  const sequences = {
    watch: [
      ['idle', 800],
      ['approach', 1050],
      ['click', 560],
      ['transfer', 1150],
      ['compose', null],
      ['send', 620],
      ['thinking', 1850],
      ['answer', 3550]
    ],
    feed: [
      ['idle', 850],
      ['approach', 1000],
      ['click', 780],
      ['select', 900],
      ['transfer', 1150],
      ['compose', null],
      ['send', 620],
      ['thinking', 1850],
      ['answer', 3550]
    ]
  };

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const waitWhileActive = async (ms, signal) => {
    let elapsed = 0;
    while (elapsed < ms) {
      if (signal?.aborted) throw new Error('aborted');
      if (isPaused || !demoVisible || document.hidden) {
        await sleep(200);
        continue;
      }
      const slice = Math.min(100, ms - elapsed);
      await sleep(slice);
      elapsed += slice;
    }
  };

  const waitUntilVisible = async (signal) => {
    while (isPaused || !demoVisible || document.hidden) {
      if (signal?.aborted) throw new Error('aborted');
      await sleep(200);
    }
  };

  const setMode = (mode) => {
    currentMode = mode;
    flow.dataset.flowMode = mode;
    modeTabs.forEach((tab) => {
      const match = tab.dataset.mode === mode;
      tab.classList.toggle('active', match);
      tab.setAttribute('aria-selected', String(match));
    });
  };

  const setPhase = (phase) => {
    flow.dataset.flowPhase = phase;
  };

  const getCursorTarget = (phase) => {
    if (currentMode === 'watch') return flow.querySelector('.yt-resume-action');
    if (phase === 'approach' || phase === 'click') return flow.querySelector('.yt-card-more');
    if (phase === 'select') return flow.querySelector('.yt-card-resume');
    return null;
  };

  const updateCursorTarget = (phase = flow.dataset.flowPhase || 'approach') => {
    const target = getCursorTarget(phase);
    if (!target) return;

    const stage = flow.querySelector('.demo-stage') || flow;
    const stageRect = stage.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    flow.style.setProperty('--cursor-target-x', `${targetRect.left - stageRect.left + targetRect.width * 0.52}px`);
    flow.style.setProperty('--cursor-target-y', `${targetRect.top - stageRect.top + targetRect.height * 0.55}px`);
  };

  const typePrompt = async (signal) => {
    if (!promptOutput) return;
    promptOutput.textContent = '';

    const perCharacter = Math.max(14, Math.min(28, Math.round(1050 / currentFullPrompt.length)));
    for (const character of currentFullPrompt) {
      await waitUntilVisible(signal);
      promptOutput.textContent += character;
      await waitWhileActive(perCharacter, signal);
    }
  };

  const resetGeminiPrompt = () => {
    if (promptOutput) promptOutput.textContent = '';
  };

  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => updateCursorTarget());
  }, { passive: true });

  const restartCurrentFlow = () => {
    flowAbortController.abort();
    flowAbortController = new AbortController();
    runFlow(flowAbortController.signal);
  };

  /* ---------------- Bouton "Voir la démo en direct" ---------------- */
  if (heroDemoTrigger) {
    heroDemoTrigger.addEventListener('click', (event) => {
      event.preventDefault();
      flow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      flow.classList.remove('demo-highlight');
      void flow.offsetWidth;
      flow.classList.add('demo-highlight');

      if (isPaused) {
        isPaused = false;
        flow.classList.remove('demo-paused');
        ctrlToggle?.classList.remove('is-paused');
      }
      restartCurrentFlow();
    });
  }

  /* ---------------- Contrôles Pause / Play / Replay / Modes ---------------- */
  if (ctrlToggle) {
    ctrlToggle.addEventListener('click', () => {
      isPaused = !isPaused;
      flow.classList.toggle('demo-paused', isPaused);
      ctrlToggle.classList.toggle('is-paused', isPaused);
      ctrlToggle.setAttribute('aria-label', isPaused ? 'Reprendre l’animation' : 'Mettre en pause l’animation');
      ctrlToggle.title = isPaused ? 'Reprendre l’animation' : 'Mettre en pause l’animation';
    });
  }

  if (ctrlReplay) {
    ctrlReplay.addEventListener('click', () => {
      if (isPaused) {
        isPaused = false;
        flow.classList.remove('demo-paused');
        ctrlToggle?.classList.remove('is-paused');
      }
      restartCurrentFlow();
    });
  }

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      if (mode && mode !== currentMode) {
        setMode(mode);
        restartCurrentFlow();
      }
    });
  });

  if (reducedMotion) {
    setMode('watch');
    if (promptOutput) promptOutput.textContent = currentFullPrompt;
    setPhase('answer');
    return;
  }

  if ('IntersectionObserver' in window) {
    const flowObserver = new IntersectionObserver((entries) => {
      demoVisible = Boolean(entries[0]?.isIntersecting);
    }, { threshold: 0.18 });
    flowObserver.observe(flow);
  }

  const runScenario = async (mode, signal) => {
    setMode(mode);
    resetGeminiPrompt();
    setPhase('idle');
    await waitWhileActive(120, signal);

    for (const [phase, duration] of sequences[mode]) {
      await waitUntilVisible(signal);
      setPhase(phase);

      if (phase === 'approach' || phase === 'click' || phase === 'select') {
        updateCursorTarget(phase);
      }

      if (phase === 'compose') {
        await typePrompt(signal);
        await waitWhileActive(260, signal);
      } else {
        await waitWhileActive(duration, signal);
      }
    }

    setPhase('idle');
    await waitWhileActive(900, signal);
  };

  const runFlow = async (signal) => {
    try {
      while (!signal?.aborted) {
        await waitUntilVisible(signal);
        await runScenario(currentMode, signal);
        if (signal?.aborted) break;
        const nextMode = currentMode === 'watch' ? 'feed' : 'watch';
        setMode(nextMode);
      }
    } catch {}
  };

  runFlow(flowAbortController.signal);
})();
