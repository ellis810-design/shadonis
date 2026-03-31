import { Interpretation } from "../types";

export const STATIC_INTERPRETATIONS: Omit<Interpretation, "id" | "updatedAt">[] = [
  {
    planet: "sun",
    angle: "mc",
    whatItFeelsLike:
      "You feel seen here. There's a natural spotlight on you — people notice your presence and you feel confident stepping into leadership roles.",
    bestUseCases:
      "Career advancement, public recognition, building a personal brand, leadership positions",
    watchOuts:
      "The visibility cuts both ways. You may feel pressure to always perform or live up to expectations.",
    shortTheme: "Where you shine publicly",
  },
  {
    planet: "sun",
    angle: "ic",
    whatItFeelsLike:
      "A deep sense of belonging, like coming home to yourself. You feel grounded and connected to your roots.",
    bestUseCases:
      "Settling down, self-discovery retreats, healing family dynamics, finding inner peace",
    watchOuts:
      "You might become too inward-focused and resist stepping into the outer world.",
    shortTheme: "Where you find your roots",
  },
  {
    planet: "sun",
    angle: "asc",
    whatItFeelsLike:
      "Your energy is magnetic here. You feel like the best version of yourself — radiant, alive, and full of purpose.",
    bestUseCases:
      "New beginnings, reinventing yourself, health and vitality, personal projects",
    watchOuts:
      "Can tip into ego-centrism if you're not mindful. Balance self-expression with listening.",
    shortTheme: "Where you come alive",
  },
  {
    planet: "sun",
    angle: "dsc",
    whatItFeelsLike:
      "You attract powerful partnerships here. Others mirror your light back to you in meaningful ways.",
    bestUseCases:
      "Finding a life partner, business partnerships, collaborative creative projects",
    watchOuts:
      "You may lose yourself in others' identities. Remember to maintain your own center.",
    shortTheme: "Where partnerships ignite",
  },
  {
    planet: "moon",
    angle: "mc",
    whatItFeelsLike:
      "Your emotional world becomes visible. People sense your sensitivity and it can draw them to you — or make you feel exposed.",
    bestUseCases:
      "Careers in nurturing fields, public emotional expression, community building",
    watchOuts:
      "Emotional vulnerability in public can be draining. Set boundaries.",
    shortTheme: "Where emotions lead your path",
  },
  {
    planet: "moon",
    angle: "ic",
    whatItFeelsLike:
      "Deep emotional nourishment. This place feels like a warm embrace — safe, familiar, and healing.",
    bestUseCases:
      "Healing, therapy, family bonding, emotional reset, creative introspection",
    watchOuts:
      "Can become a comfort zone that's hard to leave. Growth sometimes requires discomfort.",
    shortTheme: "Where your soul rests",
  },
  {
    planet: "moon",
    angle: "asc",
    whatItFeelsLike:
      "Your emotions are heightened and close to the surface. You feel things deeply and others can see it.",
    bestUseCases:
      "Emotional breakthroughs, deepening intuition, creative expression, caregiving",
    watchOuts:
      "Mood swings may intensify. Make sure you have emotional support systems.",
    shortTheme: "Where feelings surface",
  },
  {
    planet: "moon",
    angle: "dsc",
    whatItFeelsLike:
      "You attract emotionally nurturing relationships. Deep bonds form quickly and feel fated.",
    bestUseCases:
      "Finding emotionally fulfilling partnerships, deepening intimacy, family creation",
    watchOuts:
      "Emotional codependency is a risk. Keep your own emotional center strong.",
    shortTheme: "Where deep bonds form",
  },
  {
    planet: "venus",
    angle: "mc",
    whatItFeelsLike:
      "You're seen as charming and attractive here. Beauty, art, and social grace come naturally to your public image.",
    bestUseCases:
      "Creative careers, fashion, art, diplomacy, social media presence, luxury industries",
    watchOuts:
      "Superficiality can creep in. Make sure substance matches the style.",
    shortTheme: "Where beauty meets ambition",
  },
  {
    planet: "venus",
    angle: "asc",
    whatItFeelsLike:
      "You feel beautiful, magnetic, and at ease. Life takes on a pleasurable, sensual quality.",
    bestUseCases:
      "Romance, self-care, artistic pursuits, enjoying life's pleasures",
    watchOuts:
      "Overindulgence is tempting. Balance pleasure with purpose.",
    shortTheme: "Where love finds you",
  },
  {
    planet: "mars",
    angle: "mc",
    whatItFeelsLike:
      "Ambition ignites. You feel driven, competitive, and ready to conquer your professional world.",
    bestUseCases:
      "Entrepreneurship, competitive fields, athletics, military, bold career moves",
    watchOuts:
      "Aggression can alienate collaborators. Channel the fire wisely.",
    shortTheme: "Where ambition burns bright",
  },
  {
    planet: "mars",
    angle: "asc",
    whatItFeelsLike:
      "Raw energy and courage surge through you. You feel unstoppable and physically empowered.",
    bestUseCases:
      "Physical challenges, starting bold ventures, asserting boundaries, adventure",
    watchOuts:
      "Impulsiveness and conflict are heightened. Think before you act.",
    shortTheme: "Where courage awakens",
  },
  {
    planet: "jupiter",
    angle: "mc",
    whatItFeelsLike:
      "Opportunities rain down. You feel lucky, expansive, and destined for something big professionally.",
    bestUseCases:
      "Career expansion, higher education, teaching, publishing, international business",
    watchOuts:
      "Overconfidence can lead to overextension. Stay grounded in reality.",
    shortTheme: "Where opportunity knocks loudest",
  },
  {
    planet: "jupiter",
    angle: "asc",
    whatItFeelsLike:
      "Life feels abundant and optimistic. You radiate positivity and attract good fortune naturally.",
    bestUseCases:
      "Travel, education, spiritual growth, networking, starting fresh",
    watchOuts:
      "Excess in all forms. Jupiter amplifies everything — including bad habits.",
    shortTheme: "Where luck follows you",
  },
  {
    planet: "saturn",
    angle: "mc",
    whatItFeelsLike:
      "Life gets serious here. You feel the weight of responsibility but also the reward of building something lasting.",
    bestUseCases:
      "Long-term career building, mastering a craft, gaining authority, leadership through experience",
    watchOuts:
      "Heaviness and isolation can set in. Make sure you have outlets for joy.",
    shortTheme: "Where you build your legacy",
  },
  {
    planet: "saturn",
    angle: "ic",
    whatItFeelsLike:
      "Old patterns surface. This place triggers deep work around family, security, and what home means to you.",
    bestUseCases:
      "Therapy, breaking generational patterns, building solid foundations, maturing emotionally",
    watchOuts:
      "Can feel restrictive or lonely. The growth is real but it's slow.",
    shortTheme: "Where old lessons return",
  },
];
